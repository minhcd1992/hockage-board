// Geometry and input regression checks for relative tablets reported as a mouse.
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {Stroke}=require('../objects/Stroke.ts');
const {inkSamples}=require('../engine/InkGeometry.ts');
const raw=Array.from({length:80},(_,i)=>({x:i,y:Math.round(i*.35),pressure:.5}));
const stroke=new Stroke('#fff',1,false,false,{mouse:true});
let stable=[];
for(const p of raw) {
  stroke.addPoint(p);
  assert.deepEqual(stroke.points.at(-1),p,'tip follows this event without temporal lag');
  const committed=Math.max(0,stroke.points.length-3);
  assert.deepEqual(inkSamples(stroke.points,0,Math.max(0,committed-1)),stable.length?stable:inkSamples(stroke.points,0,0),'previously committed segments do not change');
  stable=inkSamples(stroke.points,0,committed);
}
const error=points=>points.slice(1,-1).reduce((sum,p)=>sum+Math.abs(p.y-.35*p.x),0);
assert.ok(error(stroke.points)<error(raw)*.8,'reduces quantized stair-step deviation by at least 20%');
for(let i=0;i<raw.length;i++)assert.ok(Math.hypot(stroke.points[i].x-raw[i].x,stroke.points[i].y-raw[i].y)<=.650001,'bounded position correction');
const count=stroke.points.length;stroke.addPoint({...raw.at(-1)});assert.equal(stroke.points.length,count,'duplicate pen-up cannot alter the curve');
assert.deepEqual(stroke.clone().points,stroke.points,'saved/copied geometry is identical');
for(const zoom of [.25,1,4]) {
  const s=new Stroke('#fff',1,false,false,{mouse:true,zoom});raw.forEach(p=>s.addPoint({...p,x:p.x/zoom,y:p.y/zoom}));
  s.points.forEach((p,i)=>assert.ok(Math.hypot(p.x*zoom-stroke.points[i].x,p.y*zoom-stroke.points[i].y)<1e-8,'same smoothing in screen pixels at every zoom'));
}
for(const points of [[{x:0,y:0},{x:10,y:0},{x:10,y:10}],[{x:0,y:0},{x:10,y:0},{x:0,y:0}]]) {
 const s=new Stroke('#fff',1,false,false,{mouse:true});points.forEach(p=>s.addPoint(p));assert.deepEqual(s.points,points,'preserve corners and reversals');
}
const pen=new Stroke('#fff',1);raw.forEach(p=>pen.addPoint(p));assert.deepEqual(pen.points,raw,'real pen measurements remain unchanged');
const next=new Stroke('#fff',1,false,false,{mouse:true});next.addPoint({x:500,y:500});assert.equal(next.points.length,1,'new stroke has no input history');
global.window={addEventListener(){},removeEventListener(){}};
const {PointerManager}=require('../input/PointerManager.ts');
const pm=new PointerManager({addEventListener(){},removeEventListener(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0})});
pm.useRawInput=()=>true;
const ev={pointerId:1,pointerType:'mouse',buttons:1,button:0,clientX:0,clientY:0,pressure:.5,timeStamp:100};
pm.handlePointerDown(ev);pm.pendingPoints=[];
pm.handlePointerRawUpdate({...ev,type:'pointerrawupdate',timeStamp:110,clientX:10});
pm.handlePointerMove({...ev,type:'pointermove',timeStamp:110,clientX:10});
pm.handlePointerMove({...ev,type:'pointermove',timeStamp:120,clientX:20,getCoalescedEvents:()=>[{...ev,timeStamp:110,clientX:10},{...ev,timeStamp:120,clientX:20}]});
pm.handlePointerRawUpdate({...ev,type:'pointerrawupdate',timeStamp:130,clientX:30});
pm.handlePointerRawUpdate({...ev,type:'pointerrawupdate',timeStamp:130,clientX:31});
assert.deepEqual(pm.pendingPoints.map(p=>p.x),[10,20,30,31],'raw dropout fallback, overlap removal and rounded timestamps');
console.log('PASS: mouse smoothing, bounded corrections, exact live tip, stable prefix, corners, zoom, clone, pen isolation, raw fallback.');
