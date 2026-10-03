import { Point } from '../types';

export const INK_LOOKAHEAD = 3;
const SUPPORT_PX = 8;
const MAX_CORRECTION_PX = 1.25;

// Local polynomial regression in a chord-aligned frame. Fit the normal offset
// only: this removes lateral tremor without dragging the pen along its path.
// A quadratic retains curvature; nearly straight windows use a line fit.
export function stabilizeInkPoint(points: Point[], index: number, zoom: number): Point {
  const point = points[index];
  if (index === 0 || index === points.length - 1) return point;
  let first = index, last = index;
  for (const direction of [-1, 1]) {
    let distance = 0;
    for (let step = 1; step <= INK_LOOKAHEAD; step++) {
      const i = index + step * direction;
      if (i < 0 || i >= points.length) break;
      const previous = points[i - direction];
      distance += Math.hypot(points[i].x - previous.x, points[i].y - previous.y) * zoom;
      if (distance > SUPPORT_PX) break;
      if (direction < 0) first = i; else last = i;
    }
  }
  if (last - first < 4 || first === index || last === index) return point;
  const before = points[first], after = points[last];
  const ax = point.x - before.x, ay = point.y - before.y;
  const bx = after.x - point.x, by = after.y - point.y;
  const lengths = Math.hypot(ax, ay) * Math.hypot(bx, by);
  // Do not fit across a deliberate corner, small loop or reversal.
  if (!lengths || (ax * bx + ay * by) / lengths < 0.5) return point;
  const chord = Math.hypot(after.x - before.x, after.y - before.y);
  const ux = (after.x - before.x) / chord, uy = (after.y - before.y) / chord;
  const sums = [0, 0, 0, 0, 0], offsets = [0, 0, 0];
  let previousT = -Infinity, minT = 0, maxT = 0;
  for (let i = first; i <= last; i++) {
    const dx = (points[i].x - point.x) * zoom;
    const dy = (points[i].y - point.y) * zoom;
    const t = (dx * ux + dy * uy) / SUPPORT_PX;
    const normal = -dx * uy + dy * ux;
    if (t <= previousT + 1e-6) return point;
    previousT = t;
    minT = Math.min(minT, t); maxT = Math.max(maxT, t);
    let power = 1;
    for (let j = 0; j < 5; j++) {
      sums[j] += power;
      if (j < 3) offsets[j] += normal * power;
      power *= t;
    }
  }
  const matrix = [
    [sums[0], sums[1], sums[2], offsets[0]],
    [sums[1], sums[2], sums[3], offsets[1]],
    [sums[2], sums[3], sums[4], offsets[2]],
  ];
  // Small, normalized 3x3 least-squares system with partial pivoting.
  for (let column = 0; column < 3; column++) {
    let pivot = column;
    for (let row = column + 1; row < 3; row++) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
    }
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    const divisor = matrix[column][column];
    if (Math.abs(divisor) < 1e-8) return point;
    for (let j = column; j < 4; j++) matrix[column][j] /= divisor;
    for (let row = 0; row < 3; row++) {
      if (row === column) continue;
      const factor = matrix[row][column];
      for (let j = column; j < 4; j++) matrix[row][j] -= factor * matrix[column][j];
    }
  }
  const determinant = sums[0] * sums[2] - sums[1] * sums[1];
  if (determinant < 1e-8) return point;
  const lineOffset = (offsets[0] * sums[2] - offsets[1] * sums[1]) / determinant;
  const bend = Math.abs(matrix[2][3]) * ((maxT - minT) / 2) ** 2;
  // Blend continuously instead of switching between straight/curved states.
  const blend = Math.max(0, Math.min(1, (bend - 0.2) / 0.4));
  const weight = blend * blend * (3 - 2 * blend);
  const offset = lineOffset * (1 - weight) + matrix[0][3] * weight;
  const correction = Math.max(-MAX_CORRECTION_PX, Math.min(MAX_CORRECTION_PX, offset)) / zoom;
  return { ...point, x: point.x - uy * correction, y: point.y + ux * correction };
}
