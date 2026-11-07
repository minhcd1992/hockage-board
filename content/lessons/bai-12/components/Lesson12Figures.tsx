'use client';

import { useState } from 'react';
import { Arrow, Diagram, Figure, Readout, Slider, G, activePreset, blue, green, number, orange, presetClass, purple, red, slate } from '@/components/lesson/FigureKit';

const FLAG = 0.02; // flag width (m)
const D1 = 0.3, D2 = 0.3; // gate 1 → collision, collision → gate 2 (m)

/** Speed after travelling `dist` along the direction of v; null if the cart stops first. */
function travel(v: number, dist: number, mu: number, tiltDeg: number) {
  const s = Math.sign(v);
  const a = -mu * G - s * G * Math.sin((tiltDeg * Math.PI) / 180); // along direction of motion
  const v2 = v * v + 2 * a * dist;
  return v2 <= 1e-6 ? null : s * Math.sqrt(v2);
}

type Trial = { kind: 'soft' | 'elastic'; dt1: number; dt2: number | null; dt1b: number | null; dir1b: 1 | -1 | 0 };

/** Reading on a 1 ms timer: true time plus small random jitter, rounded to 0,001 s. */
const reading = (v: number) => Math.max(0.001, Math.round(((FLAG / Math.abs(v)) + (Math.random() - 0.5) * 0.0008) * 1000) / 1000);

