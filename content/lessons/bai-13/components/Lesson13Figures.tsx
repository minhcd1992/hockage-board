'use client';

import { useEffect, useState } from 'react';
import { cancelLessonFrame, requestLessonFrame } from '@/lib/lessonAnimation';
import { Arrow, Diagram, Figure, Readout, Slider, G, activePreset, blue, green, number, orange, presetClass, purple, red, slate } from '@/components/lesson/FigureKit';

const deg = Math.PI / 180;

/* ------------------------------------------------------------------ */
/* Mô phỏng 13.1 — Chuyển động tròn đều: v tiếp tuyến, a hướng tâm     */
/* ------------------------------------------------------------------ */

export function CircularMotionSim() {
  const [R, setR] = useState(1.2);
  const [n, setN] = useState(30); // vòng/phút
  const [phi, setPhi] = useState(0.7);
  const [playing, setPlaying] = useState(false);
  const omega = (2 * Math.PI * n) / 60;

  useEffect(() => {
    if (!playing) return;
    let last: number | null = null, id = 0;
    const step = (now: number) => {
      if (last !== null) {
        const dt = Math.min((now - last) / 1000, 0.1);
        setPhi(p => (p + omega * dt) % (2 * Math.PI));
      }
      last = now; id = requestLessonFrame(step);
    };
    id = requestLessonFrame(step);
    return () => cancelLessonFrame(id);
  }, [playing, omega]);

  const v = omega * R, a = omega * omega * R;
  const cx = 190, cy = 150, r = 30 + 50 * R;
  const px = cx + r * Math.cos(phi), py = cy - r * Math.sin(phi);
  const vLen = 30 + (60 * v) / (v + 3), aLen = 25 + (60 * a) / (a + 10);
  // Δv construction: velocities a short time before and after, drawn from one origin.
  const ox = 470, oy = 150, L = 70, d = 0.4;
  const v1 = [-Math.sin(phi - d) * L, -Math.cos(phi - d) * L], v2 = [-Math.sin(phi + d) * L, -Math.cos(phi + d) * L];

  return (
    <Figure id="13.1" badge="Mô phỏng 13.1" title="Vận tốc tiếp tuyến, gia tốc hướng tâm"
      caption="Tốc độ không đổi nhưng hướng của v⃗ đổi liên tục. Ở hình bên phải, hai vectơ vận tốc tại hai thời điểm gần nhau được vẽ chung gốc: hiệu Δv⃗ luôn chỉ về phía tâm, nên gia tốc a⃗ = Δv⃗/Δt hướng vào tâm. Độ dài mũi tên chỉ có tính tương đối.">
      <Diagram label="Chất điểm trên đường tròn với vectơ vận tốc tiếp tuyến và gia tốc hướng tâm; bên phải là tam giác hiệu vận tốc." height={300}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="4" fill="#0f172a" />
        <text x={cx - 6} y={cy + 20} fontSize="13" fill="#334155">O</text>
        <line x1={cx} y1={cy} x2={px} y2={py} stroke={slate} strokeWidth="1.5" strokeDasharray="4 3" />
        <Arrow x={px} y={py} dx={-Math.sin(phi) * vLen} dy={-Math.cos(phi) * vLen} color={blue} label="v⃗" offset={-6} />
        <Arrow x={px} y={py} dx={((cx - px) / r) * aLen} dy={((cy - py) / r) * aLen} color={red} label="a⃗_ht" offset={16} />
        <circle cx={px} cy={py} r="7" fill={orange} />
        <line x1="370" y1="20" x2="370" y2="280" stroke="#e2e8f0" strokeWidth="1.5" />
        <text x="460" y="34" textAnchor="middle" fontSize="13" fill="#334155">v⃗₁, v⃗₂ vẽ chung gốc</text>
        <Arrow x={ox} y={oy} dx={v1[0]} dy={v1[1]} color={slate} label="v⃗₁" offset={-6} />
        <Arrow x={ox} y={oy} dx={v2[0]} dy={v2[1]} color={blue} label="v⃗₂" offset={-6} />
        <Arrow x={ox + v1[0]} y={oy + v1[1]} dx={v2[0] - v1[0]} dy={v2[1] - v1[1]} color={red} label="Δv⃗" offset={16} />
        <text x="460" y="270" textAnchor="middle" fontSize="12" fill={red}>Δv⃗ cùng hướng a⃗_ht (vào tâm)</text>
      </Diagram>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Slider label="Bán kính R" value={R} min={0.5} max={2} step={0.1} unit="m" digits={1} onChange={setR} />
        <Slider label="Tốc độ quay n" value={n} min={10} max={120} step={5} unit="vòng/phút" digits={0} onChange={setN} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={presetClass} onClick={() => setPlaying(p => !p)}>{playing ? '⏸ Dừng' : '▶ Chạy'}</button>
      </div>
      <Readout items={[
        ['ω = 2πn/60', `${number(omega, 2)} rad/s`],
        ['T = 2π/ω', `${number(2 * Math.PI / omega, 2)} s`],
        ['v = ωR', `${number(v, 2)} m/s`],
        ['a_ht = ω²R', `${number(a, 1)} m/s²`],
      ]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 13.2 — Xe vào cua: đường phẳng và đường nghiêng             */
/* ------------------------------------------------------------------ */

const MASS = 1500;
const curvePresets = [
  { label: 'Ví dụ 1 · đường phẳng', v: 54, R: 50, mu: 0.6, th: 0 },
  { label: 'Ví dụ 2 · nghiêng, không ma sát', v: 90, R: 120, mu: 0, th: 28 },
  { label: 'Nghiêng 15°, trời mưa', v: 72, R: 150, mu: 0.2, th: 15 },
];

export function CurveForceLab() {
  const [vk, setVk] = useState(54); // km/h
  const [R, setR] = useState(50);
  const [mu, setMu] = useState(0.6);
  const [th, setTh] = useState(0);

  const v = vk / 3.6, t = th * deg, s = Math.sin(t), c = Math.cos(t);
  const a = (v * v) / R;
  const nPer = G * c + a * s; // N/m
  const fPer = a * c - G * s; // friction per unit mass, + = down the slope (towards the centre)
  const denom = c - mu * s;
  const vmax = denom <= 0 ? Infinity : Math.sqrt((G * R * (s + mu * c)) / denom);
  const vmin2 = (G * R * (s - mu * c)) / (c + mu * s);
  const vmin = vmin2 > 0 ? Math.sqrt(vmin2) : 0;
  const v0 = Math.sqrt(G * R * Math.tan(t));
  const status = v > vmax + 1e-9 ? 'out' : v < vmin - 1e-9 ? 'in' : 'ok';

  const X = 300, Y = 190; // contact point
  const k = 95 / Math.max(G, a, nPer, Math.abs(fPer));
  const bx = X - s * 17, by = Y - c * 17; // car centre
  const fmt = (x: number) => (Number.isFinite(x) ? `${number(x * 3.6, 1)} km/h` : 'không giới hạn');

  return (
    <Figure id="13.2" badge="Mô phỏng 13.2" title="Lực nào giữ xe vào cua?"
      caption="Mặt cắt ngang của khúc cua, tâm cua ở bên trái. Hợp lực của P⃗, N⃗ và lực ma sát nghỉ F⃗ms phải nằm ngang, hướng vào tâm, có độ lớn mv²/R. Nếu lực ma sát cần thiết vượt quá μN, xe trượt. Xe 1500 kg; kết luận về tốc độ không phụ thuộc khối lượng.">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {curvePresets.map(p => (
          <button key={p.label} type="button" className={`${presetClass} ${vk === p.v && R === p.R && mu === p.mu && th === p.th ? activePreset : ''}`}
            onClick={() => { setVk(p.v); setR(p.R); setMu(p.mu); setTh(p.th); }}>{p.label}</button>
        ))}
      </div>
      <Diagram label="Mặt cắt khúc cua với các lực tác dụng lên xe." height={290}>
        <polygon points={`${X - 260 * c},${Y + 260 * s} ${X + 240 * c},${Y - 240 * s} ${X + 240 * c},285 ${X - 260 * c},285`} fill="#e2e8f0" />
        <line x1={X - 260 * c} y1={Y + 260 * s} x2={X + 240 * c} y2={Y - 240 * s} stroke="#475569" strokeWidth="3" />
        <g transform={`translate(${X} ${Y}) rotate(${-th})`}>
          <rect x="-40" y="-34" width="80" height="26" rx="6" fill="#bfdbfe" stroke={blue} strokeWidth="2" />
          <circle cx="-24" cy="-6" r="6" fill="#334155" />
          <circle cx="24" cy="-6" r="6" fill="#334155" />
        </g>
        <text x="20" y="30" fontSize="13" fill={purple}>← phía tâm cua</text>
        <Arrow x={bx} y={by} dx={0} dy={k * G} color={slate} label="P⃗" offset={14} labelDx={12} />
        <Arrow x={bx} y={by} dx={-s * k * nPer} dy={-c * k * nPer} color={blue} label="N⃗" offset={-6} />
        {mu > 0 && Math.abs(fPer) > 1e-6 ? (
          <Arrow x={X} y={Y} dx={-c * k * fPer} dy={s * k * fPer} color={orange} label="F⃗ms" offset={18} />
        ) : null}
        <Arrow x={bx} y={by} dx={-k * a} dy={0} color={purple} label="F⃗ht (hợp lực)" offset={-8} dashed />
        <text x="540" y="30" textAnchor="end" fontSize="14" fontWeight="700" fill={status === 'ok' ? green : red}>
          {status === 'ok' ? 'Vào cua an toàn' : status === 'out' ? 'Trượt ra phía ngoài cua!' : 'Trượt xuống phía trong cua!'}
        </text>
      </Diagram>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Slider label="Tốc độ v" value={vk} min={10} max={150} step={1} unit="km/h" digits={0} onChange={setVk} />
        <Slider label="Bán kính cua R" value={R} min={20} max={300} step={5} unit="m" digits={0} onChange={setR} />
        <Slider label="Hệ số ma sát nghỉ μ" value={mu} min={0} max={1} step={0.05} digits={2} onChange={setMu} />
        <Slider label="Góc nghiêng mặt đường θ" value={th} min={0} max={35} step={1} unit="°" digits={0} onChange={setTh} />
      </div>
      <Readout items={[
        ['F_ht cần = mv²/R', `${number(MASS * a, 0)} N`],
        ['Ma sát cần |F_ms|', `${number(MASS * Math.abs(fPer), 0)} N`],
        ['Ma sát tối đa μN', `${number(MASS * mu * nPer, 0)} N`],
        ['Tốc độ lý tưởng v₀', th === 0 ? '— (cần ma sát)' : fmt(v0)],
        ['v_min', vmin > 0 ? fmt(vmin) : '0'],
        ['v_max', fmt(vmax)],
        ['Phản lực N', `${number(MASS * nPer, 0)} N`],
        ['Chiều F_ms', Math.abs(fPer) < 1e-6 ? 'không cần' : fPer > 0 ? 'xuống dốc' : 'lên dốc'],
      ]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 13.3 — Ô tô qua cầu vồng và cầu lõm                         */
/* ------------------------------------------------------------------ */

export function BridgeSim() {
  const [mode, setMode] = useState<'convex' | 'concave'>('convex');
  const [v, setV] = useState(15);
  const [R, setR] = useState(45);
  const [m, setM] = useState(1500);

  const convex = mode === 'convex';
  const a = (v * v) / R, P = m * G, N = convex ? m * (G - a) : m * (G + a);
  const vc = Math.sqrt(G * R);
  const rpx = 2 * R + 60, top = 140;
  const pts = Array.from({ length: 41 }, (_, i) => {
    const t = -0.7 + (1.4 * i) / 40;
    return `${280 + rpx * Math.sin(t)},${top + (convex ? 1 : -1) * rpx * (1 - Math.cos(t))}`;
  }).join(' ');
  const k = 90 / Math.max(P, Math.abs(N));

  return (
    <Figure id="13.3" badge="Mô phỏng 13.3" title="Áp lực của ô tô lên cầu vồng và cầu lõm"
      caption="Ở đỉnh cầu vồng, gia tốc hướng tâm chỉ xuống nên P > N: xe ép lên cầu nhẹ hơn trọng lượng. Ở đáy cầu lõm, gia tốc chỉ lên nên N > P. Theo định luật III Newton, áp lực của xe lên cầu bằng N.">
      <div className="mb-2 flex flex-wrap gap-1.5">
        <button type="button" className={`${presetClass} ${convex ? activePreset : ''}`} onClick={() => setMode('convex')}>Cầu vồng (đỉnh cầu)</button>
        <button type="button" className={`${presetClass} ${!convex ? activePreset : ''}`} onClick={() => setMode('concave')}>Cầu lõm (đáy cầu)</button>
      </div>
      <Diagram label={convex ? 'Ô tô ở đỉnh cầu vồng với trọng lực và phản lực.' : 'Ô tô ở đáy cầu lõm với trọng lực và phản lực.'} height={240}>
        <polyline points={pts} fill="none" stroke="#475569" strokeWidth="4" />
        <rect x="252" y="112" width="56" height="24" rx="6" fill="#bfdbfe" stroke={blue} strokeWidth="2" />
        <circle cx="264" cy="137" r="5" fill="#334155" />
        <circle cx="296" cy="137" r="5" fill="#334155" />
        <Arrow x={270} y={124} dx={0} dy={k * P} color={slate} label="P⃗" offset={14} labelDx={-14} />
        {N > 0 && <Arrow x={290} y={124} dx={0} dy={-k * N} color={blue} label="N⃗" offset={-6} labelDx={14} />}
        <Arrow x={350} y={124} dx={0} dy={convex ? 50 : -50} color={purple} label="a⃗_ht" offset={convex ? 16 : -6} labelDx={22} dashed />
        <text x="540" y="30" textAnchor="end" fontSize="14" fontWeight="700" fill={N > 0 ? green : red}>
          {N > 0 ? `N = ${number(N / P, 2)} P` : 'Xe rời khỏi mặt cầu!'}
        </text>
      </Diagram>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Slider label="Tốc độ v" value={v} min={0} max={40} step={1} unit="m/s" digits={0} onChange={setV} />
        <Slider label="Bán kính cong R" value={R} min={20} max={100} step={5} unit="m" digits={0} onChange={setR} />
        <Slider label="Khối lượng m" value={m} min={500} max={3000} step={100} unit="kg" digits={0} onChange={setM} />
      </div>
      <Readout items={[
        ['Trọng lượng P', `${number(P, 0)} N`],
        ['mv²/R', `${number(m * a, 0)} N`],
        ['Áp lực N', N > 0 ? `${number(N, 0)} N` : '0 (rời cầu)'],
        [convex ? 'v tới hạn √(gR)' : 'Gia tốc a_ht', convex ? `${number(vc, 1)} m/s` : `${number(a, 2)} m/s²`],
      ]} />
    </Figure>
  );
}
