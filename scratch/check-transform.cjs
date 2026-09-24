const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, filename);
const {Shape} = require('../objects/Shape.ts');
const {Stroke} = require('../objects/Stroke.ts');
const {Text} = require('../objects/Text.ts');
const {Scene} = require('../engine/Scene.ts');
const {editAnchors, moveAnchor, resizeObject, keepAspect, transformCopy} = require('../engine/ObjectTransform.ts');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);
function shape(type) {
 const s = new Shape(type,{x:20,y:30},'#fff',4);
 s.end = {x:120,y:80}; s.controlPoint = {x:80,y:0}; s.updateCenter(); s.selected = true;
 return s;
}
const arrow = shape('arrow'); arrow.rotation=.6; arrow.scaleX=2; arrow.scaleY=.7;
const oldStart = arrow.transformPoint(arrow.start);
const copy = transformCopy(arrow);
moveAnchor(copy,'end',{x:250,y:180},false);
near(copy.start.x,oldStart.x); near(copy.start.y,oldStart.y);
assert.deepEqual(copy.end,{x:250,y:180}); assert.equal(copy.size,4);
assert.equal(copy.scaleX,1); assert.equal(copy.scaleY,1); assert.equal(copy.rotation,0);
assert.equal(arrow.scaleX,2, 'original/history is untouched');
// Inspect actual arrowhead segments submitted to the canvas after endpoint editing and group scaling.
function heads(s) {
 let last; const segments=[];
 const ctx = new Proxy({moveTo(x,y){last={x,y}},lineTo(x,y){segments.push(Math.hypot(x-last.x,y-last.y));last={x,y}}}, {get(t,k){return k in t?t[k]:()=>{}}});
 s._draw(ctx); return segments.slice(-2);
}
heads(copy).forEach(length=>near(length,12));
resizeObject(copy,{x:0,y:0},.3,3);
heads(copy).forEach(length=>near(length,12));
assert.equal(copy.size,4);
moveAnchor(copy,'end',{x:200,y:130},true);
const angle=Math.atan2(copy.end.y-copy.start.y,copy.end.x-copy.start.x)/(Math.PI/12);
near(angle,Math.round(angle));
assert.equal(editAnchors([copy]).length,2);
assert.equal(editAnchors([copy,arrow]).length,0);
const curve=shape('bezier'), before={...curve.end};
moveAnchor(curve,'controlPoint',{x:70,y:-90},false);
near(curve.end.x,before.x); near(curve.end.y,before.y); assert.equal(editAnchors([curve]).length,3);
for(const type of ['rect','ellipse','arc','sine']) {
 const s=shape(type), start={...s.start}, end={...s.end};
 const uniform=keepAspect([s]), sx=2, sy=uniform?2:3;
 resizeObject(s,{x:0,y:0},sx,sy);
 near(s.start.x,start.x*sx); near(s.start.y,start.y*sy);
 near(s.end.x,end.x*sx); near(s.end.y,end.y*sy);
 assert.equal(s.scaleX,1); assert.equal(s.scaleY,1); assert.equal(s.size,4);
}
const rotated=shape('rect');rotated.rotation=.7;
const corner=rotated.transformPoint(rotated.start);
assert.ok(keepAspect([rotated]));resizeObject(rotated,{x:10,y:20},2,2);
const newCorner=rotated.transformPoint(rotated.start);
near(newCorner.x,10+(corner.x-10)*2);near(newCorner.y,20+(corner.y-20)*2);
const text=new Text({x:10,y:20},'Hello','#fff','sans-serif',24);
assert.ok(keepAspect([text]));resizeObject(text,{x:0,y:0},2,2);near(text.scaleX/text.scaleY,1);
const stroke=new Stroke('#fff',4);stroke.points=[{x:0,y:0,pressure:.2},{x:50,y:20,pressure:.8}];stroke.updateCenter();
resizeObject(stroke,{x:0,y:0},2,3);assert.equal(stroke.points[1].x,100);assert.equal(stroke.points[1].y,60);assert.equal(stroke.points[1].pressure,.8);assert.equal(stroke.size,4);
const scene=new Scene();scene.addObject(arrow);scene.objects=[copy];scene.saveState();scene.undo();assert.equal(scene.objects[0],arrow);scene.redo();assert.equal(scene.objects[0],copy);
copy.locked=true;const locked=transformCopy(copy);resizeObject(locked,{x:0,y:0},2,2);assert.deepEqual(locked.start,copy.start);assert.ok(locked.locked);assert.deepEqual(editAnchors([locked]),[]);
console.log('Transform checks passed: endpoints, arrowheads, curves, shapes, rotation, text, ink, history, locks.');

