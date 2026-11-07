import React from 'react';

/** Đồ thị độ dịch chuyển – thời gian dạng đường gấp khúc qua các điểm (t, d). */
export function DisplacementTimeGraph({ points, title }: { points: [number, number][]; title: string }) {
  const tMax = Math.max(...points.map(p => p[0]));
  const dMin = Math.min(0, ...points.map(p => p[1]));
  const dMax = Math.max(1, ...points.map(p => p[1]));
  const pad = (dMax - dMin) * 0.15;
  const lo = dMin - (dMin < 0 ? pad : 0);
  const hi = dMax + pad;
  const px = (t: number) => 50 + (440 * t) / tMax;
  const py = (d: number) => 190 - (160 * (d - lo)) / (hi - lo);
  const times = [...new Set(points.map(p => p[0]))];
  const values = [...new Set([0, ...points.map(p => p[1])])];
  const fmt = (n: number) => String(n).replace('.', ',');

  return (
    <figure className="my-4 rounded-xl border border-slate-200 bg-white p-3">
      <svg viewBox="0 0 540 230" className="w-full max-w-xl" role="img" aria-label={title}>
        {times.map(t => (
          <g key={`t${t}`}>
            <line x1={px(t)} x2={px(t)} y1={30} y2={190} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={px(t)} y={py(0) + 18} textAnchor="middle" fontSize="13" fill="#475569">{fmt(t)}</text>
          </g>
        ))}
        {values.map(d => (
          <g key={`d${d}`}>
            <line x1={50} x2={490} y1={py(d)} y2={py(d)} stroke="#e2e8f0" />
            <text x={42} y={py(d) + 4} textAnchor="end" fontSize="13" fill="#475569">{fmt(d)}</text>
          </g>
        ))}
        <path d={`M 50 18 V 195 M 50 ${py(0)} H 505`} fill="none" stroke="#64748b" strokeWidth="1.5" />
        <text x={12} y={14} fontSize="14" fill="#475569">d (m)</text>
        <text x={500} y={py(0) - 8} fontSize="14" fill="#475569">t (s)</text>
        <polyline points={points.map(([t, d]) => `${px(t)},${py(d)}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" />
        {points.map(([t, d]) => <circle key={`p${t}`} cx={px(t)} cy={py(d)} r={4} fill="#2563eb" />)}
      </svg>
      <figcaption className="text-sm text-slate-500">{title}</figcaption>
    </figure>
  );
}
