import { Point } from '../types';

export function inkRadius(point: Point, size: number, highlighter = false) {
  return highlighter ? size * 2 : size * (0.8 + 0.4 * Math.max(0, Math.min(1, point.pressure ?? 0.5))) / 2;
}

// Interpolating cubic spline. Tangents bisect adjacent segment directions;
// handles are bounded by the shorter adjacent edge to avoid loops when input
// spacing changes abruptly. The final segment uses a one-sided tangent until
// another real sample arrives. Every measured point remains on the curve.
export function inkSamples(points: Point[], from = 0, to = points.length - 1): Point[] {
  if (!points.length) return [];
  const result: Point[] = [points[Math.max(0, from - 1)]];
  const mix = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const handle = (before: Point, at: Point, after: Point, length: number) => {
    const incoming = Math.hypot(at.x - before.x, at.y - before.y);
    const outgoing = Math.hypot(after.x - at.x, after.y - at.y);
    const dx = (incoming ? (at.x - before.x) / incoming : 0) + (outgoing ? (after.x - at.x) / outgoing : 0);
    const dy = (incoming ? (at.y - before.y) / incoming : 0) + (outgoing ? (after.y - at.y) / outgoing : 0);
    const norm = Math.hypot(dx, dy);
    const distance = Math.min(length, incoming || length, outgoing || length) / 3;
    return norm > 1e-6 ? { x: dx / norm * distance, y: dy / norm * distance } : { x: 0, y: 0 };
  };
  for (let i = Math.max(1, from); i <= Math.min(to, points.length - 1); i++) {
    const a = points[i - 1], b = points[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const start = handle(points[i - 2] ?? a, a, b, length);
    const end = handle(a, b, points[i + 1] ?? b, length);
    const c1 = { x: a.x + start.x, y: a.y + start.y };
    const c2 = { x: b.x - end.x, y: b.y - end.y };
    const flatten = (p0: Point, p1: Point, p2: Point, p3: Point, t0: number, t1: number, depth: number) => {
      // Control-point distance from the chord bounds the curve's deviation.
      const dx = p3.x - p0.x, dy = p3.y - p0.y;
      const chord = Math.hypot(dx, dy);
      const deviation = chord ? Math.max(
        Math.abs(dx * (p1.y - p0.y) - dy * (p1.x - p0.x)),
        Math.abs(dx * (p2.y - p0.y) - dy * (p2.x - p0.x)),
      ) / chord : Math.max(Math.hypot(p1.x - p0.x, p1.y - p0.y), Math.hypot(p2.x - p0.x, p2.y - p0.y));
      if (deviation <= 0.1 || depth >= 10) {
        result.push({ ...p3, pressure: (a.pressure ?? 0.5) * (1 - t1) + (b.pressure ?? 0.5) * t1 });
        return;
      }
      const p01 = mix(p0, p1), p12 = mix(p1, p2), p23 = mix(p2, p3);
      const p012 = mix(p01, p12), p123 = mix(p12, p23), center = mix(p012, p123);
      const tm = (t0 + t1) / 2;
      flatten(p0, p01, p012, center, t0, tm, depth + 1);
      flatten(center, p123, p23, p3, tm, t1, depth + 1);
    };
    flatten(a, c1, c2, b, 0, 1, 0);
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
