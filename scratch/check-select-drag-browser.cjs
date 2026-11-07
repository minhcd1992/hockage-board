// Requires a local production server on 3100 and Chrome debugging on 9333.
// Selection UX: drag from empty space inside the selection frame, click
// tolerance, and click-to-isolate within a multi-selection.
const assert = require('node:assert/strict');

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

  try {
    await call('Runtime.enable'); await call('Page.enable');
    await call('Emulation.setDeviceMetricsOverride', { width: 1100, height: 850, deviceScaleFactor: 1, mobile: false });
    await call('Page.navigate', { url: 'http://localhost:3100' });
    const until = async expression => { for (let n = 0; n < 100; n++) { if (await evaluate(expression)) return; await sleep(30); } throw new Error('Timeout: ' + expression); };
    await until(`!!document.querySelector('canvas[data-ink-engine]') && !!document.querySelector('[data-active-tool]')`);
    const canvas = `document.querySelector('canvas[data-ink-engine]')`;
    const key = async (key, modifiers = 0) => {
      await call('Input.dispatchKeyEvent', { type: 'keyDown', key, modifiers });
      await call('Input.dispatchKeyEvent', { type: 'keyUp', key, modifiers });
    };
    const choose = async (k, tool) => { await key(k); await until(`document.querySelector('[data-active-tool]')?.dataset.activeTool === '${tool}'`); };
    const cursor = () => evaluate(`getComputedStyle(${canvas}).cursor`);
    const point = async (type, x, y, buttons = 1, modifiers = 0) => {
      const button = type === 'mouseMoved' && !buttons ? 'none' : 'left';
      const r = await evaluate(`(() => {const r=${canvas}.getBoundingClientRect();return {x:r.x,y:r.y};})()`);
      await call('Input.dispatchMouseEvent', { type, x: r.x + x, y: r.y + y, button, buttons, clickCount: 1, modifiers });
    };
    const hover = async (x, y) => { await point('mouseMoved', x, y, 0); return cursor(); };
    const drag = async (x0, y0, x1, y1, steps = 12) => {
      await point('mousePressed', x0, y0);
      for (let i = 1; i <= steps; i++) {
        await point('mouseMoved', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps);
        await sleep(8);
      }
      await point('mouseReleased', x1, y1, 0);
      await sleep(50);
    };

    // Ellipse with a hollow centre: bounding box (200,200)-(400,360).
    await choose('o', 'ellipse');
    await drag(200, 200, 400, 360);
    await choose('v', 'select-object');
    await point('mousePressed', 400, 280); await point('mouseReleased', 400, 280, 0);
    assert.equal(await hover(300, 280), 'move', 'hollow centre of a selected ellipse offers move');

    // A click (no drag) in the hollow centre keeps the selection.
    await point('mousePressed', 300, 280); await point('mouseReleased', 300, 280, 0);
    assert.equal(await hover(300, 280), 'move', 'click inside frame does not deselect');

    // Sub-threshold jitter does not move it.
    await drag(300, 280, 302, 281, 2);
    // Outline point at 45 degrees (away from the resize handles).
    const ox = 300 + 100 * Math.SQRT1_2, oy = 280 + 80 * Math.SQRT1_2;
    assert.equal(await hover(ox, oy), 'move', 'tiny jitter leaves the ellipse in place');

    // Dragging from the empty centre moves the whole ellipse.
    await drag(300, 280, 600, 330);
    assert.equal(await hover(ox, oy), 'default', 'old outline position is empty');
    assert.equal(await hover(ox + 300, oy + 50), 'move', 'outline followed the drag');

    // Undo restores the original position in one step.
    await key('z', 2);
    await sleep(50);
    assert.ok(['move', 'pointer'].includes(await hover(ox, oy)), 'undo restores pre-drag position');
    assert.ok(!['move', 'pointer'].includes(await hover(ox + 300, oy + 50)), 'undo removes the moved copy');

    // Clicking empty space outside the frame still deselects.
    await point('mousePressed', 900, 600); await point('mouseReleased', 900, 600, 0);
    assert.equal(await hover(300, 280), 'default', 'outside click clears selection');

    // Multi-selection: two rectangles with a gap between them.
    await choose('r', 'rect');
    await drag(100, 450, 200, 550);
    await drag(300, 450, 400, 550);
    await choose('v', 'select-object');
    await drag(80, 430, 420, 570); // marquee
    assert.equal(await hover(250, 500), 'move', 'gap between selected objects is inside the frame');
    await drag(250, 500, 350, 480); // grab the empty gap
    assert.equal(await hover(250, 520), 'move', 'left rectangle moved (+100,-20)');
    assert.equal(await hover(450, 520), 'move', 'right rectangle moved (+100,-20)');
    assert.equal(await hover(100, 520), 'default', 'old left edge is empty');
    // Click (no drag) on one selected object isolates it.
    await point('mousePressed', 200, 520); await point('mouseReleased', 200, 520, 0);
    assert.equal(await hover(500, 500), 'pointer', 'other rectangle is no longer selected');
    assert.equal(await hover(250, 500), 'move', 'clicked rectangle stays selected');

    assert.deepEqual(errors, []);
    console.log('PASS: drag from inside selection frame, click keeps selection, jitter threshold, undo, outside click deselects, multi-select gap drag, click-to-isolate.');
  } finally { ws.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
