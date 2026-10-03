// Requires a local production server on 3100 and Chrome debugging on 9333.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const baseline = require('./fixtures/spline-v3.json');
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
    await evaluate('document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))');
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
    assert.equal(diagnostics.engine, 'quadratic-v4.1', 'browser is serving the replacement engine');
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
      '../engine/InkStabilizer':'engine/InkStabilizer.ts', './Camera':'engine/Camera.ts', '../objects/Stroke':'objects/Stroke.ts',
      './LiveInk':'engine/LiveInk.ts',
    })) sources[name] = compile(fs.readFileSync(path,'utf8'));
    sources['./AcceptedStroke'] = compile(fs.readFileSync('scratch/fixtures/quadratic-v4-stroke.txt','utf8'));
    sources['../engine/InkGeometry'] = sources['./InkGeometry'];
    const benchmark = await evaluate(`(async () => {
      const sources = ${JSON.stringify(sources)}, modules = {};
      const load = name => {
        if (modules[name]) return modules[name].exports;
        const module = {exports:{}}; modules[name] = module;
        new Function('require','module','exports',sources[name])(load,module,module.exports);
        return module.exports;
      };
      const {Stroke} = load('../objects/Stroke');
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

      // Distance sampling revises the tip. At every event, compare the
      // incremental canvas against a full draw to catch stale cached tails.
      let mouseWorstMismatch=0;
      for(const zoom of [.5,1,2]) {
        camera.zoom=zoom;
        for(const width of [1,4]) {
          live.clear();
          const expected=document.createElement('canvas');expected.width=c.width;expected.height=c.height;
          const expectedCtx=expected.getContext('2d');
          const mouse=new Stroke('#2563eb',width,false,false,{zoom});
          const samples=Array.from({length:100},(_,i)=>({x:(30+i*.5)/zoom,y:(30+Math.round(8*Math.sin(i/30))+.7*Math.sin(i*1.9))/zoom,pressure:.2+i*.006}));
          samples.push({...samples.at(-1),pressure:1});
          // Include duplicates, an intentional corner, reversal and sparse fast input.
          samples.push({...samples.at(-1)},{x:160/zoom,y:60/zoom},{x:160/zoom,y:100/zoom},{x:160/zoom,y:60/zoom},{x:400/zoom,y:200/zoom});
          for(let i=0;i<samples.length;i++) {
            mouse.addPoint(samples[i]);
            if(!i)live.begin(mouse,event);else live.render(event);
            expectedCtx.clearRect(0,0,c.width,c.height);
            expectedCtx.save();camera.applyTransform(expectedCtx);mouse._draw(expectedCtx);expectedCtx.restore();
            const actual=ctx.getImageData(0,0,c.width,c.height).data;
            const reference=expectedCtx.getImageData(0,0,c.width,c.height).data;
            let different=0,ink=0,interiorMismatch=0;
            for(let j=3;j<actual.length;j+=4){if(actual[j]>128||reference[j]>128)ink++;if((actual[j]>128)!==(reference[j]>128))different++;if((actual[j]>200&&reference[j]<30)||(reference[j]>200&&actual[j]<30))interiorMismatch++;}
            mouseWorstMismatch=Math.max(mouseWorstMismatch,different/Math.max(1,ink));
            // At subpixel widths, tiny antialias changes can cross alpha 128.
            // Reject opaque-vs-empty mismatches, not those edge-only changes.
            if(interiorMismatch)throw new Error('mouse wet/dry interior drift at sample '+i+': '+interiorMismatch);
          }
          live.clear();
          if(ctx.getImageData(0,0,c.width,c.height).data.some(v=>v))throw new Error('mouse stroke left a tail after clear');
        }
      }
      camera.zoom=1;
      const baseline=${JSON.stringify(baseline)};
      const picture=document.createElement('canvas');picture.width=1000;picture.height=680;
      const pic=picture.getContext('2d');pic.fillStyle='white';pic.fillRect(0,0,picture.width,picture.height);
      pic.fillStyle='#17212b';pic.font='20px sans-serif';
      pic.fillText('Before: spline-v3 (pen)',24,32);pic.fillText('After: quadratic-v4.1 (pen + mouse)',510,32);
      for(const [row,key] of ['loop','staircase'].entries()) {
        const fixture=baseline.cases[key];
        pic.font='15px sans-serif';pic.fillStyle='#64748b';
        pic.fillText(row?'Rounded coordinates, magnified 5x':'Sparse loop, magnified 2.3x',24,60+row*380);
        for(let side=0;side<2;side++) {
          pic.save();pic.translate(side*486+24,70+row*380);pic.scale(row?5:2.3,row?5:2.3);
          if(side===0) {
            pic.strokeStyle='#ef4444';pic.lineWidth=row?1:2;pic.lineCap=pic.lineJoin='round';pic.beginPath();
            pic.moveTo(fixture.pen[0].x,fixture.pen[0].y);for(const p of fixture.pen.slice(1))pic.lineTo(p.x,p.y);pic.stroke();
          } else {
            const previewStroke=new Stroke('#2563eb',row?1:2);fixture.input.forEach(p=>previewStroke.addPoint(p));previewStroke._draw(pic);
          }
          if(!row) {pic.fillStyle='#17212b';for(const p of fixture.input){pic.beginPath();pic.arc(p.x,p.y,.7,0,Math.PI*2);pic.fill();}}
          pic.restore();
        }
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
      const {Stroke:AcceptedStroke}=load('./AcceptedStroke');
      const stabilized=document.createElement('canvas');stabilized.width=1000;stabilized.height=650;
      const preview=stabilized.getContext('2d');preview.fillStyle='white';preview.fillRect(0,0,1000,650);
      preview.fillStyle='#17212b';preview.font='20px sans-serif';
      preview.fillText('Before: accepted quadratic-v4',24,30);preview.fillText('After: tremor stabilization (v4.1)',510,30);
      const tremor=i=>.65*Math.sin(i*2.2)+.3*Math.sin(i*.9);
      const cases=[
        {label:'Straight stroke with small tremor (2.5x)',scale:2.5,points:Array.from({length:120},(_,i)=>({x:10+i*1.2,y:10+i*.24+tremor(i)}))},
        {label:'S-curve with the same tremor (2.5x)',scale:2.5,points:Array.from({length:120},(_,i)=>({x:10+i*1.2,y:25+15*Math.sin(i*1.2/20)+tremor(i)}))},
        {label:'Curved stroke with the same tremor (1.5x)',scale:1.5,points:Array.from({length:160},(_,i)=>({x:100+(40+tremor(i))*Math.cos(i/159*Math.PI*2),y:45+(40+tremor(i))*Math.sin(i/159*Math.PI*2)}))},
      ];
      for(const [row,test] of cases.entries()) {
        preview.fillStyle='#64748b';preview.font='14px sans-serif';preview.fillText(test.label,24,65+row*195);
        for(const [side,Type] of [AcceptedStroke,Stroke].entries()) {
          preview.save();preview.translate(24+side*486,75+row*195);preview.scale(test.scale,test.scale);
          const stroke=new Type(side?'#2563eb':'#ef4444',1.2);test.points.forEach(p=>stroke.addPoint(p));stroke._draw(preview);preview.restore();
        }
      }
      live.destroy();
      return {curveMismatchFraction:mismatch/occupied,mouseWorstMismatch,preview:picture.toDataURL(),stabilizerPreview:stabilized.toDataURL()};
    })()`);
    fs.writeFileSync('scratch/ink-quadratic-comparison.png',Buffer.from(benchmark.preview.split(',')[1],'base64'));
    fs.writeFileSync('scratch/ink-stabilizer-comparison.png',Buffer.from(benchmark.stabilizerPreview.split(',')[1],'base64'));
    delete benchmark.preview;
    delete benchmark.stabilizerPreview;
    assert.deepEqual(errors, [], 'no runtime exceptions');
    console.log(JSON.stringify({ result: 'PASS', pointerType, lesson, surface, during, diagnostics, benchmark }, null, 2));
  } finally {
    ws.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
