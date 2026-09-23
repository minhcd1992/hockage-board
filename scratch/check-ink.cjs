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
console.log('PASS: stroke cache invalidation and coalesced pointer input');
