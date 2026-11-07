'use client';

import { useState } from 'react';
import { Arrow, Diagram, Figure, Readout, Slider, G, activePreset, blue, green, number, orange, presetClass, purple, red, slate } from '@/components/lesson/FigureKit';

const rad = (deg: number) => (deg * Math.PI) / 180;

/* ------------------------------------------------------------------ */
/* Mô phỏng 9.1 — Công của một lực: W = F·d·cosα                       */
/* ------------------------------------------------------------------ */

export function WorkAngle() {
  const [F, setF] = useState(100);
  const [d, setD] = useState(5);
  const [alpha, setAlpha] = useState(30);
  const cos = Math.cos(rad(alpha));
  const W = F * d * (Math.abs(cos) < 1e-9 ? 0 : cos);
  const kind = Math.abs(W) < 1e-6 ? 'zero' : W > 0 ? 'drive' : 'resist';
  const color = kind === 'drive' ? green : kind === 'zero' ? slate : red;
  const label = kind === 'drive' ? 'Công phát động (W > 0)' : kind === 'zero' ? 'Lực không sinh công (W = 0)' : 'Công cản (W < 0)';
  const k = 0.9; // px per newton
  const bx = 150, by = 150;
  const fx = Math.cos(rad(alpha)) * F * k, fy = -Math.sin(rad(alpha)) * F * k;
  const dpx = 40 + d * 32;

  return (
    <Figure id="9.1" badge="Mô phỏng" title="Mô phỏng 9.1 · Công của một lực không đổi"
      caption="Vật dịch chuyển sang phải một đoạn d. Lực F hợp với hướng dịch chuyển góc α. Chỉ thành phần của lực dọc theo độ dịch chuyển, F·cosα (mũi tên nét đứt), mới sinh công. Thành phần vuông góc với độ dịch chuyển không sinh công.">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
          <Slider label="Lực F" value={F} min={0} max={150} step={5} unit="N" digits={0} onChange={setF} />
          <Slider label="Độ dịch chuyển d" value={d} min={0} max={10} step={0.5} unit="m" digits={1} onChange={setD} />
          <Slider label="Góc α" value={alpha} min={0} max={180} step={1} unit="°" digits={0} onChange={setAlpha} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[0, 60, 90, 120, 180].map(a => <button key={a} type="button" onClick={() => setAlpha(a)} className={`${presetClass} ${alpha === a ? activePreset : ''}`}>α = {a}°</button>)}
        </div>
      </div>
      <Diagram label={`Công ${number(W, 0)} J, ${label}.`} height={240}>
        <line x1="20" y1="190" x2="540" y2="190" stroke="#94a3b8" strokeWidth="3" />
        <rect x={bx - 35} y="150" width="70" height="40" rx="4" fill="#fde68a" stroke="#b45309" strokeWidth="2" opacity="0.45" />
        <rect x={bx - 35 + dpx} y="150" width="70" height="40" rx="4" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
        <Arrow x={bx} y={212} dx={dpx} color={purple} label={`d = ${number(d, 1)} m`} offset={18} />
        <Arrow x={bx + dpx} y={by + 20} dx={fx} dy={fy} color={blue} label="F" offset={-6} labelDx={fx >= 0 ? 10 : -10} />
        <Arrow x={bx + dpx} y={by + 20} dx={fx} dy={0} color={color} dashed label="F·cosα" offset={fy < -20 ? 18 : -8} />
        <text x="540" y="34" textAnchor="end" fontSize="15" fontWeight="700" fill={color}>{label}</text>
        <text x="540" y="56" textAnchor="end" fontSize="13" fill="#334155">W = F·d·cosα = {number(W, 0)} J</text>
      </Diagram>
      <Readout items={[['cos α', number(cos, 3)], ['F·cosα', `${number(F * cos, 1)} N`], ['Công W', `${number(W, 0)} J`], ['Loại công', kind === 'drive' ? 'phát động' : kind === 'zero' ? 'không sinh công' : 'cản']]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 9.2 — Công suất P = F·v: leo dốc phải chạy chậm             */
/* ------------------------------------------------------------------ */

export function PowerHill() {
  const [P, setP] = useState(60);
  const [theta, setTheta] = useState(6);
  const m = 2600;
  const drag = (speed: number) => 400 + 0.8 * speed * speed; // cản lăn + cản không khí (giả định)
  const grade = m * G * Math.sin(rad(theta));
  // Solve P = (grade + drag(v))·v for v by bisection (left side increases with v).
  let lo = 0, hi = 120;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if ((grade + drag(mid)) * mid > P * 1000) hi = mid; else lo = mid;
  }
  const v = lo;
  const Fc = drag(v);
  const F = grade + Fc;
  const slopeLen = 360;
  const sx = 80, sy = 210;
  const ex = sx + slopeLen * Math.cos(rad(theta * 2.2)), ey = sy - slopeLen * Math.sin(rad(theta * 2.2)); // exaggerated drawing angle
  const cx = sx + 0.45 * (ex - sx), cy = sy + 0.45 * (ey - sy);
  const speedBar = Math.min(1, v / 60);

  return (
    <Figure id="9.2" badge="Mô phỏng" title="Mô phỏng 9.2 · Công suất động cơ và tốc độ khi lên dốc"
      caption="Ô tô 2600 kg chạy đều lên dốc (số liệu giả định); lực cản lăn và cản không khí mô hình hóa F_c = 400 N + 0,8·v² (v tính bằng m/s). Chạy đều nên lực phát động F = mg·sinθ + F_c, và công suất P = F·v. Với P đã chọn, dốc càng lớn thì lực cần càng lớn, nên tốc độ đều đạt được càng nhỏ. Hình vẽ phóng đại độ dốc.">
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-2">
        <Slider label="Công suất có ích P" value={P} min={10} max={150} step={5} unit="kW" digits={0} onChange={setP} />
        <Slider label="Góc dốc θ" value={theta} min={0} max={15} step={0.5} unit="°" digits={1} onChange={setTheta} />
      </div>
      <Diagram label={`Lực phát động ${number(F, 0)} N, tốc độ ${number(v)} m/s.`} height={240}>
        <polygon points={`${sx},${sy} ${ex},${ey} ${ex},${sy}`} fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
        <g transform={`rotate(${-theta * 2.2} ${cx} ${cy})`}>
          <rect x={cx - 34} y={cy - 26} width="68" height="22" rx="6" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="2" />
          <circle cx={cx - 20} cy={cy - 3} r="7" fill="#1e293b" /><circle cx={cx + 20} cy={cy - 3} r="7" fill="#1e293b" />
        </g>
        <Arrow x={cx} y={cy - 40} dx={Math.cos(rad(theta * 2.2)) * Math.min(120, F / 40)} dy={-Math.sin(rad(theta * 2.2)) * Math.min(120, F / 40)} color={blue} label="F" offset={-8} />
        <rect x="380" y="24" width="160" height="16" rx="8" fill="#e2e8f0" />
        <rect x="380" y="24" width={160 * speedBar} height="16" rx="8" fill={v < 8 ? red : green} />
        <text x="540" y="58" textAnchor="end" fontSize="13" fill="#334155">v = {number(v, 1)} m/s ≈ {number(v * 3.6, 0)} km/h</text>
        <text x="540" y="78" textAnchor="end" fontSize="13" fill="#334155">F = {number(F, 0)} N</text>
      </Diagram>
      <Readout items={[['mg·sinθ', `${number(grade, 0)} N`], ['Lực cản F_c', `${number(Fc, 0)} N`], ['Lực phát động F', `${number(F, 0)} N`], ['v = P/F', `${number(v, 1)} m/s (${number(v * 3.6, 0)} km/h)`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 9.3 — Hiệu suất: năng lượng có ích và hao phí               */
/* ------------------------------------------------------------------ */

const machines = [
  { key: 'ev', label: 'Động cơ điện', H: 88 },
  { key: 'petrol', label: 'Động cơ xăng', H: 28 },
  { key: 'lamp', label: 'Bóng đèn sợi đốt (ánh sáng)', H: 5 },
  { key: 'led', label: 'Đèn LED (ánh sáng)', H: 40 },
];

export function EfficiencyFlow() {
  const [H, setH] = useState(88);
  const [Wtp, setWtp] = useState(100);
  const useful = (H / 100) * Wtp, loss = Wtp - useful;
  const width = 440;

  return (
    <Figure id="9.3" badge="Mô phỏng" title="Mô phỏng 9.3 · Năng lượng toàn phần, có ích và hao phí"
      caption="Chiều rộng mỗi dải tỉ lệ với lượng năng lượng. Năng lượng toàn phần chia thành phần có ích và phần hao phí (chủ yếu thành nhiệt): W_tp = W_ích + W_hp, H = W_ích/W_tp. Các giá trị hiệu suất mẫu chỉ mang tính tham khảo, thay đổi theo từng thiết bị.">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Slider label="Năng lượng toàn phần W_tp" value={Wtp} min={10} max={200} step={5} unit="kJ" digits={0} onChange={setWtp} />
          <Slider label="Hiệu suất H" value={H} min={1} max={100} step={1} unit="%" digits={0} onChange={setH} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {machines.map(mc => <button key={mc.key} type="button" onClick={() => setH(mc.H)} className={`${presetClass} ${H === mc.H ? activePreset : ''}`}>{mc.label} ~{mc.H}%</button>)}
        </div>
      </div>
      <Diagram label={`Có ích ${number(useful, 1)} kJ, hao phí ${number(loss, 1)} kJ.`} height={200}>
        <rect x="60" y="40" width={width} height="34" rx="6" fill="#dbeafe" stroke={blue} />
        <text x="70" y="62" fontSize="13" fontWeight="700" fill="#1e3a8a">Toàn phần: {number(Wtp, 0)} kJ</text>
        <rect x="60" y="110" width={Math.max(2, (width * useful) / Wtp)} height="34" rx="6" fill="#ccfbf1" stroke={green} />
        <rect x={60 + (width * useful) / Wtp} y="110" width={Math.max(0, (width * loss) / Wtp)} height="34" rx="6" fill="#fee2e2" stroke={red} />
        <text x="66" y="166" fontSize="13" fontWeight="700" fill={green}>Có ích: {number(useful, 1)} kJ</text>
        <text x="500" y="166" textAnchor="end" fontSize="13" fontWeight="700" fill={red}>Hao phí: {number(loss, 1)} kJ</text>
        <path d={`M 60 74 L 60 110 M 500 74 L 500 110`} stroke="#94a3b8" strokeDasharray="4 4" />
        <text x="280" y="196" textAnchor="middle" fontSize="13" fill="#334155">H = {number(H, 0)}%</text>
      </Diagram>
      <Readout items={[['W_tp', `${number(Wtp, 0)} kJ`], ['W_ích', `${number(useful, 1)} kJ`], ['W_hp', `${number(loss, 1)} kJ`], ['H', `${number(H, 0)}%`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Hình tĩnh                                                           */
/* ------------------------------------------------------------------ */

export function CrateWorkForces() {
  const bx = 220, by = 150;
  return (
    <Figure id="9.4" title="Hình 9.4 · Các lực tác dụng lên thùng hàng (Ví dụ 1)"
      caption="Thùng dịch chuyển sang phải. Lực kéo F_k hợp với hướng dịch chuyển 30° nên sinh công dương. Ma sát ngược chiều dịch chuyển (180°) sinh công âm. Trọng lực và phản lực vuông góc với dịch chuyển (90°) không sinh công.">
      <Diagram label="Thùng hàng với lực kéo xiên, ma sát, trọng lực và phản lực." height={230}>
        <line x1="20" y1="190" x2="540" y2="190" stroke="#94a3b8" strokeWidth="3" />
        <rect x={bx - 45} y={by - 10} width="90" height="50" rx="4" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
        <Arrow x={bx + 45} y={by} dx={95} dy={-55} color={blue} label="F_k" offset={-6} labelDx={10} />
        <Arrow x={bx - 45} y={186} dx={-60} color={orange} label="Fₘₛ" offset={-8} />
        <Arrow x={bx} y={by + 15} dx={0} dy={70} color={slate} label="P" offset={14} labelDx={12} />
        <Arrow x={bx} y={by - 10} dx={0} dy={-60} color={green} label="N" offset={-4} labelDx={12} />
        <Arrow x={330} y={212} dx={120} color={purple} label="d (hướng dịch chuyển)" offset={18} />
        <text x={bx + 82} y={by - 4} fontSize="12" fill="#334155">30°</text>
      </Diagram>
    </Figure>
  );
}

export function OrbitNoWork() {
  const cx = 280, cy = 125, R = 90;
  const a = rad(35);
  const px = cx + R * Math.cos(a), py = cy - R * Math.sin(a);
  return (
    <Figure id="9.5" title="Hình 9.5 · Lực hấp dẫn và vận tốc trên quỹ đạo tròn"
      caption="Trong mô hình quỹ đạo tròn, lực hấp dẫn của Trái Đất lên Mặt Trăng luôn hướng vào tâm, còn vận tốc (và mỗi độ dịch chuyển rất nhỏ) luôn tiếp tuyến với quỹ đạo. Hai hướng vuông góc nên lực hấp dẫn không sinh công và tốc độ của Mặt Trăng không đổi.">
      <Diagram label="Mặt Trăng trên quỹ đạo tròn quanh Trái Đất." height={250}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#94a3b8" strokeDasharray="5 4" />
        <circle cx={cx} cy={cy} r="22" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="2" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e3a8a">Trái Đất</text>
        <circle cx={px} cy={py} r="9" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
        <Arrow x={px} y={py} dx={(cx - px) * 0.55} dy={(cy - py) * 0.55} color={orange} label="F (hướng tâm)" offset={20} anchor="end" />
        <Arrow x={px} y={py} dx={-Math.sin(a) * 70} dy={-Math.cos(a) * 70} color={blue} label="v" offset={-6} labelDx={-6} />
        <text x="540" y="232" textAnchor="end" fontSize="13" fill={green}>F ⟂ v ⇒ W = 0</text>
      </Diagram>
    </Figure>
  );
}
