import type { ReactNode } from 'react';

export const blue = '#2563eb', orange = '#c2410c', green = '#0f766e', slate = '#64748b';
export const rad = (degrees: number) => degrees * Math.PI / 180;
export const number = (value: number) => Number(value.toFixed(2)).toLocaleString('vi-VN');

export function Figure({ id, title, caption, children, exercise = false }: { id: string; title: string; caption: string; children: ReactNode; exercise?: boolean }) {
  return <figure data-figure={exercise ? undefined : id} data-exercise-figure={exercise ? id : undefined} className="mx-auto my-5 w-full max-w-[600px] min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm leading-relaxed sm:p-4">
    <div className="mb-2 text-sm font-semibold text-slate-800">{title}</div>
    {children}
    <figcaption className="mt-2 border-t border-slate-200 pt-2 text-xs leading-relaxed text-slate-600">{caption}</figcaption>
  </figure>;
}

export function Diagram({ label, children, height = 260 }: { label: string; children: ReactNode; height?: number }) {
  return <svg viewBox={`0 0 560 ${height}`} role="img" aria-label={label} className="mx-auto my-2 block w-full max-w-[480px] rounded-lg bg-white" style={{ fontSize: 18 }}>
    {children}
  </svg>;
}

export function Arrow({ x, y, dx, dy, label, color = blue, offset = -12, labelDx = 0, dashed = false, width = 2.5 }: { x: number; y: number; dx: number; dy: number; label?: string; color?: string; offset?: number; labelDx?: number; dashed?: boolean; width?: number }) {
  const length = Math.hypot(dx, dy);
  if (length < 0.001) return null;
  const ux = dx / length, uy = dy / length, ex = x + dx, ey = y + dy;
  const head = Math.min(8, length * 0.35);
  return <g data-vector={label}>
    <line x1={x} y1={y} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '5 3' : undefined} />
    <path d={`M ${ex - ux * head - uy * head / 2} ${ey - uy * head + ux * head / 2} L ${ex} ${ey} L ${ex - ux * head + uy * head / 2} ${ey - uy * head - ux * head / 2}`} stroke={color} strokeWidth={width} fill="none" />
    {label && <text x={ex + labelDx} y={ey + offset} textAnchor="middle" fill={color} fontWeight="600" stroke="white" strokeWidth="4" paintOrder="stroke">{label}</text>}
  </g>;
}

// Angles are measured in screen coordinates: positive angles turn clockwise.
export function Angle({ x, y, radius = 30, from, to, label }: { x: number; y: number; radius?: number; from: number; to: number; label: string }) {
  if (Math.abs(to - from) < 0.5) return null;
  const start = rad(from), end = rad(to), mid = (start + end) / 2;
  const labelRadius = radius + 16;
  return <g data-angle={label}>
    <path d={`M ${x + radius * Math.cos(start)} ${y + radius * Math.sin(start)} A ${radius} ${radius} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${to > from ? 1 : 0} ${x + radius * Math.cos(end)} ${y + radius * Math.sin(end)}`} fill="none" stroke={slate} strokeWidth="1.5" />
    <text x={x + labelRadius * Math.cos(mid)} y={y + labelRadius * Math.sin(mid) + 5} textAnchor="middle" fill="#475569" stroke="white" strokeWidth="3" paintOrder="stroke">{label}</text>
  </g>;
}
