'use client';

// Shared building blocks for lesson figures and simulations (bài 7 trở đi).
import { useId, type ReactNode } from 'react';

export const blue = '#2563eb', orange = '#c2410c', green = '#0f766e', purple = '#7c3aed', slate = '#64748b', red = '#dc2626';
export const G = 9.8;
export const number = (v: number, digits = 2) => Number(v.toFixed(digits)).toLocaleString('vi-VN');
export const presetClass = 'rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800';
export const activePreset = '!border-blue-500 !bg-blue-50 !font-bold !text-blue-800';

export function Figure({ id, badge, title, caption, children }: { id: string; badge?: string; title: string; caption: string; children: ReactNode }) {
  return (
    <figure data-figure={id} className="mx-auto my-6 w-full max-w-[600px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 text-sm leading-relaxed shadow-xs sm:p-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
        <div className="text-sm font-bold text-slate-800 sm:text-base">{title}</div>
        {badge && <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">{badge}</span>}
      </div>
      {children}
      <figcaption className="mt-2.5 border-t border-slate-200/80 pt-2 text-xs leading-relaxed text-slate-600">{caption}</figcaption>
    </figure>
  );
}

export function Diagram({ label, children, height = 260 }: { label: string; children: ReactNode; height?: number }) {
  return (
    <svg viewBox={`0 0 560 ${height}`} role="img" aria-label={label} className="mx-auto my-2 block w-full max-w-[520px] rounded-xl border border-slate-200/80 bg-white" style={{ fontSize: 15 }}>
      {children}
    </svg>
  );
}

export function Arrow({ x, y, dx, dy = 0, color = blue, label, offset = -10, labelDx = 0, anchor = 'middle', width = 2.5, dashed = false }: {
  x: number; y: number; dx: number; dy?: number; color?: string; label?: string; offset?: number; labelDx?: number; anchor?: 'start' | 'middle' | 'end'; width?: number; dashed?: boolean;
}) {
  const length = Math.hypot(dx, dy);
  if (length < 1e-7) return null;
  const ux = dx / length, uy = dy / length, ex = x + dx, ey = y + dy, head = Math.min(8, length * 0.4);
  return (
    <g data-vector={label}>
      <line x1={x} y1={y} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '5 3' : undefined} />
      <path d={`M ${ex - ux * head - (uy * head) / 2} ${ey - uy * head + (ux * head) / 2} L ${ex} ${ey} L ${ex - ux * head + (uy * head) / 2} ${ey - uy * head - (ux * head) / 2}`} fill="none" stroke={color} strokeWidth={width} />
      {label && (
        <text x={ex + labelDx} y={ey + offset} textAnchor={anchor} fill={color} fontWeight="700" fontSize="14" stroke="white" strokeWidth="3.5" paintOrder="stroke">{label}</text>
      )}
    </g>
  );
}

export function Slider({ label, value, min, max, step = 1, unit = '', digits = 2, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; digits?: number; onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-0.5 flex items-center justify-between gap-1.5 text-[11.5px] font-semibold text-slate-700">
        <span className="truncate">{label}</span>
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11.5px] font-bold tabular-nums text-slate-900">{number(value, digits)}{unit ? ` ${unit}` : ''}</span>
      </label>
      <input id={id} aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} className="block h-6 w-full cursor-pointer accent-blue-600" />
    </div>
  );
}

export function Readout({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">{k}</div>
          <div className="font-mono text-sm font-bold tabular-nums text-slate-900">{v}</div>
        </div>
      ))}
    </div>
  );
}
