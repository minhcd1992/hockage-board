// Requires a local production server on 3100 and Chrome debugging on 9333.
const assert = require('node:assert/strict');
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
    await call('Page.addScriptToEvaluateOnNewDocument', {source: `
      window.nativeRequests = 0;
      Object.defineProperty(navigator, 'ink', {configurable:true, value:{requestPresenter:async()=>{
        window.nativeRequests++; return {updateInkTrailStartPoint(){throw new Error('Unexpected native trail');}};
      }}});
    `});
    await call('Emulation.setDeviceMetricsOverride', {width:1280,height:900,deviceScaleFactor:2,mobile:false});
    await call('Page.navigate', {url:'http://localhost:3100' + (lesson ? '/?openLesson=/lesson/bai-1' : '/')});
    const until = async expression => {
      for(let n=0;n<100;n++) {
        if(await evaluate(expression)) return;
        await new Promise(resolve=>setTimeout(resolve,50));
      }
      throw new Error('Timed out: '+expression);
    };
    await until(`!![...document.querySelectorAll('canvas[data-ink-engine]')].find(c=>getComputedStyle(c).visibility==='visible'&&c.width>300)`);
    const origin=await evaluate(`(() => {
      window.inkCanvas=[...document.querySelectorAll('canvas[data-ink-engine]')].find(c=>getComputedStyle(c).visibility==='visible');
      const r=inkCanvas.getBoundingClientRect(); return {x:r.x,y:r.y};
    })()`);
    const input = (type,x,y,down) => call('Input.dispatchMouseEvent',{
      type,pointerType,force:down?.6:0,x:origin.x+x,y:origin.y+y,
      button: type==='mouseMoved' ? 'none' : 'left',buttons:down?1:0,clickCount:type==='mouseMoved'?0:1,
    });
    const gapClear=()=>evaluate(`(() => {
      return [inkCanvas,inkCanvas.previousElementSibling].every(c=>{
        const dpr=c.width/c.getBoundingClientRect().width;
        const data=c.getContext('2d').getImageData(230*dpr,85*dpr,130*dpr,30*dpr).data;
        return !data.some((v,i)=>i%4===3&&v>0);
      });
    })()`);
    for(const start of [100,400]) {
      await input('mouseMoved',start,100,false);
      assert.ok(await gapClear(),'hover cannot draw a bridge');
      await input('mousePressed',start,100,true);
      assert.ok(await gapClear(),'new pen-down cannot draw a bridge');
      for(let i=1;i<=10;i++) {
        await input('mouseMoved',start+i*7,100+Math.sin(i/2)*8,true);
        assert.ok(await gapClear(),'live stroke cannot cross the gap');
      }
      await input('mouseReleased',start+70,100+Math.sin(5)*8,false);
      assert.ok(await gapClear(),'committed strokes remain separate');
    }
    assert.equal(await evaluate('window.nativeRequests'),0,'native overlay never requested even when supported');
    assert.equal(await evaluate('inkCanvas.dataset.nativeInk'),'disabled');
    assert.ok(await evaluate(`(() => {
      const c=inkCanvas.previousElementSibling, dpr=c.width/c.getBoundingClientRect().width;
      return [100,400].every(x=>c.getContext('2d').getImageData(x*dpr,95*dpr,70*dpr,15*dpr).data.some((v,i)=>i%4===3&&v>0));
    })()`),'both strokes are present');
    const buttonSelector='button[aria-pressed][aria-label]';
    const pressFullscreen = async () => {
      const p=await evaluate(`(() => { const r=document.querySelector('${buttonSelector}').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
      await call('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',buttons:1,clickCount:1});
      await call('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',buttons:0,clickCount:1});
    };
    await pressFullscreen();
    await until(`document.fullscreenElement === document.documentElement && document.querySelector('${buttonSelector}').getAttribute('aria-pressed') === 'true'`);
    await pressFullscreen();
    await until(`!document.fullscreenElement && document.querySelector('${buttonSelector}').getAttribute('aria-pressed') === 'false'`);
    await pressFullscreen();
    await until('!!document.fullscreenElement');
    // Browser-originated exits (including Esc) update the toggle via fullscreenchange.
    await evaluate('document.exitFullscreen()');
    await until(`document.querySelector('${buttonSelector}').getAttribute('aria-pressed') === 'false'`);
    await evaluate(`document.documentElement.requestFullscreen = async () => {throw new Error('Denied for test');}`);
    await pressFullscreen();
    await until(`!!document.querySelector('[role="status"]') && !document.querySelector('${buttonSelector}').disabled`);
    assert.deepEqual(errors,[],'no uncaught runtime errors');
    console.log(JSON.stringify({result:'PASS',pointerType,lesson,separateStrokes:true,nativeRequests:0,fullscreen:'enter/button exit/external exit/rejection handled'}));
  } finally { ws.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
