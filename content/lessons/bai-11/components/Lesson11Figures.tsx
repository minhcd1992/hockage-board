'use client';

import { useEffect, useRef, useState } from 'react';
import { cancelLessonFrame, requestLessonFrame } from '@/lib/lessonAnimation';
import { Arrow, Diagram, Figure, Readout, Slider, activePreset, blue, green, number, orange, presetClass, purple, red, slate } from '@/components/lesson/FigureKit';

/* ------------------------------------------------------------------ */
/* Mô phỏng 11.1 — Va chạm trên đệm khí: mềm hay đàn hồi               */
/* ------------------------------------------------------------------ */

type Kind = 'elastic' | 'soft';

export function CollisionLab() {
  const [m1, setM1] = useState(2);
  const [m2, setM2] = useState(1);
  const [v1, setV1] = useState(3);
  const [v2, setV2] = useState(0);
  const [kind, setKind] = useState<Kind>('elastic');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);

  const w = 46, k = 30; // cart width (px), px per (m/s · s)
  const x1_0 = 40, x2_0 = 280;
  const closing = v1 - v2;
  const tc = closing > 0 ? (x2_0 - x1_0 - w) / (closing * k) : Infinity;
  const M = m1 + m2;
  const after = kind === 'soft'
    ? { u1: (m1 * v1 + m2 * v2) / M, u2: (m1 * v1 + m2 * v2) / M }
    : { u1: ((m1 - m2) * v1 + 2 * m2 * v2) / M, u2: ((m2 - m1) * v2 + 2 * m1 * v1) / M };
  const tEnd = Number.isFinite(tc) ? tc + 3 : 4;

  useEffect(() => {
    if (!playing) return;
    let last: number | null = null, id = 0;
    const step = (now: number) => {
      if (last !== null) {
        const next = Math.min(tEnd, tRef.current + Math.min((now - last) / 1000, 0.1));
        tRef.current = next; setT(next);
        if (next >= tEnd) { setPlaying(false); return; }
      }
      last = now; id = requestLessonFrame(step);
    };
    id = requestLessonFrame(step);
    return () => cancelLessonFrame(id);
  }, [playing, tEnd]);

  const reset = () => { setPlaying(false); tRef.current = 0; setT(0); };
  const before = t < tc;
  const pos1 = before ? x1_0 + v1 * k * t : x1_0 + v1 * k * tc + after.u1 * k * (t - tc);
  const pos2 = before ? x2_0 + v2 * k * t : x2_0 + v2 * k * tc + after.u2 * k * (t - tc);
  const cur1 = before ? v1 : after.u1, cur2 = before ? v2 : after.u2;
  const p0 = m1 * v1 + m2 * v2, K0 = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  const K1 = 0.5 * m1 * after.u1 ** 2 + 0.5 * m2 * after.u2 ** 2;
  const clampX = (x: number) => Math.max(-60, Math.min(600, x));

  return (
    <Figure id="11.1" badge="Mô phỏng" title="Mô phỏng 11.1 · Va chạm của hai xe trên đệm khí"
      caption="Đệm khí gần như không ma sát nên theo phương ngang hệ hai xe là hệ kín: tổng động lượng trước và sau va chạm bằng nhau. Va chạm đàn hồi bảo toàn cả động năng; va chạm mềm (hai xe dính vào nhau) làm mất một phần động năng. Chiều dương hướng sang phải.">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          <Slider label="m₁" value={m1} min={0.5} max={5} step={0.5} unit="kg" digits={1} onChange={x => { reset(); setM1(x); }} />
          <Slider label="v₁" value={v1} min={-2} max={5} step={0.5} unit="m/s" digits={1} onChange={x => { reset(); setV1(x); }} />
          <Slider label="m₂" value={m2} min={0.5} max={5} step={0.5} unit="kg" digits={1} onChange={x => { reset(); setM2(x); }} />
          <Slider label="v₂" value={v2} min={-3} max={3} step={0.5} unit="m/s" digits={1} onChange={x => { reset(); setV2(x); }} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => { if (t >= tEnd) reset(); setPlaying(p => !p); }} className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">{playing ? 'Tạm dừng' : t >= tEnd ? 'Chạy lại' : 'Chạy'}</button>
          <button type="button" onClick={reset} className={presetClass}>Về đầu</button>
          <button type="button" onClick={() => { reset(); setKind('elastic'); }} className={`${presetClass} ${kind === 'elastic' ? activePreset : ''}`}>Va chạm đàn hồi</button>
          <button type="button" onClick={() => { reset(); setKind('soft'); }} className={`${presetClass} ${kind === 'soft' ? activePreset : ''}`}>Va chạm mềm</button>
        </div>
      </div>
      <Diagram label={`Tổng động lượng ${number(p0)} kg·m/s.`} height={190}>
        <rect x="10" y="118" width="540" height="10" rx="3" fill="#cbd5e1" />
        {Array.from({ length: 27 }, (_, i) => <circle key={i} cx={20 + i * 20} cy="123" r="1.5" fill="#38bdf8" />)}
        <g transform={`translate(${clampX(pos1)} 0)`}>
          <rect x="0" y="86" width={w} height="32" rx="5" fill="#bfdbfe" stroke={blue} strokeWidth="2" />
          <text x={w / 2} y="107" textAnchor="middle" fontSize="12" fontWeight="700" fill={blue}>m₁</text>
          <Arrow x={w / 2} y={74} dx={cur1 * 16} color={blue} label={`${number(cur1)} m/s`} offset={-6} />
        </g>
        <g transform={`translate(${clampX(pos2)} 0)`}>
          <rect x="0" y="86" width={w} height="32" rx="5" fill="#fed7aa" stroke={orange} strokeWidth="2" />
          <text x={w / 2} y="107" textAnchor="middle" fontSize="12" fontWeight="700" fill={orange}>m₂</text>
          <Arrow x={w / 2} y={58} dx={cur2 * 16} color={orange} label={`${number(cur2)} m/s`} offset={-6} />
        </g>
        <text x="20" y="160" fontSize="13" fill="#334155">Trước: p = {number(p0)} kg·m/s, Wđ = {number(K0)} J</text>
        <text x="20" y="180" fontSize="13" fill="#334155">Sau: p = {number(m1 * after.u1 + m2 * after.u2)} kg·m/s, Wđ = {number(K1)} J</text>
        {!Number.isFinite(tc) && <text x="540" y="30" textAnchor="end" fontSize="13" fontWeight="700" fill={red}>Hai xe không gặp nhau (v₁ ≤ v₂)</text>}
      </Diagram>
      <Readout items={[['v₁′ sau va chạm', `${number(after.u1)} m/s`], ['v₂′ sau va chạm', `${number(after.u2)} m/s`], ['Δp hệ', `${number(m1 * after.u1 + m2 * after.u2 - p0)} kg·m/s`], ['Wđ mất đi', `${number(K0 - K1)} J`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 11.2 — Xung lượng: kéo dài thời gian va chạm               */
/* ------------------------------------------------------------------ */

export function ImpulseCushion() {
  const [dt, setDt] = useState(0.1);
  const m = 60, v = 20;
  const dp = m * v;
  const F = dp / dt;
  const px = (time: number) => 50 + (time / 0.2) * 460;
  const fMaxAxis = dp / 0.005;
  const py = (f: number) => 190 - 160 * Math.sqrt(f / fMaxAxis); // square-root scale so both extremes fit
  const presets: [string, number][] = [['Đập vào vật cứng ~5 ms', 0.005], ['Đai an toàn ~50 ms', 0.05], ['Túi khí ~100 ms', 0.1], ['Vùng nhún + túi khí ~150 ms', 0.15]];

  return (
    <Figure id="11.2" badge="Mô phỏng" title="Mô phỏng 11.2 · Cùng độ biến thiên động lượng, khác thời gian dừng"
      caption="Người 60 kg trên ô tô 20 m/s dừng hẳn: |Δp| = 1200 kg·m/s không đổi. Lực trung bình F = |Δp|/Δt. Diện tích hình chữ nhật trên đồ thị F–t bằng xung lượng, luôn là 1200 N·s; thời gian càng dài thì lực càng nhỏ. Trục lực dùng thang căn bậc hai để vẽ được cả hai trường hợp.">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <Slider label="Thời gian dừng Δt" value={dt} min={0.005} max={0.2} step={0.005} unit="s" digits={3} onChange={setDt} />
        <div className="flex flex-wrap gap-1.5">{presets.map(([l, val]) => <button key={l} type="button" onClick={() => setDt(val)} className={`${presetClass} ${Math.abs(dt - val) < 1e-9 ? activePreset : ''}`}>{l}</button>)}</div>
      </div>
      <Diagram label={`Lực trung bình ${number(F, 0)} N.`} height={220}>
        <line x1="50" y1="190" x2="530" y2="190" stroke="#64748b" strokeWidth="1.5" />
        <line x1="50" y1="20" x2="50" y2="190" stroke="#64748b" strokeWidth="1.5" />
        <text x="528" y="208" textAnchor="end" fontSize="12" fill="#475569">t (s)</text>
        <text x="56" y="18" fontSize="12" fill="#475569">F (N)</text>
        <rect x="50" y={py(F)} width={px(dt) - 50} height={190 - py(F)} fill="#dbeafe" stroke={blue} strokeWidth="2" />
        <text x={Math.max(60, (50 + px(dt)) / 2)} y={Math.min(180, py(F) + 22)} textAnchor="middle" fontSize="12" fill="#1e3a8a">F·Δt = 1200 N·s</text>
        <text x="530" y="40" textAnchor="end" fontSize="15" fontWeight="700" fill={F > 50000 ? red : F > 15000 ? orange : green}>F ≈ {number(F, 0)} N</text>
        <text x="530" y="62" textAnchor="end" fontSize="12" fill="#334155">≈ {number(F / (m * 9.8), 0)} lần trọng lượng người</text>
        {[0.05, 0.1, 0.15, 0.2].map(s => <text key={s} x={px(s)} y="204" textAnchor="middle" fontSize="11" fill={slate}>{number(s)}</text>)}
      </Diagram>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 11.3 — Đẩy nhau ra từ trạng thái nghỉ (súng giật, tên lửa)  */
/* ------------------------------------------------------------------ */

export function RecoilSplit() {
  const [M, setM] = useState(4);
  const [m, setMass] = useState(0.01);
  const [v, setV] = useState(800);
  const V = (m * v) / M;
  const presets: [string, number, number, number][] = [['Súng trường', 4, 0.01, 800], ['Đại bác', 1000, 10, 200], ['Người nhảy khỏi thuyền', 150, 50, 4], ['Tên lửa mô hình phụt khí', 0.4, 0.1, 200]];

  return (
    <Figure id="11.3" badge="Mô phỏng" title="Mô phỏng 11.3 · Hai vật đẩy nhau ra từ trạng thái nghỉ"
      caption="Ban đầu hệ đứng yên nên tổng động lượng bằng 0. Sau khi tách ra: MV⃗ + mv⃗ = 0⃗, vậy hai vật chuyển động ngược chiều, V = mv/M. Vật nặng hơn chuyển động chậm hơn. Động năng hai bên không bằng nhau: vật nhẹ nhận phần lớn động năng. Tốc độ của vật nhỏ được đo so với mặt đất.">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="flex flex-wrap gap-1.5">{presets.map(([l, a, b, c]) => <button key={l} type="button" onClick={() => { setM(a); setMass(b); setV(c); }} className={`${presetClass} ${M === a && m === b && v === c ? activePreset : ''}`}>{l}</button>)}</div>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
          <Slider label="Vật lớn M" value={M} min={0.2} max={Math.max(10, M)} step={0.1} unit="kg" digits={2} onChange={setM} />
          <Slider label="Vật nhỏ m" value={m} min={0.01} max={Math.max(1, m)} step={0.01} unit="kg" digits={2} onChange={setMass} />
          <Slider label="Tốc độ vật nhỏ v" value={v} min={1} max={Math.max(1000, v)} step={1} unit="m/s" digits={0} onChange={setV} />
        </div>
      </div>
      <Diagram label={`Vật lớn giật lùi ${number(V, 3)} m/s.`} height={150}>
        <rect x="210" y="70" width="90" height="40" rx="6" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
        <text x="255" y="95" textAnchor="middle" fontSize="13" fontWeight="700">M</text>
        <circle cx="320" cy="90" r="10" fill="#fed7aa" stroke={orange} strokeWidth="2" />
        <text x="320" y="94" textAnchor="middle" fontSize="11" fontWeight="700" fill={orange}>m</text>
        <Arrow x={334} y={90} dx={160} color={orange} label={`v = ${number(v)} m/s`} offset={-8} />
        <Arrow x={206} y={90} dx={-Math.min(160, 20 + 140 * Math.min(1, V / v * 5))} color={blue} label={`V = ${number(V, 3)} m/s`} offset={-8} />
        <text x="280" y="140" textAnchor="middle" fontSize="12" fill={purple}>p_trước = 0 ⇒ MV = mv</text>
      </Diagram>
      <Readout items={[['Động lượng mỗi vật', `${number(m * v, 2)} kg·m/s`], ['V = mv/M', `${number(V, 3)} m/s`], ['Wđ vật nhỏ', `${number(0.5 * m * v * v, 1)} J`], ['Wđ vật lớn', `${number(0.5 * M * V * V, 1)} J`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Hình tĩnh                                                           */
/* ------------------------------------------------------------------ */

export function RocketForces() {
  return (
    <Figure id="11.4" title="Hình 11.4 · Tên lửa đẩy khí, khí đẩy tên lửa"
      caption="Trong buồng đốt, áp suất khí rất lớn. Tên lửa đẩy khí ra phía sau (F⃗_tl→k), đồng thời khí đẩy tên lửa về phía trước (F⃗_k→tl), hai lực có cùng độ lớn (định luật III). Tương tác này xảy ra giữa tên lửa và khối khí do chính nó mang theo, không cần không khí bên ngoài.">
      <Diagram label="Tên lửa và luồng khí phụt." height={180}>
        <path d="M 180 70 L 400 70 L 460 90 L 400 110 L 180 110 Z" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
        <path d="M 180 70 L 150 50 L 180 90 Z M 180 110 L 150 130 L 180 90 Z" fill="#cbd5e1" stroke="#334155" />
        <path d="M 180 80 Q 120 90 60 70 M 180 90 Q 110 92 40 90 M 180 100 Q 120 92 60 110" fill="none" stroke={orange} strokeWidth="3" strokeLinecap="round" />
        <Arrow x={200} y={90} dx={-90} color={red} label="F_tl→k" offset={-16} />
        <Arrow x={300} y={90} dx={100} color={green} label="F_k→tl" offset={-16} />
        <text x="320" y="160" fontSize="13" fill="#334155">tên lửa → (không cần không khí bên ngoài)</text>
      </Diagram>
    </Figure>
  );
}
