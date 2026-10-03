const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
const compile = source => ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
require.extensions['.ts'] = (module,file) => module._compile(compile(fs.readFileSync(file,'utf8')),file);
const {Stroke} = require('../objects/Stroke.ts');
const {inkSamples} = require('../engine/InkGeometry.ts');
const {stabilizeInkPoint} = require('../engine/InkStabilizer.ts');
const oldExports={};
new Function('require','exports',compile(fs.readFileSync('scratch/fixtures/quadratic-v4-stroke.txt','utf8')))(require,oldExports);
const OldStroke=oldExports.Stroke;
const draw=(Type,points,zoom=1)=>{
 const stroke=new Type('#123',2,false,false,{zoom});
 let stable=[],through=0;
 for(const p of points) {
  stroke.addPoint(p);
  assert.deepEqual(stroke.points.at(-1),p,'exact current pen position and pressure');
  if(Type===Stroke) {
   if(stable.length)assert.deepEqual(inkSamples(stroke.points,0,through),stable,'stable pixels must not change, including replaced tails');
   through=stroke.stableThrough;stable=inkSamples(stroke.points,0,through);
  }
 }
 assert.deepEqual(stroke.points[0],points[0]);
 return stroke;
};
const rms=(points,distance)=>Math.sqrt(points.reduce((sum,p)=>sum+distance(p)**2,0)/points.length);
const noise=i=>.65*Math.sin(i*2.2)+.3*Math.sin(i*.9);
const results={};
for(const slope of [0,.35,2]) {
 const ux=1/Math.hypot(1,slope),uy=slope*ux;
 const input=Array.from({length:200},(_,i)=>({x:i*1.2*ux-noise(i)*uy,y:i*1.2*uy+noise(i)*ux,pressure:.5}));
 const current=draw(Stroke,input),old=draw(OldStroke,input);
 const distance=p=>p.y*ux-p.x*uy;
 const after=rms(inkSamples(current.points),distance),before=rms(inkSamples(old.points),distance);
 assert.ok(after<before*.65,'at least 35% lower tremor on straight strokes at multiple angles');
 assert.deepEqual(current.clone().points,current.points,'clone must not filter again');
 results['line_'+slope]={before,after};
}
for(const radius of [8,40,100]) {
 const input=Array.from({length:Math.ceil(Math.PI*radius/1.2)},(_,i)=>{
  const angle=i*1.2/radius,r=radius+noise(i);
  return {x:r*Math.cos(angle),y:r*Math.sin(angle),pressure:.5};
 });
 const current=draw(Stroke,input),old=draw(OldStroke,input);
 const distance=p=>Math.hypot(p.x,p.y)-radius;
 const after=rms(inkSamples(current.points),distance),before=rms(inkSamples(old.points),distance);
 assert.ok(after<before*.8,'curved strokes lose tremor too');
 assert.ok(Math.max(...current.points.map(p=>p.y))>radius-1,'retain curve height');
 results['arc_'+radius]={before,after};
}
const wave=Array.from({length:200},(_,i)=>({x:i*1.2,y:15*Math.sin(i*1.2/28)+noise(i),pressure:.2+.6*i/199}));
const waveStroke=draw(Stroke,wave),oldWave=draw(OldStroke,wave);
const waveDistance=p=>p.y-15*Math.sin(p.x/28);
const after=rms(inkSamples(waveStroke.points),waveDistance),before=rms(inkSamples(oldWave.points),waveDistance);
assert.ok(after<before*.7,'S-curves retain curvature through inflections while reducing tremor');
assert.ok(Math.max(...waveStroke.points.map(p=>p.y))>14&&Math.min(...waveStroke.points.map(p=>p.y))< -14,'retain both S-curve lobes');
results.wave={before,after};
// Bound every correction in screen space; preserve pressure and input data.
const controls=oldWave.points,copy=JSON.stringify(controls);
for(let i=0;i<controls.length;i++) {
 const filtered=stabilizeInkPoint(controls,i,1);
 assert.ok(Math.hypot(filtered.x-controls[i].x,filtered.y-controls[i].y)<=1.250001);
 assert.equal(filtered.pressure,controls[i].pressure);
}
assert.equal(JSON.stringify(controls),copy,'filter cannot mutate its measured input');
for(const zoom of [.25,1,4]) {
 const scaled=draw(Stroke,wave.map(p=>({...p,x:p.x/zoom,y:p.y/zoom})),zoom);
 assert.equal(scaled.points.length,waveStroke.points.length);
 scaled.points.forEach((p,i)=>assert.ok(Math.hypot(p.x*zoom-waveStroke.points[i].x,p.y*zoom-waveStroke.points[i].y)<1e-8));
}
// Real corners/reversals and sparse fast strokes must not be mistaken for noise.
for(const tail of [i=>({x:30,y:i*2}),i=>({x:30-i*2,y:0})]) {
 const input=[...Array.from({length:16},(_,i)=>({x:i*2,y:0})),...Array.from({length:15},(_,i)=>tail(i+1))];
 assert.ok(draw(Stroke,input).points.some(p=>p.x===30&&p.y===0),'retain deliberate corner/reversal');
}
const sparse=[{x:0,y:0},{x:50,y:0},{x:75,y:25},{x:75,y:75},{x:100,y:100}];
assert.deepEqual(draw(Stroke,sparse).points,sparse,'do not fit across distant measurements');
console.log(JSON.stringify(results,null,2));
console.log('PASS: tremor reduction, straight/curved/S paths, extrema, corners, pressure, bounds, zoom, stable prefix, clone.');
