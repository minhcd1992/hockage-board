// Requires a local production server on 3100 and Chrome debugging on 9333.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { execFileSync } = require('node:child_process');
const pointerType = process.argv[2] || 'mouse';
const lesson = process.argv[3] === 'lesson';

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
    await call('Page.navigate', { url: 'http://localhost:3100' + (lesson ? '/?openLesson=/lesson/bai-1' : '/') });
    for (let n = 0; n < 100; n++) {
      if (await evaluate(`(() => {
        window.testCanvas = [...document.querySelectorAll('canvas[data-ink-engine]')].find(c => getComputedStyle(c).visibility === 'visible');
        return !!window.testCanvas && window.testCanvas.width > 300 && ${lesson} === !!document.querySelector('iframe') && (!document.querySelector('iframe') || document.querySelector('iframe').contentDocument?.documentElement.hasAttribute('data-board-ready'));
      })()`)) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const surface = await evaluate(`(() => {
      const c = window.testCanvas;
      const r = c.getBoundingClientRect();
      window.inkEvents = {raw:0,move:0,strokes:0,mainClears:0};
      const main = c.previousElementSibling.getContext('2d'), clear = main.clearRect.bind(main);
      main.clearRect = (...args) => { window.inkEvents.mainClears++; return clear(...args); };
      window.addEventListener('pointerrawupdate', () => window.inkEvents.raw++);
      window.addEventListener('pointermove', () => window.inkEvents.move++);
      const ctx = c.getContext('2d'), stroke = ctx.fill.bind(ctx);
      ctx.fill = (...args) => { window.inkEvents.strokes++; return stroke(...args); };
      return {x:r.x+100,y:r.y+100,attributes:ctx.getContextAttributes(),hit:document.elementFromPoint(r.x+100,r.y+100)===c};
    })()`);
    assert.equal(surface.hit, true, 'ink canvas receives input directly');
    await call('Emulation.setCPUThrottlingRate', { rate: 4 });
    await call('Input.dispatchMouseEvent', { pointerType, force:0.5, type: 'mousePressed', x: surface.x, y: surface.y, button: 'left', buttons: 1, clickCount: 1 });
    for (let n = 1; n <= 50; n++) {
      await call('Input.dispatchMouseEvent', { pointerType, force:0.5, type: 'mouseMoved', x: surface.x + n * 8, y: surface.y + Math.sin(n / 5) * 30, button: 'left', buttons: 1 });
    }
    const during = await evaluate(`(() => {
      const c = window.testCanvas;
      return {...window.inkEvents, visible: c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)};
    })()`);
    assert.ok(during.visible && during.strokes > 0, 'live ink appears while the pointer is down');
    if (lesson) {
      for(let n=0;n<30;n++) {
        if(await evaluate(`document.querySelector('iframe').contentDocument.documentElement.hasAttribute('data-board-paused')`)) break;
        await new Promise(resolve => setTimeout(resolve,20));
      }
      assert.equal(await evaluate(`document.querySelector('iframe').contentDocument.documentElement.hasAttribute('data-board-paused')`), true, 'lesson pauses while writing');
    }
    await call('Input.dispatchMouseEvent', { pointerType, type: 'mouseReleased', x: surface.x + 400, y: surface.y + Math.sin(10) * 30, button: 'left', buttons: 0, clickCount: 1 });
    await call('Emulation.setCPUThrottlingRate', { rate: 1 });
    const finalized = await evaluate(`(() => {
      const c = window.testCanvas.previousElementSibling;
      return c.getContext('2d').getImageData(190,190,20,20).data.some((v,i)=>i%4===3&&v>0);
    })()`);
    assert.ok(finalized, 'final stroke survives pointerup');
    assert.equal(await evaluate('window.inkEvents.mainClears'), 0, 'pointerup does not redraw the scene');
    const diagnostics = await evaluate(`(() => { window.testCanvas.dispatchEvent(new Event('board-ink-diagnostics')); return JSON.parse(window.testCanvas.dataset.inkDiagnostics); })()`);
    if (lesson) {
      await new Promise(resolve => setTimeout(resolve,100));
      assert.equal(await evaluate(`document.querySelector('iframe').contentDocument.documentElement.hasAttribute('data-board-paused')`), false, 'lesson resumes after writing');
    }
    for (const [key, expected] of [['z', false], ['y', true]]) {
      const visible = await evaluate(`(() => {
        window.dispatchEvent(new KeyboardEvent('keydown',{key:'${key}',ctrlKey:true,bubbles:true}));
        const c = window.testCanvas.previousElementSibling;
        return c.getContext('2d').getImageData(190,190,20,20).data.some((v,i)=>i%4===3&&v>0);
      })()`);
      assert.equal(visible, expected, 'undo/redo preserves finalized ink');
    }

    const compile = source => ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const sources = {};
    for (const [name, path] of Object.entries({
      '../types':'types/index.ts', './InkGeometry':'engine/InkGeometry.ts',
      './Camera':'engine/Camera.ts', '../objects/Stroke':'objects/Stroke.ts',
      './LiveInk':'engine/LiveInk.ts',
    })) sources[name] = compile(fs.readFileSync(path,'utf8'));
    sources['../engine/InkGeometry'] = sources['./InkGeometry'];
    sources['./OldStroke'] = compile(execFileSync('git',['show','HEAD:objects/Stroke.ts'],{encoding:'utf8'}));
    sources['perfect-freehand'] = fs.readFileSync(require.resolve('perfect-freehand'),'utf8');
    const benchmark = await evaluate(`(async () => {
      const sources = ${JSON.stringify(sources)}, modules = {};
      const load = name => {
        if (modules[name]) return modules[name].exports;
        const module = {exports:{}}; modules[name] = module;
        new Function('require','module','exports',sources[name])(load,module,module.exports);
        return module.exports;
      };
      const {Stroke} = load('../objects/Stroke'), {Stroke:OldStroke} = load('./OldStroke');
      const {LiveInk} = load('./LiveInk'), {Camera} = load('./Camera');
      const {inkPath} = load('./InkGeometry');
      const c = document.createElement('canvas'); c.width=1600; c.height=900;
      const ctx = c.getContext('2d'); const camera = new Camera();
      // Force the unsupported-API path to exercise the portable engine too.
      Object.defineProperty(navigator,'ink',{value:undefined,configurable:true});
      const live = new LiveInk(c,ctx,camera); delete navigator.ink;
      const curved = new Stroke('#2563eb',4);
      const input = [{x:30,y:80},{x:45,y:40},{x:80,y:25},{x:115,y:40},{x:130,y:80},{x:115,y:120},{x:80,y:135},{x:45,y:120},{x:30,y:80}];
      const event = {isTrusted:false,pointerType:'pen',type:'pointermove',timeStamp:performance.now()};
      curved.addPoint(input[0]); live.begin(curved,event);
      for(const p of input.slice(1)) {curved.addPoint(p);live.render(event);}
      const wet = ctx.getImageData(0,0,1600,900).data;
      live.clear();
      ctx.save(); camera.applyTransform(ctx); curved._draw(ctx); ctx.restore();
      const dry = ctx.getImageData(0,0,1600,900).data;
      // Rasterized overlap can change antialiasing on edges, but the interiors
      // must occupy the same curve and leave no obsolete straight tail behind.
      let mismatch=0, occupied=0;
      for(let i=3;i<wet.length;i+=4) {
        if(wet[i]>128 || dry[i]>128) occupied++;
        if((wet[i]>128)!==(dry[i]>128)) mismatch++;
      }
      if(mismatch/occupied > 0.04) throw new Error('wet/dry curve diverged: '+mismatch+'/'+occupied);
      const picture=document.createElement('canvas');picture.width=720;picture.height=370;
      const pic=picture.getContext('2d');pic.fillStyle='white';pic.fillRect(0,0,720,370);
      pic.fillStyle='#17212b';pic.font='18px sans-serif';pic.fillText('Before: straight segments',24,30);pic.fillText('After: interpolating spline',375,30);
      for(let side=0;side<2;side++) {
        pic.save();pic.translate(side*350+20,45);pic.scale(1.8,1.8);
        if(side===0) {pic.strokeStyle='#ef4444';pic.lineWidth=4;pic.lineCap=pic.lineJoin='round';pic.beginPath();pic.moveTo(input[0].x,input[0].y);for(const p of input.slice(1))pic.lineTo(p.x,p.y);pic.stroke();}
        else {pic.fillStyle='#2563eb';pic.fill(inkPath(input,4));}
        pic.fillStyle='#17212b';for(const p of input){pic.beginPath();pic.arc(p.x,p.y,1.5,0,Math.PI*2);pic.fill();}
        pic.restore();
      }
      live.clear();
      const s = new Stroke('#ff0',8,false,true);
      const e = {isTrusted:false,pointerType:'pen',type:'pointermove',timeStamp:performance.now()};
      s.addPoint({x:20,y:20,pressure:0.5}); live.begin(s,e);
      for(const p of [{x:40,y:40},{x:20,y:40},{x:40,y:20}]) { s.addPoint(p); live.render(e); }
      if(c.style.opacity!=='0.4') throw new Error('highlight layer alpha');
      live.clear();
      if(ctx.getImageData(0,0,1600,900).data.some(v=>v)) throw new Error('cancel left ink');
      s.isDrawing=false; s._draw(ctx);
      const data=ctx.getImageData(0,0,1600,900).data;
      for(let i=3;i<data.length;i+=4) if(data[i]>103) throw new Error('highlight self-overlap darkened');
      const results = {};
      const strokes = 120, points = 80;
      for(const [name,Type] of [['old',OldStroke],['new',Stroke]]) {
        const scene=[];
        for(let j=0;j<strokes;j++) {
          const ink=new Type('#fff',2);
          for(let i=0;i<points;i++) ink.addPoint({x:10+i*2,y:10+j*3+Math.sin(i/5)*8,pressure:0.5});
          ink.isDrawing=false; scene.push(ink); ink._draw(ctx);
        }
        const samples=[];
        for(let run=0;run<15;run++) {
          const t=performance.now();
          for(let batch=0;batch<30;batch++) {
            if(name==='old') {ctx.clearRect(0,0,c.width,c.height);for(const ink of scene) ink._draw(ctx);}
            else scene[scene.length-1]._draw(ctx);
          }
          samples.push(performance.now()-t);
        }
        samples.sort((a,b)=>a-b);
        results[name+'30CommitsSubmissionMedianMs']=samples[7];
      }
      live.destroy();
      return {strokes,pointsPerStroke:points,curveMismatchFraction:mismatch/occupied,preview:picture.toDataURL(),...results};
    })()`);
    fs.writeFileSync('scratch/ink-curve-comparison.png',Buffer.from(benchmark.preview.split(',')[1],'base64'));
    delete benchmark.preview;
    assert.deepEqual(errors, [], 'no runtime exceptions');
    console.log(JSON.stringify({ result: 'PASS', pointerType, lesson, surface, during, diagnostics, benchmark }, null, 2));
  } finally {
    ws.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
