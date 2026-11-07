// Run with: node scratch/check-ink-filter.cjs
// Speed-adaptive (One Euro) input filtering for timestamped pen samples.
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, file);
const { Stroke } = require('../objects/Stroke.ts');
const { inkSamples } = require('../engine/InkGeometry.ts');

const RATE_MS = 1000 / 200; // 200 Hz digitizer
// Deterministic pseudo-random jitter, ±0.8 px.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 1.6;

const draw = (input, zoom = 1) => {
  const stroke = new Stroke('#fff', 2, false, false, { zoom });
  let stable = [], through = 0;
  for (const p of input) {
    stroke.addPoint(p);
    assert.deepEqual(stroke.points.at(-1), p, 'tip is the exact pen sample: filtering adds no visible latency');
    if (stable.length) assert.deepEqual(inkSamples(stroke.points, 0, through), stable, 'rasterized prefix never changes');
    through = stroke.stableThrough;
    stable = inkSamples(stroke.points, 0, through);
  }
  assert.deepEqual(stroke.points[0], input[0], 'pen-down never moves');
  return stroke;
};
const untimed = input => input.map(({ t, ...p }) => p);
const rms = (points, distance) => Math.sqrt(points.reduce((s, p) => s + distance(p) ** 2, 0) / points.length);
const results = {};

// Slow and fast straight lines at several angles.
for (const speed of [40, 300, 1200]) { // px/s
  for (const angle of [0, 0.4, 1.2]) {
    const ux = Math.cos(angle), uy = Math.sin(angle);
    const n = Math.ceil(200 / (speed * RATE_MS / 1000));
    const input = Array.from({ length: n }, (_, i) => {
      const s = i * speed * RATE_MS / 1000, j = rand();
      return { x: s * ux - j * uy, y: s * uy + j * ux, pressure: 0.5, t: i * RATE_MS };
    });
    const distance = p => p.y * ux - p.x * uy;
    const after = rms(inkSamples(draw(input).points), distance);
    const before = rms(inkSamples(draw(untimed(input)).points), distance);
    assert.ok(after < before * (speed > 600 ? 1 : 0.8), `speed ${speed}: at least 20% less jitter than unfiltered (${after} vs ${before})`);
    results[`line_${speed}_${angle}`] = { before, after };
  }
}

// Circles: no shrinkage beyond ~1.5 px, jitter reduced.
for (const radius of [10, 40, 120]) {
  const speed = 250, n = Math.ceil(2 * Math.PI * radius / (speed * RATE_MS / 1000));
  const input = Array.from({ length: n }, (_, i) => {
    const a = i * speed * RATE_MS / 1000 / radius, r = radius + rand();
    return { x: r * Math.cos(a), y: r * Math.sin(a), pressure: 0.5, t: i * RATE_MS };
  });
  const radial = points => {
    const samples = inkSamples(points).slice(3, -3);
    const mean = samples.reduce((s, p) => s + Math.hypot(p.x, p.y), 0) / samples.length;
    return { mean, jitter: rms(samples, p => Math.hypot(p.x, p.y) - mean) };
  };
  const after = radial(draw(input).points), before = radial(draw(untimed(input)).points);
  assert.ok(before.mean - after.mean < 0.6, `radius ${radius}: shape preserved (${after.mean} vs ${before.mean})`);
  assert.ok(after.jitter < before.jitter * (radius < 20 ? 0.95 : 0.85), `radius ${radius}: less jitter (${after.jitter} vs ${before.jitter})`);
  results[`circle_${radius}`] = { before, after };
}

// A sharp corner written at normal speed stays within ~3 px.
{
  const input = [];
  for (let i = 0; i <= 40; i++) input.push({ x: i * 1.5, y: 0, pressure: 0.5, t: i * RATE_MS });
  for (let i = 1; i <= 40; i++) input.push({ x: 60, y: i * 1.5, pressure: 0.5, t: (40 + i) * RATE_MS });
  const samples = inkSamples(draw(input).points);
  const nearest = Math.min(...samples.map(p => Math.hypot(p.x - 60, p.y)));
  assert.ok(nearest < 3, `corner kept (${nearest} px)`);
  results.corner = nearest;
}

// Pressure noise is smoothed on interior controls; the tip keeps raw pressure.
{
  const input = Array.from({ length: 120 }, (_, i) => ({ x: i * 1.5, y: 0, pressure: 0.5 + (i % 2 ? 0.15 : -0.15), t: i * RATE_MS }));
  const stroke = draw(input);
  const interior = stroke.points.slice(2, -2).map(p => p.pressure);
  const spread = Math.max(...interior) - Math.min(...interior);
  assert.ok(spread < 0.15, `pressure jitter reduced (spread ${spread})`);
  assert.equal(stroke.points.at(-1).pressure, input.at(-1).pressure);
  results.pressureSpread = spread;
}

// Filtering is defined in screen pixels: identical at every zoom.
{
  const input = Array.from({ length: 150 }, (_, i) => ({ x: i * 1.4, y: 10 * Math.sin(i / 15) + rand(), pressure: 0.5, t: i * RATE_MS }));
  const base = draw(input);
  for (const zoom of [0.25, 4]) {
    const scaled = draw(input.map(p => ({ ...p, x: p.x / zoom, y: p.y / zoom })), zoom);
    assert.equal(scaled.points.length, base.points.length);
    scaled.points.forEach((p, i) => assert.ok(Math.hypot(p.x * zoom - base.points[i].x, p.y * zoom - base.points[i].y) < 1e-6));
  }
}

// Clone/translate after drawing keep identical geometry.
{
  const input = Array.from({ length: 60 }, (_, i) => ({ x: i * 2, y: rand(), pressure: 0.5, t: i * RATE_MS }));
  const stroke = draw(input);
  assert.deepEqual(stroke.clone().points, stroke.points);
  const before = stroke.points.map(p => ({ ...p }));
  stroke.translate(10, -5);
  stroke.points.forEach((p, i) => { assert.equal(p.x, before[i].x + 10); assert.equal(p.y, before[i].y - 5); });
}

console.log(JSON.stringify(results, null, 1));
console.log('PASS: speed-adaptive jitter reduction, exact tip, stable prefix, curves, corners, pressure, zoom, clone.');
