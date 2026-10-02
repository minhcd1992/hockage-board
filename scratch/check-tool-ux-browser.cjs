// Requires a local production server on 3100 and Chrome debugging on 9333.
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


  try {
    await call('Runtime.enable');await call('Page.enable');
    await call('Emulation.setDeviceMetricsOverride',{width:1100,height:850,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:'http://localhost:3100'});
    const until=async expression=>{for(let n=0;n<100;n++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,30));}throw new Error('Timeout: '+expression);};
    await until(`!!document.querySelector('canvas[data-ink-engine]') && !!document.querySelector('[data-active-tool]')`);
    const canvas=`document.querySelector('canvas[data-ink-engine]')`;
    const key=async (key,modifiers=0)=>{
      await call('Input.dispatchKeyEvent',{type:'keyDown',key,modifiers});
      await call('Input.dispatchKeyEvent',{type:'keyUp',key,modifiers});
    };
    const choose=async (k,tool)=>{await key(k);await until(`document.querySelector('[data-active-tool]')?.dataset.activeTool === '${tool}'`);};
    const cursor=()=>evaluate(`getComputedStyle(${canvas}).cursor`);
    const inputValue=selector=>evaluate(`document.querySelector('${selector}').value`);
    const color=async value=>evaluate(`(() => {
      const input=document.querySelector('input[type="color"]');
      const match=[...input.parentElement.querySelectorAll('button')].find(b=>{
        const c=document.createElement('canvas').getContext('2d');c.fillStyle=b.style.backgroundColor;return c.fillStyle==='${value}';
      }); if(!match)throw Error('Missing color');match.click();
    })()`);
    const point=async (type,x,y,button='left',buttons=1,clickCount=1)=>{
      const r=await evaluate(`(() => {const r=${canvas}.getBoundingClientRect();return {x:r.x,y:r.y};})()`);
      await call('Input.dispatchMouseEvent',{type,x:r.x+x,y:r.y+y,button,buttons,clickCount});
    };
    await choose('p','pen');await color('#ff0000');await key('2');
    assert.equal(await inputValue('input[type="number"]'),'1');
    const penCursor=await cursor();assert.ok(penCursor.includes('data:image/svg+xml'),'pen cursor is brush, not default');
    await choose('r','rect');await color('#00ccff');await key('3');
    assert.equal(await inputValue('input[type="number"]'),'2');assert.equal(await cursor(),'crosshair');
    await choose('p','pen');assert.equal(await inputValue('input[type="color"]'),'#ff0000');assert.equal(await inputValue('input[type="number"]'),'1');assert.equal(await cursor(),penCursor);
    await choose('r','rect');assert.equal(await inputValue('input[type="color"]'),'#00ccff');assert.equal(await inputValue('input[type="number"]'),'2');
    await choose('a','arrow');
    assert.equal(await evaluate(`document.querySelectorAll('select[aria-label]').length`),2);
    await evaluate(`(() => {const s=document.querySelector('select[aria-label]');s.value='arrow';s.dispatchEvent(new Event('change',{bubbles:true}));s.blur();})()`);
    await point('mousePressed',100,100);await point('mouseMoved',300,100);await point('mouseReleased',300,100,'left',0);
    await choose('l','line');
    assert.equal(await evaluate(`document.querySelectorAll('select[aria-label]').length`),0,'arrow controls disappear on L');
    assert.ok(await evaluate(`!!document.querySelector('button.active svg.lucide-minus')`),'shape button tracks L');
    assert.equal(await cursor(),'crosshair');
    await choose('a','arrow');assert.equal(await inputValue('select[aria-label]'),'arrow','arrow options retained');
    assert.ok(await evaluate(`(() => {const c=${canvas};return c.height===c.parentElement.clientHeight;})()`),'canvas follows property toolbar wrapping');
    await choose('v','select-object');
    await point('mousePressed',200,100);await point('mouseReleased',200,100,'left',0);
    await point('mouseMoved',200,100,'none',0,0);
    assert.equal(await cursor(),'move','selection hover cursor');
    // Enter object editing, then explicitly switch to L.
    await point('mousePressed',200,100,'left',1,2);await point('mouseReleased',200,100,'left',0,2);
    await until(`!document.querySelector('[data-active-tool]')`);
    await key('1');await until(`document.querySelector('input[type="number"]').value === '0.5'`);
    await choose('l','line');assert.equal(await evaluate(`document.querySelectorAll('select[aria-label]').length`),0);
    await choose('p','pen');assert.equal(await cursor(),penCursor);
    await point('mousePressed',500,300,'middle',4);assert.equal(await cursor(),'grabbing');
    await point('mouseReleased',500,300,'middle',0);assert.equal(await cursor(),penCursor,'pan restores actual pen cursor');
    await choose('h','highlighter');assert.equal(await inputValue('input[type="color"]'),'#ffff00');assert.ok((await cursor()).includes('data:image/svg+xml'));
    await choose('e','eraser-object');assert.ok((await cursor()).includes('data:image/svg+xml'));
    await choose('t','text');assert.equal(await cursor(),'text');
    await choose(' ','hand');assert.equal(await cursor(),'grab');
    await choose('p','pen');assert.equal(await inputValue('input[type="color"]'),'#ff0000');assert.equal(await cursor(),penCursor);
    assert.deepEqual(errors,[]);
    console.log('PASS: A/draw/L, properties and icon sync, independent pen/rect defaults, arrow settings, edit exit, cursors and pan restore, toolbar resize.');
  } finally {ws.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
