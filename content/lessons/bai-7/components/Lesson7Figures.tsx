'use client';

import { useEffect, useRef, useState } from 'react';
import { cancelLessonFrame, requestLessonFrame } from '@/lib/lessonAnimation';
import { Arrow, Diagram, Figure, Readout, Slider, G, activePreset, blue, green, number, orange, presetClass, purple, red, slate } from '@/components/lesson/FigureKit';

export { Arrow, Diagram, Figure };

/* ------------------------------------------------------------------ */
/* Mô phỏng 7.1 — Kéo khối gỗ: ma sát nghỉ tự điều chỉnh → ma sát trượt */
/* ------------------------------------------------------------------ */

export function FrictionPull() {
  const [m, setM] = useState(5);
  const [muN, setMuN] = useState(0.4);
  const [muT, setMuT] = useState(0.3);
  const [F, setF] = useState(15);
  const N = m * G;
  const fMax = muN * N;
  const sliding = F > fMax;
  const friction = sliding ? muT * N : F;
  const a = sliding ? (F - muT * N) / m : 0;

  // Graph: friction vs applied force, both 0..FMAX_AXIS
  const axis = Math.max(60, Math.ceil((fMax * 1.4) / 10) * 10);
  const gx = (v: number) => 300 + (240 * v) / axis;
  const gy = (v: number) => 220 - (180 * v) / axis;
  const scale = 1.6; // px per newton for force arrows (clamped)
  const len = (v: number) => Math.min(110, v * scale);

  return (
    <Figure id="7.1" badge="Mô phỏng" title="Mô phỏng 7.1 · Kéo khối gỗ trên sàn ngang"
      caption={`Khối gỗ ban đầu đứng yên, lực kéo nằm ngang; g = 9,8 m/s². Khi F ≤ μₙN, ma sát nghỉ tự điều chỉnh bằng F. Khi F vượt μₙN, vật trượt và ma sát chuyển thành ma sát trượt μₜN (nhỏ hơn). Đồ thị bên phải biểu diễn độ lớn lực ma sát theo lực kéo.`}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-4">
        <Slider label="Khối lượng m" value={m} min={1} max={20} step={0.5} unit="kg" digits={1} onChange={setM} />
        <Slider label="Hệ số μₙ" value={muN} min={0.1} max={0.8} step={0.05} onChange={v => { setMuN(v); if (muT > v) setMuT(v); }} />
        <Slider label="Hệ số μₜ" value={muT} min={0.05} max={muN} step={0.05} onChange={setMuT} />
        <Slider label="Lực kéo F" value={F} min={0} max={axis} step={0.5} unit="N" digits={1} onChange={setF} />
      </div>
      <Diagram label={`Lực kéo ${number(F)} N, lực ma sát ${number(friction)} N, vật ${sliding ? 'đang trượt' : 'đứng yên'}.`} height={250}>
        {/* Scene */}
        <line x1="14" y1="170" x2="270" y2="170" stroke="#94a3b8" strokeWidth="3" />
        {Array.from({ length: 13 }, (_, i) => <line key={i} x1={20 + i * 20} y1="170" x2={10 + i * 20} y2="182" stroke="#cbd5e1" strokeWidth="1.5" />)}
        <rect x="90" y="120" width="80" height="50" rx="4" fill={sliding ? '#fde68a' : '#fef3c7'} stroke="#b45309" strokeWidth="2" />
        <text x="130" y="150" textAnchor="middle" fontWeight="700" fill="#92400e">m</text>
        <Arrow x={170} y={140} dx={len(F)} color={blue} label="F" offset={-8} />
        <Arrow x={90} y={166} dx={-len(friction)} color={orange} label={sliding ? 'Fₘₛₜ' : 'Fₘₛₙ'} offset={-8} />
        <Arrow x={130} y={145} dy={50} dx={0} color={slate} label="P" offset={16} labelDx={12} />
        <Arrow x={130} y={120} dy={-50} dx={0} color={green} label="N" offset={-4} labelDx={14} />
        <text x="140" y="30" textAnchor="middle" fontWeight="700" fill={sliding ? red : green}>{sliding ? 'Vật trượt — ma sát trượt' : 'Vật đứng yên — ma sát nghỉ'}</text>
        <text x="140" y="52" textAnchor="middle" fontSize="13" fill="#334155">{sliding ? `a = (F − μₜN)/m = ${number(a)} m/s²` : 'a = 0, Fₘₛₙ = F'}</text>
        {/* Graph */}
        <line x1="300" y1="220" x2="548" y2="220" stroke="#64748b" strokeWidth="1.5" />
        <line x1="300" y1="30" x2="300" y2="220" stroke="#64748b" strokeWidth="1.5" />
        <text x="546" y="238" textAnchor="end" fontSize="12" fill="#475569">F (N)</text>
        <text x="306" y="28" fontSize="12" fill="#475569">Fₘₛ (N)</text>
        <line x1={gx(0)} y1={gy(0)} x2={gx(fMax)} y2={gy(fMax)} stroke={green} strokeWidth="3" />
        <line x1={gx(fMax)} y1={gy(fMax)} x2={gx(fMax)} y2={gy(muT * N)} stroke={slate} strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1={gx(fMax)} y1={gy(muT * N)} x2={gx(axis)} y2={gy(muT * N)} stroke={orange} strokeWidth="3" />
        <text x={gx(fMax) - 4} y={gy(fMax) - 8} textAnchor="end" fontSize="12" fill={green}>μₙN = {number(fMax, 1)}</text>
        <text x={gx(axis) - 2} y={gy(muT * N) - 8} textAnchor="end" fontSize="12" fill={orange}>μₜN = {number(muT * N, 1)}</text>
        <circle cx={gx(F)} cy={gy(friction)} r="6" fill={sliding ? orange : green} stroke="white" strokeWidth="2" />
      </Diagram>
      <Readout items={[['N = mg', `${number(N, 1)} N`], ['Fₘₛₙ,max', `${number(fMax, 1)} N`], ['Lực ma sát', `${number(friction, 1)} N`], ['Gia tốc', `${number(a)} m/s²`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 7.2 — Cân trong thang máy: trọng lượng biểu kiến            */
/* ------------------------------------------------------------------ */

export function ApparentWeight() {
  const [m, setM] = useState(60);
  const [a, setA] = useState(2);
  const N = m * (G + a);
  const P = m * G;
  const presets: [string, number][] = [['Đứng yên / thẳng đều', 0], ['a = +2 m/s² (hướng lên)', 2], ['a = −2 m/s² (hướng xuống)', -2], ['Rơi tự do (a = −g)', -G]];
  const k = 0.11; // px per newton
  const state = Math.abs(a) < 1e-9 ? 'Cân chỉ đúng trọng lượng' : N <= 1e-6 ? 'Mất trọng lượng biểu kiến' : a > 0 ? 'Tăng trọng lượng biểu kiến' : 'Giảm trọng lượng biểu kiến';

  return (
    <Figure id="7.2" badge="Mô phỏng" title="Mô phỏng 7.2 · Đứng trên cân trong thang máy"
      caption="Chiều dương hướng lên. Gia tốc a là gia tốc của thang máy (và người) so với mặt đất. Gia tốc hướng lên xảy ra khi thang đi lên nhanh dần hoặc đi xuống chậm dần; gia tốc hướng xuống xảy ra khi thang đi lên chậm dần hoặc đi xuống nhanh dần. Số chỉ của cân bằng độ lớn phản lực N = m(g + a); trọng lực P = mg không đổi.">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Slider label="Khối lượng người m" value={m} min={30} max={100} step={1} unit="kg" digits={0} onChange={setM} />
          <Slider label="Gia tốc thang máy a" value={a} min={-G} max={5} step={0.1} unit="m/s²" digits={1} onChange={setA} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map(([label, value]) => (
            <button key={label} type="button" onClick={() => setA(value)} className={`${presetClass} ${Math.abs(a - value) < 1e-9 ? activePreset : ''}`}>{label}</button>
          ))}
        </div>
      </div>
      <Diagram label={`Số chỉ cân ${number(N, 0)} N, trọng lượng ${number(P, 0)} N.`} height={260}>
        <rect x="150" y="20" width="160" height="220" rx="6" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
        <line x1="230" y1="0" x2="230" y2="20" stroke="#64748b" strokeWidth="3" />
        <rect x="190" y="205" width="80" height="14" rx="3" fill="#cbd5e1" stroke="#475569" />
        <circle cx="230" cy="90" r="14" fill="#fcd34d" stroke="#92400e" strokeWidth="2" />
        <line x1="230" y1="104" x2="230" y2="160" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        <line x1="230" y1="160" x2="214" y2="204" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        <line x1="230" y1="160" x2="246" y2="204" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        <line x1="230" y1="120" x2="208" y2="148" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
        <line x1="230" y1="120" x2="252" y2="148" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
        <Arrow x={278} y={140} dx={0} dy={P * k} color={slate} label="P" offset={14} labelDx={14} />
        <Arrow x={182} y={204} dx={0} dy={-N * k} color={green} label="N" offset={-4} labelDx={-14} />
        {Math.abs(a) > 1e-9 && <Arrow x={340} y={130} dx={0} dy={-a * 9} color={purple} label="a" offset={a > 0 ? -6 : 16} labelDx={14} />}
        <rect x="370" y="60" width="170" height="74" rx="10" fill="#0f172a" />
        <text x="455" y="84" textAnchor="middle" fill="#94a3b8" fontSize="12">Số chỉ của cân</text>
        <text x="455" y="118" textAnchor="middle" fill="#f87171" fontSize="28" fontFamily="monospace" fontWeight="700">{number(Math.max(0, N), 0)} N</text>
        <text x="455" y="160" textAnchor="middle" fontSize="13" fontWeight="700" fill={a > 0 ? red : a < 0 ? blue : green}>{state}</text>
        <text x="455" y="182" textAnchor="middle" fontSize="12" fill="#334155">N − P = ma</text>
      </Diagram>
      <Readout items={[['Trọng lượng P', `${number(P, 0)} N`], ['Số chỉ N', `${number(Math.max(0, N), 0)} N`], ['N / P', number(N / P)], ['Gia tốc a', `${number(a, 1)} m/s²`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 7.3 — Rơi trong không khí và tốc độ giới hạn               */
/* ------------------------------------------------------------------ */

type FallPreset = { key: string; label: string; m: number; cd: number; s: number };
const fallPresets: FallPreset[] = [
  { key: 'rain', label: 'Giọt mưa r = 1,5 mm', m: 1.414e-5, cd: 0.5, s: Math.PI * 1.5e-3 * 1.5e-3 },
  { key: 'diver', label: 'Người nhảy dù (chưa mở dù)', m: 80, cd: 0.8, s: 0.6 },
  { key: 'chute', label: 'Người nhảy dù (dù đã mở)', m: 80, cd: 1.2, s: 40 },
];
const RHO = 1.2;

export function TerminalVelocity() {
  const [presetKey, setPresetKey] = useState('rain');
  const preset = fallPresets.find(p => p.key === presetKey) ?? fallPresets[0];
  const vt = Math.sqrt((2 * preset.m * G) / (preset.cd * RHO * preset.s));
  const tau = vt / G;
  const tMax = 3.2 * tau;
  const [t, setTState] = useState(0);
  const tRef = useRef(0);
  const setT = (value: number) => { tRef.current = value; setTState(value); };
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let last: number | null = null;
    let id = 0;
    const step = (now: number) => {
      if (last !== null) {
        const dt = Math.min((now - last) / 1000, 0.1);
        // Play the whole fall in about 6 s of real time.
        const next = Math.min(tMax, tRef.current + (dt * tMax) / 6);
        tRef.current = next;
        setTState(next);
        if (next >= tMax) { setPlaying(false); return; }
      }
      last = now;
      id = requestLessonFrame(step);
    };
    id = requestLessonFrame(step);
    return () => cancelLessonFrame(id);
  }, [playing, tMax]);

  // Quadratic drag from rest: v = vt·tanh(gt/vt), y = (vt²/g)·ln cosh(gt/vt)
  const v = vt * Math.tanh(t / tau);
  const acc = G * (1 - (v / vt) ** 2);
  const y = vt * tau * Math.log(Math.cosh(t / tau));
  const t99 = tau * Math.atanh(0.99);
  const y99 = vt * tau * Math.log(Math.cosh(t99 / tau));

  const px = (time: number) => 50 + (470 * time) / tMax;
  const vMaxAxis = vt * 1.35;
  const py = (vel: number) => 220 - (190 * Math.min(vel, vMaxAxis)) / vMaxAxis;
  const curve = Array.from({ length: 81 }, (_, i) => { const tt = (tMax * i) / 80; return `${px(tt)},${py(vt * Math.tanh(tt / tau))}`; }).join(' ');
  const freeEnd = Math.min(tMax, vMaxAxis / G);

  const choose = (key: string) => { setPlaying(false); setT(0); setPresetKey(key); };

  return (
    <Figure id="7.3" badge="Mô phỏng" title="Mô phỏng 7.3 · Rơi trong không khí — tốc độ giới hạn"
      caption={`Mô hình lực cản Fc = ½C_DρSv², ρ = 1,2 kg/m³, vật thả từ nghỉ; bỏ qua lực đẩy Ác-si-mét và gió. Đường nét đứt màu xám là rơi tự do v = gt (không có không khí). Vật đạt 99% tốc độ giới hạn sau khoảng ${number(t99, 1)} s, khi đã rơi được khoảng ${number(y99, 0)} m.`}>
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="flex flex-wrap gap-1.5">
          {fallPresets.map(p => <button key={p.key} type="button" onClick={() => choose(p.key)} className={`${presetClass} ${p.key === presetKey ? activePreset : ''}`}>{p.label}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={playing} onClick={() => { if (t >= tMax) setT(0); setPlaying(p => !p); }}
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">{playing ? 'Tạm dừng' : t >= tMax ? 'Chạy lại' : 'Thả rơi'}</button>
          <div className="min-w-[200px] flex-1"><Slider label="Thời điểm t" value={t} min={0} max={tMax} step={tMax / 400} unit="s" onChange={v2 => { setPlaying(false); setT(v2); }} /></div>
        </div>
      </div>
      <Diagram label={`Đồ thị vận tốc theo thời gian; tại t = ${number(t)} s, v = ${number(v)} m/s.`} height={250}>
        <line x1="50" y1="220" x2="530" y2="220" stroke="#64748b" strokeWidth="1.5" />
        <line x1="50" y1="20" x2="50" y2="220" stroke="#64748b" strokeWidth="1.5" />
        <text x="528" y="240" textAnchor="end" fontSize="12" fill="#475569">t (s)</text>
        <text x="56" y="18" fontSize="12" fill="#475569">v (m/s)</text>
        <line x1="50" y1={py(vt)} x2="530" y2={py(vt)} stroke={orange} strokeDasharray="6 4" />
        <text x="526" y={py(vt) - 6} textAnchor="end" fontSize="12" fill={orange}>vₜ = {number(vt)} m/s</text>
        <line x1={px(0)} y1={py(0)} x2={px(freeEnd)} y2={py(G * freeEnd)} stroke={slate} strokeDasharray="4 4" />
        <polyline points={curve} fill="none" stroke={blue} strokeWidth="3" />
        <line x1={px(t)} y1="220" x2={px(t)} y2={py(v)} stroke="#cbd5e1" />
        <circle cx={px(t)} cy={py(v)} r="6" fill={blue} stroke="white" strokeWidth="2" />
        {[0.25, 0.5, 0.75, 1].map(f => <text key={f} x={px(tMax * f)} y="236" textAnchor="middle" fontSize="11" fill="#64748b">{number(tMax * f, 1)}</text>)}
      </Diagram>
      <Readout items={[['Vận tốc v', `${number(v)} m/s`], ['Gia tốc a', `${number(acc)} m/s²`], ['Đã rơi', `${number(y, 1)} m`], ['Fc / P', number((v / vt) ** 2)]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Hình tĩnh                                                           */
/* ------------------------------------------------------------------ */

export function WalkingFriction() {
  return (
    <Figure id="7.4" title="Hình 7.4 · Ma sát nghỉ là lực phát động khi đi bộ và khi ô tô tăng tốc"
      caption="Bàn chân (hoặc lốp bánh chủ động) đẩy mặt đất về phía sau bằng lực F′. Mặt đất tác dụng lại lực ma sát nghỉ Fₘₛₙ hướng về phía trước. Fₘₛₙ là ngoại lực theo phương ngang làm người và xe tăng tốc về phía trước. Hai lực này đặt lên hai vật khác nhau.">
      <Diagram label="Chân đạp đất về sau, mặt đất đẩy chân về trước; lốp xe cũng vậy." height={210}>
        <line x1="10" y1="170" x2="550" y2="170" stroke="#94a3b8" strokeWidth="3" />
        {/* Person */}
        <circle cx="120" cy="40" r="13" fill="#fcd34d" stroke="#92400e" strokeWidth="2" />
        <line x1="120" y1="53" x2="120" y2="110" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        <line x1="120" y1="110" x2="150" y2="168" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        <line x1="120" y1="110" x2="88" y2="168" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        <Arrow x={88} y={178} dx={-48} color={slate} label="F′ (chân lên đất)" offset={18} anchor="start" labelDx={-40} />
        <Arrow x={88} y={162} dx={60} color={orange} label="Fₘₛₙ (đất lên chân)" offset={-10} anchor="start" labelDx={-60} />
        <text x="120" y="20" textAnchor="middle" fontSize="13" fill="#334155">Bước đi →</text>
        {/* Wheel */}
        <circle cx="420" cy="128" r="40" fill="#1e293b" />
        <circle cx="420" cy="128" r="16" fill="#cbd5e1" />
        <path d="M 455 92 A 52 52 0 0 1 470 140" fill="none" stroke={purple} strokeWidth="2.5" />
        <Arrow x={470} y={136} dx={-3} dy={10} color={purple} />
        <text x="478" y="100" fontSize="12" fill={purple}>bánh quay</text>
        <Arrow x={420} y={178} dx={-50} color={slate} label="F′ (lốp lên đường)" offset={18} anchor="start" labelDx={-40} />
        <Arrow x={420} y={162} dx={62} color={orange} label="Fₘₛₙ (đường lên lốp)" offset={-10} anchor="start" labelDx={-50} />
        <text x="420" y="70" textAnchor="middle" fontSize="13" fill="#334155">Xe tăng tốc →</text>
      </Diagram>
    </Figure>
  );
}

export function AirplaneForces() {
  return (
    <Figure id="7.5" title="Hình 7.5 · Bốn lực tác dụng lên máy bay bay bằng"
      caption="Khi máy bay bay bằng với vận tốc không đổi: lực nâng Fₙ cân bằng trọng lực P, lực đẩy của động cơ F_đ cân bằng lực cản Fc (gần đúng, coi các lực cùng phương như hình). Lực nâng sinh ra do không khí chảy qua cánh tạo chênh lệch áp suất giữa mặt dưới và mặt trên, đồng thời cánh làm dòng khí lệch xuống dưới.">
      <Diagram label="Máy bay với lực nâng, trọng lực, lực đẩy và lực cản." height={240}>
        <path d="M 150 120 Q 160 104 200 102 L 380 102 Q 420 104 430 120 Q 420 136 380 138 L 200 138 Q 160 136 150 120 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
        <path d="M 250 120 L 330 120 L 300 60 L 280 60 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
        <path d="M 170 106 L 160 70 L 180 70 L 200 104 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
        <Arrow x={290} y={102} dx={0} dy={-80} color={green} label="Fₙ (lực nâng)" offset={-2} labelDx={10} anchor="start" />
        <Arrow x={290} y={138} dx={0} dy={80} color={slate} label="P" offset={4} labelDx={12} anchor="start" />
        <Arrow x={430} y={120} dx={90} color={blue} label="F_đ (lực đẩy)" offset={-10} anchor="end" />
        <Arrow x={150} y={120} dx={-90} color={orange} label="Fc (lực cản)" offset={-10} anchor="start" />
        <text x="290" y="236" textAnchor="middle" fontSize="12" fill="#475569">v → (bay sang phải)</text>
      </Diagram>
    </Figure>
  );
}

export function CarExampleForces() {
  return (
    <Figure id="7.6" title="Hình 7.6 · Sơ đồ lực của ô tô trong Ví dụ 1"
      caption="Chọn Ox theo chiều chuyển động, Oy thẳng đứng hướng lên. Khi bánh lăn: lực phát động Fₖ là ma sát nghỉ của mặt đường lên bánh chủ động, lực cản lăn Fₗ hướng ngược chuyển động. Khi phanh khóa bánh, ma sát trượt Fₘₛₜ = μₜN thay thế cả hai lực này.">
      <Diagram label="Ô tô với trọng lực, phản lực, lực phát động và lực cản lăn." height={220}>
        <line x1="20" y1="170" x2="540" y2="170" stroke="#94a3b8" strokeWidth="3" />
        <path d="M 170 140 L 180 105 Q 200 80 250 80 L 330 80 Q 370 82 390 110 L 400 140 Z" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="2" />
        <circle cx="215" cy="145" r="24" fill="#1e293b" /><circle cx="360" cy="145" r="24" fill="#1e293b" />
        <Arrow x={285} y={110} dx={0} dy={80} color={slate} label="P" offset={4} labelDx={12} anchor="start" />
        <Arrow x={285} y={80} dx={0} dy={-60} color={green} label="N" offset={2} labelDx={12} anchor="start" />
        <Arrow x={360} y={168} dx={80} color={blue} label="Fₖ" offset={-8} />
        <Arrow x={215} y={168} dx={-50} color={orange} label="Fₗ" offset={-8} />
        <Arrow x={470} y={60} dx={50} color={slate} label="x" offset={-6} width={1.5} />
        <Arrow x={470} y={60} dx={0} dy={-36} color={slate} label="y" offset={0} labelDx={10} width={1.5} />
      </Diagram>
    </Figure>
  );
}

export function ChandelierForces() {
  // Knot A; ceiling line at y = 54. AB meets the ceiling at 30°, AC at 60°.
  const ax = 280, ay = 130, ceiling = 54, rise = ay - ceiling;
  const bx = ax - rise / Math.tan(Math.PI / 6), by = ceiling;
  const cx = ax + rise / Math.tan(Math.PI / 3), cy = ceiling;
  return (
    <Figure id="7.7" title="Hình 7.7 · Đèn chùm treo bằng hai dây (Ví dụ 2)"
      caption="Nút A chịu ba lực căng: T_AB dọc dây AB (hợp với trần 30°), T_AC dọc dây AC (hợp với trần 60°) và T_AD thẳng đứng xuống, có độ lớn bằng trọng lượng đèn. Hai dây hợp với nhau một góc 90°.">
      <Diagram label="Nút A với ba dây AB, AC, AD." height={240}>
        <rect x="40" y="40" width="480" height="14" fill="#cbd5e1" />
        {Array.from({ length: 24 }, (_, i) => <line key={i} x1={44 + i * 20} y1="40" x2={54 + i * 20} y2="30" stroke="#94a3b8" />)}
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#475569" strokeWidth="2" />
        <line x1={ax} y1={ay} x2={cx} y2={cy} stroke="#475569" strokeWidth="2" />
        <line x1={ax} y1={ay} x2={ax} y2={190} stroke="#475569" strokeWidth="2" />
        <text x={bx - 6} y={70} fontSize="13" fill="#334155" textAnchor="end">B</text>
        <text x={cx + 6} y={70} fontSize="13" fill="#334155">C</text>
        <text x={ax - 12} y={ay + 6} fontSize="13" fill="#334155" textAnchor="end">A</text>
        <text x={ax + 10} y={200} fontSize="13" fill="#334155">D</text>
        <path d={`M ${ax - 30} 190 L ${ax + 30} 190 L ${ax + 18} 222 L ${ax - 18} 222 Z`} fill="#fde68a" stroke="#b45309" strokeWidth="2" />
        <Arrow x={ax} y={ay} dx={(bx - ax) * 0.45} dy={(by - ay) * 0.45} color={blue} label="T_AB" offset={18} anchor="end" />
        <Arrow x={ax} y={ay} dx={(cx - ax) * 0.7} dy={(cy - ay) * 0.7} color={green} label="T_AC" offset={-4} labelDx={8} anchor="start" />
        <Arrow x={ax} y={ay} dx={0} dy={45} color={orange} label="T_AD" offset={0} labelDx={-10} anchor="end" />
        <text x={bx + 44} y={70} fontSize="12" fill="#334155">30°</text>
        <text x={cx - 26} y={74} fontSize="12" fill="#334155">60°</text>
      </Diagram>
    </Figure>
  );
}
