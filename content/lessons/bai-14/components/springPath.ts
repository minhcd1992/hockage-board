/** Zig-zag spring drawn vertically from y1 to y2 at x (SVG path data). */
export function coil(x: number, y1: number, y2: number, n = 12, w = 10) {
  const seg = (y2 - y1) / (n + 1);
  let d = `M ${x} ${y1} L ${x} ${y1 + seg / 2}`;
  for (let i = 0; i < n; i++) d += ` L ${x + (i % 2 ? -w : w)} ${y1 + seg / 2 + seg * (i + 0.5)}`;
  return `${d} L ${x} ${y2 - seg / 2} L ${x} ${y2}`;
}
