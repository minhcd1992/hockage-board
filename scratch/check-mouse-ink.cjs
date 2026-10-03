// Geometry and input regression checks for relative tablets reported as a mouse.
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {Stroke}=require('../objects/Stroke.ts');
const {inkSamples}=require('../engine/InkGeometry.ts');
// Shared pen/mouse replacement: quantify jaggedness against the old algorithm
// on identical rounded input, rather than checking only the new equations.
const baseline=require('./fixtures/spline-v3.json').cases.staircase;
const raw=baseline.input;
const stroke=new Stroke('#fff',1);
let stable=[],stableEnd=0;
for(const p of raw) {
  stroke.addPoint(p);
  assert.deepEqual(stroke.points.at(-1),p,'tip follows this event without temporal lag');
  if(stable.length) assert.deepEqual(inkSamples(stroke.points,0,stableEnd),stable,'already rasterized prefix cannot change');
  stableEnd=stroke.stableThrough;
  stable=inkSamples(stroke.points,0,stableEnd);
}
assert.deepEqual(stroke.points[0],raw[0],'preserve pen-down');
assert.ok(stroke.points.length < raw.length/2,'dense events do not each become a curve control');
const error=points=>points.slice(1,-1).reduce((sum,p)=>sum+Math.abs(p.y-.35*p.x),0)/Math.max(1,points.length-2);
const samples=inkSamples(stroke.points);
assert.ok(error(samples)<error(baseline.pen)*.8,'at least 20% lower stair-step deviation than old pen geometry');
const turns=points=> {
 let result=0,lastAngle;
 for(let i=1;i<points.length;i++) {
  const dx=points[i].x-points[i-1].x,dy=points[i].y-points[i-1].y;
  if(Math.hypot(dx,dy)<1e-8)continue;
  const angle=Math.atan2(dy,dx);
  if(lastAngle!==undefined)result+=Math.abs(Math.atan2(Math.sin(angle-lastAngle),Math.cos(angle-lastAngle)));
  lastAngle=angle;
 }
 return result;
};
assert.ok(turns(samples)<turns(baseline.pen)*.5,'at least 50% less direction oscillation than the interpolating spline');
const count=stroke.points.length,revision=stroke.revision;
stroke.addPoint({...raw.at(-1)});
assert.equal(stroke.points.length,count,'duplicate pen-up does not add a control');
assert.equal(stroke.revision,revision,'duplicate does not redraw');
assert.deepEqual(stroke.clone().points,stroke.points,'copy retains identical controls');
for(const zoom of [.25,1,4]) {
  const s=new Stroke('#fff',1,false,false,{zoom});raw.forEach(p=>s.addPoint({...p,x:p.x/zoom,y:p.y/zoom}));
  assert.equal(s.points.length,stroke.points.length);
  s.points.forEach((p,i)=>assert.ok(Math.hypot(p.x*zoom-stroke.points[i].x,p.y*zoom-stroke.points[i].y)<1e-8,'control spacing is consistent in screen pixels'));
}
// A replaced tail and stationary pressure must invalidate geometry even when
// point count does not increase. The immutable start must retain its pressure.
const small=new Stroke('#fff',2);
small.addPoint({x:0,y:0,pressure:.2});small.addPoint({x:.2,y:.1,pressure:.2});
const before=small.revision;
small.addPoint({x:.4,y:.2,pressure:.8});
assert.equal(small.points.length,2);assert.ok(small.revision>before);
assert.deepEqual(inkSamples(small.points).at(-1),{x:.4,y:.2,pressure:.8});
small.addPoint({x:.4,y:.2,pressure:1});
assert.equal(small.points[0].pressure,.2);assert.equal(inkSamples(small.points).at(-1).pressure,1);
assert.ok(inkSamples([{x:0,y:0},{x:20,y:0},{x:0,y:0}]).some(p=>p.x===20),'retain the extremum of deliberate retracing');
const safeRevision=small.revision;small.addPoint({x:NaN,y:0});assert.equal(small.revision,safeRevision);
// Sparse strokes form curves, with no overshoot beyond their control hull.
for(const points of [
 [{x:0,y:0},{x:20,y:0},{x:20,y:20},{x:40,y:20}],
 [{x:0,y:0},{x:20,y:0},{x:0,y:0}],
 [{x:0,y:0},{x:.0001,y:0},{x:1000,y:1}],
]) {
 const output=inkSamples(points);
 assert.ok(output.every(p=>p.x>=0&&p.x<=Math.max(...points.map(p=>p.x))&&p.y>=0&&p.y<=Math.max(...points.map(p=>p.y))),'quadratics stay within the measured hull');
 assert.deepEqual(output.at(-1),points.at(-1),'sparse/reversed paths retain endpoint');
}
assert.ok(turns(samples)<turns(baseline.mouse)*.7,'less direction oscillation than old bounded-mouse geometry too');
console.log(JSON.stringify({oldMouseTurning:turns(baseline.mouse),controls:stroke.points.length,rawSamples:raw.length,newMeanError:error(samples),oldMeanError:error(baseline.pen),newTurning:turns(samples),oldTurning:turns(baseline.pen)}));

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
console.log('PASS: approximating curves, noise reduction, exact tip, stable prefix, mutable tail/pressure, zoom, clone, hull, raw fallback.');
