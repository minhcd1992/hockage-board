// Requires a local production server on 3100 and Chrome debugging on 9333.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

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
  try {
    await call('Runtime.enable');
    await call('Page.enable');
    await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 2, mobile: false });
    await call('Page.navigate', { url: 'http://localhost:3100' });
    for (let n = 0; n < 100; n++) {
      if (await evaluate(`!!document.querySelector('canvas[style*="touch-action"]')?.width && document.querySelector('canvas[style*="touch-action"]').width > 300`)) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const surface = await evaluate(`(() => {
      const c = document.querySelector('canvas[style*="touch-action"]');
      const r = c.getBoundingClientRect();
      window.inkEvents = {raw:0,move:0,strokes:0};
      window.addEventListener('pointerrawupdate', () => window.inkEvents.raw++);
      window.addEventListener('pointermove', () => window.inkEvents.move++);
      const ctx = c.getContext('2d'), stroke = ctx.stroke.bind(ctx);
      ctx.stroke = (...args) => { window.inkEvents.strokes++; return stroke(...args); };
      return {x:r.x+100,y:r.y+100,attributes:ctx.getContextAttributes(),hit:document.elementFromPoint(r.x+100,r.y+100)===c};
    })()`);
    assert.equal(surface.hit, true, 'ink canvas receives input directly');
    await call('Emulation.setCPUThrottlingRate', { rate: 4 });
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: surface.x, y: surface.y, button: 'left', buttons: 1, clickCount: 1 });
    for (let n = 1; n <= 50; n++) {
      await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: surface.x + n * 8, y: surface.y + Math.sin(n / 5) * 30, button: 'left', buttons: 1 });
    }
    const during = await evaluate(`(() => {
      const c = document.querySelector('canvas[style*="touch-action"]');
      return {...window.inkEvents, visible: c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)};
    })()`);
    assert.ok(during.visible && during.strokes > 0, 'live ink appears while the pointer is down');
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: surface.x + 400, y: surface.y + Math.sin(10) * 30, button: 'left', buttons: 0, clickCount: 1 });
    await call('Emulation.setCPUThrottlingRate', { rate: 1 });
    const finalized = await evaluate(`(() => {
      const c = document.querySelectorAll('canvas')[1];
      return c.getContext('2d').getImageData(190,190,20,20).data.some((v,i)=>i%4===3&&v>0);
    })()`);
    assert.ok(finalized, 'final stroke survives pointerup');
    for (const [key, expected] of [['z', false], ['y', true]]) {
      const visible = await evaluate(`(() => {
        window.dispatchEvent(new KeyboardEvent('keydown',{key:'${key}',ctrlKey:true,bubbles:true}));
        const c = document.querySelectorAll('canvas')[1];
        return c.getContext('2d').getImageData(190,190,20,20).data.some((v,i)=>i%4===3&&v>0);
      })()`);
      assert.equal(visible, expected, 'undo/redo preserves finalized ink');
    }

    // Test restoration against real browser pixels, including transparent ink,
    // clipping, DPR and expiration. No mocked CanvasRenderingContext2D here.
    const compiled = ts.transpileModule(fs.readFileSync('engine/InkPrediction.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const restored = await evaluate(`(async () => {
      const exports = {}; ${compiled}
      const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 200;
      const ctx = canvas.getContext('2d'); ctx.fillStyle='rgba(10,100,200,0.4)'; ctx.fillRect(0,0,200,120);
      const ink = new exports.InkPrediction(canvas,ctx);
      const before = Array.from(ctx.getImageData(0,0,320,200).data);
      for (const dpr of [1,2]) {
        for(const points of [[{x:30,y:30},{x:50,y:50}],[{x:0,y:0},{x:15,y:5}]]) {
          ink.draw(points,'red',6,dpr); ink.clear();
          const after = ctx.getImageData(0,0,320,200).data;
          if (!before.every((v,i)=>v===after[i])) return false;
        }
      }
      ink.draw([{x:30,y:30},{x:50,y:50}],'red',6,2);
      await new Promise(resolve => setTimeout(resolve,80));
      const after = ctx.getImageData(0,0,320,200).data;
      return before.every((v,i)=>v===after[i]);
    })()`);
    assert.equal(restored, true, 'prediction restores original pixels and expires');
    assert.deepEqual(errors, [], 'no runtime exceptions');
    console.log(JSON.stringify({ result: 'PASS', surface, during, predictionRestoration: restored }, null, 2));
  } finally {
    ws.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
