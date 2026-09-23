import { Point } from '../types';

export function inkRadius(point: Point, size: number, highlighter = false) {
  return highlighter ? size * 2 : size * (0.8 + 0.4 * Math.max(0, Math.min(1, point.pressure ?? 0.5))) / 2;
}

// Causal geometry: each sample adds a tapered capsule ending at the actual
// sample. No delayed control points, positional filtering or final reshaping.
// All subpaths use the same winding so one fill gives uniform highlighter alpha.
export function inkPath(points: Point[], size: number, highlighter = false, from = 0): Path2D {
  const path = new Path2D();
  const disk = (p: Point, r: number) => {
    path.moveTo(p.x + r, p.y);
    path.arc(p.x, p.y, r, 0, Math.PI * 2);
    path.closePath();
  };
  if (!points.length || size <= 0) return path;
  if (from === 0) disk(points[0], inkRadius(points[0], size, highlighter));
  for (let i = Math.max(1, from); i < points.length; i++) {
    const a = points[i - 1], b = points[i];
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
