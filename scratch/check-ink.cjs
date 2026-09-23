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
};
const { Stroke } = require('../objects/Stroke.ts');
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
stroke.color = '#f00';
stroke._draw(ctx);
assert.equal(renderedPath, previous, 'color does not rebuild geometry');
for (const change of [
  () => { stroke.size = 4; },
  () => { scale = 2; },
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
let predictions = [];
raw.onPrediction = points => { predictions = points; };
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
assert.equal(predictions.length, 2, 'overlong predictions are clipped');
assert.equal(predictions[0].x, 35);
assert.equal(predictions[1].x, 62, 'prediction is bounded to 32 CSS pixels');
assert.equal(raw.pendingPoints[0].x, 30, 'predictions never enter real ink');
raw.handlePointerMove({ ...move, getPredictedEvents: () => [{ ...event, timeStamp: now + 17 }] });
assert.ok(Math.abs(predictions[0].x - (30 - 20 * 16 / 17)) < 0.001, 'prediction is bounded to 16 ms');
raw.handlePointerMove({ ...move, timeStamp: now - 100 });
assert.equal(predictions.length, 0, 'do not predict stale input');
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
raw.destroy();
console.log('PASS: stroke cache, coalesced/raw input, prediction limits, cancellation and fallback');