export function VirtualCollisionLab() {
  const [m1, setM1] = useState(0.3);
  const [m2, setM2] = useState(0.2);
  const [push, setPush] = useState(0.5);
  const [kind, setKind] = useState<'soft' | 'elastic'>('soft');
  const [mu, setMu] = useState(0.002);
  const [tilt, setTilt] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);

  const run = () => {
    // Speed measured at gate 1 is the push speed; the cart then travels D1 to the collision.
    const v1c = travel(push, D1, mu, tilt);
    const t1 = reading(push);
    if (v1c === null) { const stalled: Trial = { kind, dt1: t1, dt2: null, dt1b: null, dir1b: 0 }; setTrials(ts => [...ts, stalled].slice(-5)); return; }
    let u1: number, u2: number;
    if (kind === 'soft') { u1 = u2 = (m1 * v1c) / (m1 + m2); }
    else {
      const e = 0.95; // a real spring bumper is not perfectly elastic
      u1 = ((m1 - e * m2) * v1c) / (m1 + m2);
      u2 = ((1 + e) * m1 * v1c) / (m1 + m2);
    }
    const v2g = travel(u2, D2, mu, tilt);
    let dt1b: number | null = null, dir1b: 1 | -1 | 0 = 0;
    if (kind === 'elastic' && Math.abs(u1) > 1e-3) {
      const back = travel(u1, u1 > 0 ? D2 + 0.05 : D1, mu, tilt);
      if (back !== null) { dt1b = reading(back); dir1b = u1 > 0 ? 1 : -1; }
    }
    setTrials(ts => [...ts, { kind, dt1: t1, dt2: v2g === null ? null : reading(v2g), dt1b, dir1b }].slice(-5));
  };

  const rows = trials.map(t => {
    const v1 = FLAG / t.dt1;
    const pBefore = m1 * v1;
    if (t.dt2 === null) return { t, v1, pBefore, pAfter: null as number | null, kB: 0.5 * m1 * v1 * v1, kA: null as number | null };
    const v2 = FLAG / t.dt2;
    const v1b = t.dt1b === null ? 0 : (t.dir1b * FLAG) / t.dt1b;
    const pAfter = t.kind === 'soft' ? (m1 + m2) * v2 : m1 * v1b + m2 * v2;
    const kA = t.kind === 'soft' ? 0.5 * (m1 + m2) * v2 * v2 : 0.5 * m1 * v1b * v1b + 0.5 * m2 * v2 * v2;
    return { t, v1, pBefore, pAfter, kB: 0.5 * m1 * v1 * v1, kA };
  });
  const last = rows[rows.length - 1];
  const reset = () => setTrials([]);

  return (
    <Figure id="12.1" badge="Phòng thí nghiệm ảo" title="Mô phỏng 12.1 · Khảo sát va chạm trên máng đệm khí"
      caption="Tấm chắn sáng rộng 20 mm; đồng hồ hiện số có độ chia 0,001 s (Mode A cho mỗi cổng), số đọc có sai lệch ngẫu nhiên nhỏ. Cổng 1 đặt trước điểm va chạm 30 cm, cổng 2 sau điểm va chạm 30 cm. Va chạm đàn hồi dùng đầu lò xo lá (không hoàn toàn đàn hồi). Hãy bật thêm ma sát hoặc làm máng nghiêng để thấy sai số hệ thống.">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-3">
          <Slider label="Khối lượng xe 1" value={m1} min={0.1} max={0.6} step={0.05} unit="kg" onChange={v => { setM1(v); reset(); }} />
          <Slider label="Khối lượng xe 2" value={m2} min={0.1} max={0.6} step={0.05} unit="kg" onChange={v => { setM2(v); reset(); }} />
          <Slider label="Tốc độ đẩy xe 1" value={push} min={0.2} max={1} step={0.05} unit="m/s" onChange={setPush} />
          <Slider label="Hệ số cản còn lại μ" value={mu} min={0} max={0.03} step={0.001} digits={3} onChange={setMu} />
          <Slider label="Độ nghiêng máng (+ là dốc lên)" value={tilt} min={-1} max={1} step={0.1} unit="°" digits={1} onChange={setTilt} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => { setKind('soft'); reset(); }} className={`${presetClass} ${kind === 'soft' ? activePreset : ''}`}>Đầu dính (va chạm mềm)</button>
          <button type="button" onClick={() => { setKind('elastic'); reset(); }} className={`${presetClass} ${kind === 'elastic' ? activePreset : ''}`}>Đầu lò xo (va chạm đàn hồi)</button>
          <button type="button" onClick={run} className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Đẩy xe và đo</button>
          <button type="button" onClick={reset} className={presetClass}>Xóa bảng</button>
        </div>
      </div>
      <Diagram label="Máng đệm khí với hai cổng quang." height={150}>
        <rect x="20" y="96" width="520" height="12" rx="3" fill="#cbd5e1" transform={`rotate(${-tilt * 3} 280 102)`} />
        {[140, 400].map((x, i) => (
          <g key={x}>
            <path d={`M ${x - 14} 96 V 40 H ${x + 14} V 96`} fill="none" stroke="#eab308" strokeWidth="5" />
            <line x1={x} y1="52" x2={x} y2="94" stroke={red} strokeOpacity="0.5" strokeWidth="1.5" />
            <text x={x} y="34" textAnchor="middle" fontSize="12" fontWeight="700">Cổng {i + 1}</text>
          </g>
        ))}
        <rect x="70" y="72" width="44" height="24" rx="4" fill="#bfdbfe" stroke={blue} strokeWidth="2" /><rect x="88" y="58" width="6" height="14" fill="#0f172a" />
        <text x="92" y="89" textAnchor="middle" fontSize="11" fontWeight="700" fill={blue}>xe 1</text>
        <rect x="250" y="72" width="44" height="24" rx="4" fill="#fed7aa" stroke={orange} strokeWidth="2" /><rect x="268" y="58" width="6" height="14" fill="#0f172a" />
        <text x="272" y="89" textAnchor="middle" fontSize="11" fontWeight="700" fill={orange}>xe 2</text>
        <Arrow x={116} y={84} dx={40} color={blue} />
        <rect x="430" y="8" width="120" height="54" rx="6" fill="#0f172a" />
        <text x="490" y="24" textAnchor="middle" fontSize="10" fill="#94a3b8">MC964 · MODE A</text>
        <text x="490" y="48" textAnchor="middle" fontSize="18" fontFamily="monospace" fill="#f87171">{last ? last.t.dt1.toFixed(3) : '0.000'} s</text>
        <text x="20" y="140" fontSize="12" fill={slate}>{kind === 'soft' ? 'Hai xe dính nhau rồi cùng qua cổng 2.' : 'Xe 2 qua cổng 2; xe 1 qua lại cổng 1 (bật ngược) hoặc qua cổng 2 (đi tiếp).'}</text>
      </Diagram>
      <div className="overflow-x-auto">
        <table className="mt-2 w-full min-w-[520px] border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700"><tr>{['Lần', 'Δt₁ (s)', kind === 'soft' ? "Δt′ (s)" : 'Δt₂′ (s)', ...(kind === 'elastic' ? ['Δt₁′ (s)'] : []), 'p trước', 'p sau', 'δp', 'Wđ sau / trước'].map(h => <th key={h} className="border border-slate-200 p-1.5">{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="border border-slate-200 p-2 text-center text-slate-500">Bấm “Đẩy xe và đo” để ghi số liệu (tối đa 5 lần).</td></tr>}
            {rows.map((r, i) => (
              <tr key={i} className="text-center tabular-nums">
                <td className="border border-slate-200 p-1.5">{i + 1}</td>
                <td className="border border-slate-200 p-1.5">{r.t.dt1.toFixed(3)}</td>
                <td className="border border-slate-200 p-1.5">{r.t.dt2 === null ? '— (xe dừng)' : r.t.dt2.toFixed(3)}</td>
                {kind === 'elastic' && <td className="border border-slate-200 p-1.5">{r.t.dt1b === null ? '—' : `${r.t.dt1b.toFixed(3)} (${r.t.dir1b > 0 ? 'đi tiếp' : 'bật lại'})`}</td>}
                <td className="border border-slate-200 p-1.5">{number(r.pBefore, 4)}</td>
                <td className="border border-slate-200 p-1.5">{r.pAfter === null ? '—' : number(r.pAfter, 4)}</td>
                <td className="border border-slate-200 p-1.5" style={{ color: r.pAfter !== null && Math.abs(r.pAfter - r.pBefore) / r.pBefore > 0.05 ? red : green }}>{r.pAfter === null ? '—' : `${number((100 * Math.abs(r.pAfter - r.pBefore)) / r.pBefore, 1)}%`}</td>
                <td className="border border-slate-200 p-1.5">{r.kA === null ? '—' : `${number((100 * r.kA) / r.kB, 0)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">p tính theo kg·m/s; vận tốc v = Δs/Δt với Δs = 0,020 m. Khi xe 1 bật ngược lại, vận tốc của nó mang dấu âm. Lý thuyết cho va chạm mềm: Wđ sau/trước = m₁/(m₁ + m₂) = {number((100 * m1) / (m1 + m2), 0)}%.</p>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 12.2 — Chọn bề rộng tấm chắn sáng                          */
/* ------------------------------------------------------------------ */

export function FlagWidthTradeoff() {
  const [ds, setDs] = useState(20);
  const [v, setV] = useState(0.5);
  const [a, setA] = useState(1);
  const dsM = ds / 1000;
  const dt = dsM / v;
  const timerErr = (0.001 / dt) * 100; // % from 1 ms resolution
  const rulerErr = (0.1 / ds) * 100; // % from 0,1 mm on Δs
  // With acceleration a, Δs/Δt equals the speed at the time midpoint; at the gate (flag centre) the speed differs by about a·Δs²/(8v²)·… : compute exactly.
  const vFront = v; // speed when the flag front reaches the beam
  const tBlock = a > 1e-9 ? (-vFront + Math.sqrt(vFront * vFront + 2 * a * dsM)) / a : dsM / vFront;
  const vMeasured = dsM / tBlock;
  const vCentre = Math.sqrt(vFront * vFront + a * dsM); // when the flag centre is at the beam
  const modelErr = (Math.abs(vMeasured - vCentre) / vCentre) * 100;
  const px = (mm: number) => 40 + (mm / 100) * 480;
  const curve = (f: (mm: number) => number) => Array.from({ length: 60 }, (_, i) => { const mm = 2 + (98 * i) / 59; return `${px(mm)},${190 - Math.min(160, f(mm) * 16)}`; }).join(' ');
  const fTimer = (mm: number) => (0.001 / (mm / 1000 / v)) * 100;
  const fRuler = (mm: number) => (0.1 / mm) * 100;

  return (
    <Figure id="12.2" badge="Mô phỏng" title="Mô phỏng 12.2 · Tấm chắn sáng nên rộng bao nhiêu?"
      caption="Tấm chắn quá hẹp: thời gian chắn sáng ngắn, sai số 0,001 s của đồng hồ và sai số đo bề rộng chiếm tỉ lệ lớn. Tấm chắn quá rộng: xe kịp thay đổi vận tốc trong lúc chắn sáng, Δs/Δt khác vận tốc tại vị trí cổng. Thường chọn 10–20 mm và cho xe chạy không quá nhanh.">
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-3">
        <Slider label="Bề rộng tấm chắn Δs" value={ds} min={2} max={100} step={1} unit="mm" digits={0} onChange={setDs} />
        <Slider label="Tốc độ xe" value={v} min={0.1} max={2} step={0.05} unit="m/s" onChange={setV} />
        <Slider label="Gia tốc xe (nếu có)" value={a} min={0} max={3} step={0.1} unit="m/s²" digits={1} onChange={setA} />
      </div>
      <Diagram label="Sai số theo bề rộng tấm chắn." height={220}>
        <line x1="40" y1="190" x2="530" y2="190" stroke="#64748b" /><line x1="40" y1="20" x2="40" y2="190" stroke="#64748b" />
        <text x="528" y="208" textAnchor="end" fontSize="12" fill="#475569">Δs (mm)</text>
        <text x="46" y="18" fontSize="12" fill="#475569">sai số (%)</text>
        {[2, 4, 6, 8, 10].map(p => <text key={p} x="34" y={194 - p * 16} textAnchor="end" fontSize="10" fill={slate}>{p}</text>)}
        <polyline points={curve(fTimer)} fill="none" stroke={red} strokeWidth="2.5" />
        <polyline points={curve(fRuler)} fill="none" stroke={purple} strokeWidth="2" strokeDasharray="5 4" />
        <line x1={px(ds)} y1="20" x2={px(ds)} y2="190" stroke={blue} strokeDasharray="4 3" />
        <text x="520" y="40" textAnchor="end" fontSize="12" fill={red}>do độ chia 0,001 s của đồng hồ</text>
        <text x="520" y="58" textAnchor="end" fontSize="12" fill={purple}>do sai số 0,1 mm khi đo Δs</text>
      </Diagram>
      <Readout items={[['Δt', `${number(dt * 1000, 1)} ms`], ['Sai số do đồng hồ', `${number(timerErr, 1)}%`], ['Sai số do đo Δs', `${number(rulerErr, 1)}%`], ['Lệch do xe tăng tốc', `${number(modelErr, 2)}%`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Hình tĩnh                                                           */
/* ------------------------------------------------------------------ */

export function SetupDiagram() {
  return (
    <Figure id="12.3" title="Hình 12.3 · Bố trí thí nghiệm khảo sát va chạm"
      caption="(1) Máng đệm khí và bơm khí; (2) hai xe có gắn tấm chắn sáng, đầu va chạm thay được (dính hoặc lò xo); (3) hai cổng quang điện nối với đồng hồ hiện số; (4) vít chỉnh và ống nivo để máng nằm ngang. Xe 2 đặt đứng yên giữa hai cổng.">
      <Diagram label="Máng đệm khí, hai xe, hai cổng quang, đồng hồ." height={200}>
        <rect x="20" y="120" width="520" height="14" rx="3" fill="#cbd5e1" stroke="#64748b" />
        {Array.from({ length: 25 }, (_, i) => <circle key={i} cx={34 + i * 20} cy="127" r="1.6" fill="#38bdf8" />)}
        <path d="M 30 134 v 30 M 530 134 v 30" stroke="#64748b" strokeWidth="4" />
        <text x="22" y="182" fontSize="11" fill={slate}>vít chỉnh</text>
        <rect x="250" y="140" width="60" height="12" rx="6" fill="#fef9c3" stroke="#a16207" /><circle cx="280" cy="146" r="4" fill="#a16207" />
        <text x="280" y="168" textAnchor="middle" fontSize="11" fill={slate}>nivo</text>
        {[150, 420].map((x, i) => (
          <g key={x}>
            <path d={`M ${x - 16} 120 V 52 H ${x + 16} V 120`} fill="none" stroke="#eab308" strokeWidth="6" />
            <text x={x} y="44" textAnchor="middle" fontSize="12" fontWeight="700">Cổng {i + 1}</text>
            <path d={`M ${x} 52 C ${x} 20, 500 20, 500 20`} fill="none" stroke="#94a3b8" />
          </g>
        ))}
        <rect x="470" y="4" width="80" height="32" rx="5" fill="#0f172a" /><text x="510" y="24" textAnchor="middle" fontSize="11" fill="#f87171" fontFamily="monospace">0.000</text>
        <rect x="70" y="96" width="50" height="24" rx="4" fill="#bfdbfe" stroke={blue} strokeWidth="2" /><rect x="91" y="80" width="8" height="16" fill="#0f172a" />
        <rect x="270" y="96" width="50" height="24" rx="4" fill="#fed7aa" stroke={orange} strokeWidth="2" /><rect x="291" y="80" width="8" height="16" fill="#0f172a" />
        <text x="95" y="113" textAnchor="middle" fontSize="11" fontWeight="700" fill={blue}>xe 1</text>
        <text x="295" y="113" textAnchor="middle" fontSize="11" fontWeight="700" fill={orange}>xe 2</text>
        <text x="95" y="74" textAnchor="middle" fontSize="10" fill={green}>tấm chắn</text>
        <Arrow x={122} y={108} dx={50} color={blue} label="v₁" offset={-6} />
      </Diagram>
    </Figure>
  );
}
