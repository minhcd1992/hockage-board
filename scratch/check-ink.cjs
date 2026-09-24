// Run with: node scratch/check-ink.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

global.Path2D = class {
  moveTo() {}
  lineTo() {}
  closePath() {}
  arc() {}
};
const { Stroke } = require('../objects/Stroke.ts');
const { inkSamples } = require('../engine/InkGeometry.ts');
const curve = [{x:0,y:40,pressure:0.2},{x:12,y:12,pressure:0.5},{x:40,y:0,pressure:0.8},{x:70,y:12,pressure:0.6}];
const smooth = inkSamples(curve);
assert.ok(smooth.length > curve.length, 'sparse curved input gets curved interpolation');
for (const p of curve) assert.ok(smooth.some(s => s.x === p.x && s.y === p.y), 'spline preserves measured positions');
assert.deepEqual(smooth.at(-1), curve.at(-1), 'tail ends at measured cursor position');
assert.deepEqual(inkSamples(curve.slice(0,3),1,1), inkSamples(curve,1,1), 'segments with lookahead never change again');
for (const points of [
  [{x:0,y:0},{x:0,y:0},{x:0,y:0}],
  [{x:0,y:0},{x:20,y:0},{x:0,y:0}],
  [{x:0,y:0},{x:0.00001,y:0},{x:100,y:1}],
]) assert.ok(inkSamples(points).every(p => Number.isFinite(p.x) && Number.isFinite(p.y)), 'duplicates, reversals and uneven spacing stay finite');
let scale = 1;
let renderedPath;
const ctx = {
  save() {}, restore() {},
  getTransform: () => ({ a: scale, b: 0 }),
  fill: path => { renderedPath = path; },
};
const stroke = new Stroke('#fff', 2);
stroke.addPoint({ x: 0, y: 0, pressure: 0.5 });
stroke.addPoint({ x: 20, y: 10, pressure: 0.8 });
stroke.isDrawing = false;
stroke._draw(ctx);
let previous = renderedPath;
stroke._draw(ctx);
assert.equal(renderedPath, previous, 'unchanged ink reuses its path');
scale = 2;
stroke._draw(ctx);
assert.equal(renderedPath, previous, 'zoom reuses world-space geometry');
stroke.color = '#f00';
stroke._draw(ctx);
assert.equal(renderedPath, previous, 'color does not rebuild geometry');
for (const change of [
  () => { stroke.size = 4; },
  () => stroke.translate(5, 3),
  () => stroke.addPoint({ x: 30, y: 15 }),
  () => { stroke.points = stroke.points.map(p => ({ ...p })); },
]) {
  change();
  stroke._draw(ctx);
  assert.notEqual(renderedPath, previous, 'geometry changes invalidate the path');
  previous = renderedPath;
}

const listeners = {};
global.window = { addEventListener() {}, removeEventListener() {} };
let reads = 0;
const element = {
  addEventListener: (name, callback) => { listeners[name] = callback; },
  removeEventListener() {}, setPointerCapture() {},
  getBoundingClientRect: () => { reads++; return { left: 10, top: 20 }; },
};
const { PointerManager } = require('../input/PointerManager.ts');
const pointer = new PointerManager(element);
const event = { button: 0, pointerId: 1, pointerType: 'pen', clientX: 20, clientY: 30, pressure: 0.7 };
listeners.pointerdown(event);
pointer.pendingPoints = [];
reads = 0;
pointer.handlePointerMove({ ...event, clientX: 40, getCoalescedEvents: () => [event, { ...event, clientX: 40 }] });
assert.equal(reads, 1, 'one layout read for the whole sample batch');
assert.deepEqual(pointer.pendingPoints.map(p => p.x), [10, 30]);
assert.equal(pointer.pendingPoints[1].pressure, 0.7);
pointer.handlePointerMove({ ...event, pointerId: 2 });
assert.equal(pointer.pendingPoints.length, 2, 'another pointer cannot append ink');
pointer.destroy();

const raw = new PointerManager(element);
raw.useRawInput = () => true;
let commits = 0, cancels = 0;
raw.onPointerUp = () => commits++;
raw.onPointerCancel = () => cancels++;
listeners.pointerdown(event);
raw.pendingPoints = [];
const now = performance.now();
const move = { ...event, clientX: 40, type: 'pointermove', timeStamp: now,
  getPredictedEvents: () => [
    { ...event, clientX: 45, timeStamp: now + 8 },
    { ...event, clientX: 80, timeStamp: now + 12 },
  ],
};
raw.handlePointerRawUpdate({ ...move, type: 'pointerrawupdate' });
raw.handlePointerMove(move);
assert.equal(raw.pendingPoints.length, 1, 'raw/move must not duplicate samples');
raw.handlePointerUp({ ...event, pointerId: 2 });
assert.equal(raw.isPointerDown, true, 'unrelated pointerup cannot commit');
raw.handlePointerCancel(event);
assert.equal(commits, 0, 'cancel discards rather than committing');
assert.equal(cancels, 1);
assert.equal(raw.pendingPoints.length, 0);
listeners.pointerdown(event);
raw.pendingPoints = [];
raw.handlePointerMove(move);
assert.equal(raw.pendingPoints.length, 1, 'next gesture falls back without raw events');
raw.handleBlur();
assert.equal(raw.isPointerDown, false, 'blur releases drawing state');
assert.equal(raw.activePointers.size, 0, 'blur forgets captured pointers');
assert.equal(raw.pendingPoints.length, 0);
raw.destroy();
const highlight = new Stroke('#ff0', 5, false, true);
highlight.addPoint({x:10,y:10});
assert.equal(highlight.clone().isHighlighter, true, 'copy keeps highlighting');
assert.ok(highlight.getBoundingBox().w >= 20, 'bounds include highlighter width');

let clock = 100;
const realPerformance = global.performance;
global.performance = {now: () => clock};
const scheduled = new Map();
let frameId = 0;
global.requestAnimationFrame = callback => { scheduled.set(++frameId, callback); return frameId; };
global.cancelAnimationFrame = id => scheduled.delete(id);
const scheduler = require('../lib/lessonAnimation.ts');
let times = [];
scheduler.requestLessonFrame(time => times.push(time));
clock = 110;
scheduler.setLessonPaused(true);
assert.equal(scheduled.size, 0, 'pause cancels scheduled browser frame');
const canceled = scheduler.requestLessonFrame(() => { throw new Error('canceled callback ran'); });
scheduler.cancelLessonFrame(canceled);
clock = 1110;
assert.equal(scheduler.lessonNow(), 110, 'simulation clock freezes');
scheduler.setLessonPaused(false);
clock = 1120;
const batch = [...scheduled.values()]; scheduled.clear(); batch.forEach(callback => callback(clock));
assert.deepEqual(times, [120], 'resume excludes pause duration and keeps pending callback');
global.performance = realPerformance;
console.log('PASS: world-space cache, raw input, cancellation, fallback, highlighter clone/bounds, lesson pause/resume');
