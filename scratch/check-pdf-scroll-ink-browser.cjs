// Requires a local production server on 3100 and Chrome debugging on 9333.
// Usage: node scratch/check-pdf-scroll-ink-browser.cjs <multi-page.pdf>
// 1) Every PDF tab gets its own working scrollbar (not only the first tab).
// 2) Pen-up hands ink to the main canvas without a frame where neither shows it.
const assert = require('node:assert/strict');
const path = require('node:path');
const pdfPath = path.resolve(process.argv[2] || '');

(async () => {
  const targets = await (await fetch('http://127.0.0.1:9333/json')).json();
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const requests = new Map();
  const errors = [];
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    const pending = requests.get(message.id);
    if (pending) {
      requests.delete(message.id);
      message.error ? pending.reject(message.error) : pending.resolve(message.result);
    }
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    requests.set(++id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const until = async (expression, tries = 200) => { for (let n = 0; n < tries; n++) { if (await evaluate(expression)) return; await sleep(50); } throw new Error('Timeout: ' + expression); };

  try {
    await call('Runtime.enable'); await call('Page.enable'); await call('DOM.enable');
    await call('Emulation.setDeviceMetricsOverride', { width: 1100, height: 850, deviceScaleFactor: 1, mobile: false });
    await call('Page.navigate', { url: 'http://localhost:3100' });
    await until(`!!document.querySelector('canvas[data-ink-engine]') && !!document.querySelector('[data-active-tool]')`);

    // ---- Pen-up handoff ------------------------------------------------------
    const visibleDraft = `[...document.querySelectorAll('canvas[data-ink-engine]')].find(c => c.offsetParent && getComputedStyle(c.parentElement).visibility !== 'hidden')`;
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'p' }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'p' });
    await until(`document.querySelector('[data-active-tool]')?.dataset.activeTool === 'pen'`);
    // Instrument: at pen-up (same task), record whether the main canvas already
    // holds the ink and whether the live layer is hidden by CSS.
    await evaluate(`(() => {
      const draft = ${visibleDraft};
      const main = draft.previousElementSibling; // mainCanvas precedes the live layer
      window.__inkProbe = { draft, main, samples: [] };
      window.addEventListener('pointerup', () => {
        const ink = (c) => { const d = c.getContext('2d').getImageData(380, 300, 60, 40).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; };
        const probe = window.__inkProbe;
        probe.atUp = { mainInk: ink(probe.main), draftInk: ink(probe.draft), draftHidden: getComputedStyle(probe.draft).visibility === 'hidden' };
        let frames = 0;
        const tick = () => { probe.samples.push({ hidden: getComputedStyle(probe.draft).visibility === 'hidden', draftInk: ink(probe.draft), mainInk: ink(probe.main) }); if (++frames < 5) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }, { once: true });
    })()`);
    const r = await evaluate(`(() => {const r=${visibleDraft}.getBoundingClientRect();return {x:r.x,y:r.y};})()`);
    const mouse = (type, x, y, buttons = 1) => call('Input.dispatchMouseEvent', { type, x: r.x + x, y: r.y + y, button: 'left', buttons, clickCount: 1 });
    await mouse('mousePressed', 300, 320);
    for (let i = 1; i <= 20; i++) { await mouse('mouseMoved', 300 + i * 12, 320 + Math.sin(i / 3) * 10); await sleep(8); }
    await mouse('mouseReleased', 540, 320, 0);
    await until(`window.__inkProbe.samples.length >= 5`);
    const probe = await evaluate(`({ atUp: window.__inkProbe.atUp, samples: window.__inkProbe.samples })`);
    assert.ok(probe.atUp.mainInk > 0, 'main canvas has the stroke in the same task as pen-up');
    assert.ok(probe.atUp.draftHidden, 'live layer hidden via CSS (committed with the main canvas frame)');
    assert.equal(probe.atUp.mainInk, probe.atUp.draftInk, 'committed pixels match the live ink exactly');
    assert.ok(probe.samples[0].draftInk > 0, 'live pixels are not erased before the main canvas frame is presented');
    const last = probe.samples.at(-1);
    assert.ok(!last.hidden && last.draftInk === 0 && last.mainInk > 0, 'live layer is cleared and restored afterwards');
    // A new stroke right after must be visible again.
    await mouse('mousePressed', 300, 500); await mouse('mouseMoved', 400, 520); await sleep(30);
    assert.equal(await evaluate(`getComputedStyle(window.__inkProbe.draft).visibility`), 'visible', 'next stroke is visible');
    await mouse('mouseReleased', 400, 520, 0);

    // ---- Scrollbars for several PDF tabs -------------------------------------
    const scrollbarState = `(() => {
      const boards = [...document.querySelectorAll('canvas[data-ink-engine]')].map(c => c.closest('div'));
      const active = boards.find(b => b.offsetParent && getComputedStyle(b).visibility !== 'hidden');
      const bars = [...active.parentElement.querySelectorAll('div')].filter(d => d.style.width === '16px' && d.style.height === '100%');
      return bars.map(b => ({ display: b.style.display, thumb: b.firstElementChild?.style.height }));
    })()`;
    const fs = require('node:fs'), os = require('node:os');
    const openPdf = async n => {
      // Distinct names: re-selecting the identical file fires no change event.
      const copy = path.join(os.tmpdir(), `board-scroll-${n}.pdf`);
      fs.copyFileSync(pdfPath, copy);
      const { root } = await call('DOM.getDocument', { depth: -1 });
      const { nodeId } = await call('DOM.querySelector', { nodeId: root.nodeId, selector: 'input[type="file"]' });
      await call('DOM.setFileInputFiles', { nodeId, files: [copy] });
    };
    const tabCount = () => evaluate(`document.querySelectorAll('canvas[data-ink-engine]').length`);
    const initial = await tabCount();
    for (let n = 1; n <= 3; n++) {
      await openPdf(n);
      await until(`document.querySelectorAll('canvas[data-ink-engine]').length === ${initial + n}`);
      await sleep(2500); // pages render asynchronously
      const bars = await evaluate(scrollbarState);
      assert.equal(bars.length, 1, `PDF tab ${n}: one scrollbar in its own board`);
      assert.equal(bars[0].display, 'block', `PDF tab ${n}: scrollbar visible without scrolling first`);
      assert.ok(parseFloat(bars[0].thumb) >= 40, `PDF tab ${n}: thumb sized`);
    }
    assert.equal(await evaluate(`document.querySelectorAll('[id^="v-scrollbar"]').length`), 0, 'no shared DOM ids remain');

    assert.deepEqual(errors, []);
    console.log('PASS: flicker-free pen-up handoff, exact pixels, next stroke visible; scrollbars in every PDF tab.');
  } finally { ws.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
