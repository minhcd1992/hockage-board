import { Point } from '../types';

export function inkRadius(point: Point, size: number, highlighter = false) {
  return highlighter ? size * 2 : size * (0.8 + 0.4 * Math.max(0, Math.min(1, point.pressure ?? 0.5))) / 2;
}

const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  pressure: ((a.pressure ?? 0.5) + (b.pressure ?? 0.5)) / 2,
});

// Approximating quadratic B-spline: measurements are control points, not knots
// the curve must pass through. Adjacent quadratics meet at edge midpoints with
// identical derivatives. Only the final span reaches the measured tip.
// Span i uses controls i-2, i-1, i; span 0 is the initial dot. LiveInk keeps
// the spans touched by Stroke sampling and local stabilization replaceable.
export function inkSamples(points: Point[], from = 0, to = points.length - 1): Point[] {
  if (!points.length) return [];
  const first = Math.max(1, from);
  if (first > points.length) return [];
  const result: Point[] = [first === 1 ? points[0] : midpoint(points[first - 2], points[first - 1])];
  const flatten = (a: Point, control: Point, b: Point, depth = 0) => {
    // Parametric chord error also catches collinear reversals, which a simple
    // distance-to-line test would collapse. Pressure follows the same curve.
    const error = Math.hypot(a.x - 2 * control.x + b.x, a.y - 2 * control.y + b.y) / 4;
    const pressureError = Math.abs((a.pressure ?? 0.5) - 2 * (control.pressure ?? 0.5) + (b.pressure ?? 0.5)) / 4;
    if ((error <= 0.05 && pressureError <= 0.01) || depth >= 12) {
      result.push(b);
      return;
    }
    const left = midpoint(a, control), right = midpoint(control, b);
    const center = midpoint(left, right);
    flatten(a, left, center, depth + 1);
    flatten(center, right, b, depth + 1);
  };
  for (let i = first; i <= Math.min(to, points.length - 1); i++) {
    const a = i === 1 ? points[0] : midpoint(points[i - 2], points[i - 1]);
    const b = i === points.length - 1 ? points[i] : midpoint(points[i - 1], points[i]);
    const control = points[i - 1];
    const dxIn = control.x - a.x, dyIn = control.y - a.y;
    const dxOut = b.x - control.x, dyOut = b.y - control.y;
    const lengths = Math.hypot(dxIn, dyIn) * Math.hypot(dxOut, dyOut);
    // A deliberate near-U-turn is a cusp, not jitter. Retain its extremum;
    // otherwise the approximating curve would pull a retraced stroke inward.
    if (lengths > 0 && (dxIn * dxOut + dyIn * dyOut) / lengths < -0.8) {
      result.push(control, b);
    } else {
      flatten(a, control, b);
    }
  }
  return result;
}

// Same-winding tapered capsules approximate the spline, including pressure.
export function inkPath(points: Point[], size: number, highlighter = false, from = 0, to = points.length - 1): Path2D {
  const samples = inkSamples(points, from, to);
  const path = new Path2D();
  const disk = (p: Point, r: number) => {
    path.moveTo(p.x + r, p.y);
    path.arc(p.x, p.y, r, 0, Math.PI * 2);
    path.closePath();
  };
  if (!samples.length || size <= 0) return path;
  disk(samples[0], inkRadius(samples[0], size, highlighter));
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    const ra = inkRadius(a, size, highlighter), rb = inkRadius(b, size, highlighter);
    const dx = b.x - a.x, dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length > 0) {
      const nx = -dy / length, ny = dx / length;
      path.moveTo(a.x + nx * ra, a.y + ny * ra);
      path.lineTo(a.x - nx * ra, a.y - ny * ra);
      path.lineTo(b.x - nx * rb, b.y - ny * rb);
      path.lineTo(b.x + nx * rb, b.y + ny * rb);
      path.closePath();
    }
    disk(b, rb);
  }
  return path;
}
