'use client';

import { useState } from 'react';
import { Arrow, Diagram, Figure, Readout, Slider, G, activePreset, blue, green, number, orange, presetClass, purple, red, slate } from '@/components/lesson/FigureKit';

const P0 = 1.013e5;
const water = '#bfdbfe', waterLine = '#3b82f6';

/* ------------------------------------------------------------------ */
/* Mô phỏng 15.1 — Áp suất theo độ sâu                                  */
/* ------------------------------------------------------------------ */

const liquids = [
  { name: 'Nước ngọt', rho: 1000, fill: '#bfdbfe' },
  { name: 'Nước biển', rho: 1030, fill: '#a5f3fc' },
  { name: 'Dầu hỏa', rho: 800, fill: '#fde68a' },
  { name: 'Thủy ngân', rho: 13600, fill: '#cbd5e1' },
];

export function PressureDepthSim() {
  const [li, setLi] = useState(0);
  const [h, setH] = useState(4);
  const L = liquids[li];
  const pg = L.rho * G * h, p = P0 + pg;
  const pTop = P0 + L.rho * G * 10;

  const ty = 40, sc = 22; // px per m in the tank
  const gx = 300, gy = 260, sx = 22, sy = 210 / pTop;
  const X = (d: number) => gx + d * sx, Y = (q: number) => gy - q * sy;

  return (
    <Figure id="15.1" badge="Mô phỏng 15.1" title="Áp suất trong chất lỏng tăng theo độ sâu"
      caption="Tại một điểm trong chất lỏng đứng yên, áp suất tác dụng như nhau theo mọi hướng. Áp suất dư ρgh tỉ lệ thuận với độ sâu (đường xanh lá, đi qua gốc); áp suất tuyệt đối p = p₀ + ρgh (đường xanh dương) tăng tuyến tính nhưng không tỉ lệ thuận với h.">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {liquids.map((x, i) => (
          <button key={x.name} type="button" className={`${presetClass} ${i === li ? activePreset : ''}`} onClick={() => setLi(i)}>{x.name} · {x.rho} kg/m³</button>
        ))}
      </div>
      <Diagram label="Bể chất lỏng với đầu dò ở độ sâu h và đồ thị áp suất theo độ sâu." height={290}>
        <rect x="40" y={ty} width="200" height={10 * sc + 10} fill={L.fill} />
        <line x1="40" y1={ty} x2="240" y2={ty} stroke={waterLine} strokeWidth="2" />
        <path d={`M 40 ${ty - 20} L 40 ${ty + 10 * sc + 10} L 240 ${ty + 10 * sc + 10} L 240 ${ty - 20}`} fill="none" stroke="#475569" strokeWidth="3" />
        <text x="140" y={ty - 8} textAnchor="middle" fontSize="12" fill="#334155">p₀ (khí quyển)</text>
        <line x1="60" y1={ty} x2="60" y2={ty + h * sc} stroke={purple} strokeWidth="1.5" />
        <text x="66" y={ty + (h * sc) / 2 + 4} fontSize="12" fill={purple}>h = {number(h, 1)} m</text>
        <circle cx="160" cy={ty + h * sc} r="7" fill="#0f172a" />
        {[[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => (
          <Arrow key={`${dx}${dy}`} x={160 - dx * 30} y={ty + h * sc - dy * 30} dx={dx * 20} dy={dy * 20} color={red} width={2} />
        ))}
        <line x1={gx} y1={gy} x2={gx + 235} y2={gy} stroke="#334155" />
        <line x1={gx} y1={gy} x2={gx} y2={30} stroke="#334155" />
        <text x={gx + 235} y={gy + 16} textAnchor="end" fontSize="12" fill="#334155">h (m)</text>
        <text x={gx + 6} y={36} fontSize="12" fill="#334155">p (kPa)</text>
        {[0, 5, 10].map(d => <text key={d} x={X(d)} y={gy + 14} textAnchor="middle" fontSize="11" fill={slate}>{d}</text>)}
        <text x={gx - 4} y={Y(pTop) + 4} textAnchor="end" fontSize="11" fill={slate}>{number(pTop / 1000, 0)}</text>
        <text x={gx - 4} y={Y(P0) + 4} textAnchor="end" fontSize="11" fill={slate}>101</text>
        <line x1={X(0)} y1={Y(P0)} x2={X(10)} y2={Y(pTop)} stroke={blue} strokeWidth="2" />
        <line x1={X(0)} y1={Y(0)} x2={X(10)} y2={Y(pTop - P0)} stroke={green} strokeWidth="2" />
        <circle cx={X(h)} cy={Y(p)} r="5" fill={blue} />
        <circle cx={X(h)} cy={Y(pg)} r="5" fill={green} />
        <text x={X(10) - 4} y={Y(pTop) - 6} textAnchor="end" fontSize="11" fill={blue}>p tuyệt đối</text>
        <text x={X(10) - 4} y={Y(pTop - P0) + 16} textAnchor="end" fontSize="11" fill={green}>p dư = ρgh</text>
      </Diagram>
      <div className="mt-2">
        <Slider label="Độ sâu h" value={h} min={0} max={10} step={0.1} unit="m" digits={1} onChange={setH} />
      </div>
      <Readout items={[
        ['Áp suất dư ρgh', `${number(pg / 1000, 1)} kPa`],
        ['Áp suất tuyệt đối p', `${number(p / 1000, 1)} kPa`],
        ['p / p₀', `${number(p / P0, 2)}`],
        ['Áp lực lên 1 cm² (dư)', `${number(pg * 1e-4, 2)} N`],
      ]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Hình 15.2 — Nghịch lý thủy tĩnh                                      */
/* ------------------------------------------------------------------ */

export function HydrostaticParadoxDiagram() {
  const by = 210, top = 70, half = 40;
  const vessels = [
    { cx: 100, topHalf: 40, label: 'Bình trụ' },
    { cx: 280, topHalf: 85, label: 'Bình loe miệng' },
    { cx: 460, topHalf: 14, label: 'Bình thu hẹp miệng' },
  ];
  return (
    <Figure id="15.2" title="Hình 15.2 · Cùng đáy, cùng độ cao nước: áp lực lên đáy bằng nhau"
      caption="Ba bình có cùng diện tích đáy và cùng độ cao nước h nên áp suất ở đáy bằng nhau, do đó áp lực của nước lên đáy cũng bằng nhau, dù lượng nước khác nhau. Ở bình loe, thành nghiêng đỡ bớt một phần nước (mũi tên cam hướng lên); ở bình thu hẹp, thành nghiêng ép thêm lên nước (mũi tên cam hướng xuống).">
      <Diagram label="Ba bình hình dạng khác nhau, cùng đáy và cùng mực nước." height={250}>
        {vessels.map(v => (
          <g key={v.cx}>
            <polygon points={`${v.cx - half},${by} ${v.cx + half},${by} ${v.cx + v.topHalf},${top} ${v.cx - v.topHalf},${top}`} fill={water} stroke="#475569" strokeWidth="2.5" />
            <line x1={v.cx - v.topHalf} y1={top} x2={v.cx + v.topHalf} y2={top} stroke={waterLine} strokeWidth="2" />
            <text x={v.cx} y={by + 34} textAnchor="middle" fontSize="13" fill="#334155">{v.label}</text>
            {[-25, -8, 8, 25].map(dx => <Arrow key={dx} x={v.cx + dx} y={by - 34} dx={0} dy={28} color={red} width={2} />)}
            {v.topHalf > half && <Arrow x={v.cx + (half + v.topHalf) / 2 + 4} y={(by + top) / 2 + 20} dx={0} dy={-30} color={orange} width={2} />}
            {v.topHalf < half && <Arrow x={v.cx + (half + v.topHalf) / 2 + 2} y={(by + top) / 2 - 20} dx={0} dy={26} color={orange} width={2} />}
          </g>
        ))}
        <line x1="20" y1={top} x2="20" y2={by} stroke={purple} strokeWidth="1.5" />
        <text x="26" y={(top + by) / 2} fontSize="13" fill={purple}>h</text>
        <text x="280" y={by + 18} textAnchor="middle" fontSize="12" fill={red}>áp suất ở đáy đều bằng p₀ + ρgh</text>
      </Diagram>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 15.3 — Máy nén thủy lực                                     */
/* ------------------------------------------------------------------ */

export function HydraulicPressSim() {
  const [d1, setD1] = useState(2); // cm
  const [d2, setD2] = useState(20); // cm
  const [F1, setF1] = useState(255);
  const [s1, setS1] = useState(20); // cm

  const ratio = (d2 / d1) ** 2;
  const F2 = F1 * ratio, h2 = s1 / ratio;
  const w1 = 6 * d1, w2 = 3 * d2;
  const x1 = 130, x2 = 390, bottom = 250, pipe = 22;
  const y1 = 70 + s1 * 4, y2 = 150 - h2 * 4; // pistons, 4 px per cm

  return (
    <Figure id="15.3" badge="Mô phỏng 15.3" title="Máy nén thủy lực: lợi về lực, thiệt về đường đi"
      caption="Áp suất do pittông nhỏ gây ra được truyền nguyên vẹn tới pittông lớn: F₁/S₁ = F₂/S₂. Thể tích dầu bị đẩy đi ở hai bên bằng nhau nên S₁s₁ = S₂s₂. Do đó công F₁s₁ bằng công F₂s₂ (bỏ qua ma sát): máy không tạo ra năng lượng.">
      <Diagram label="Hai xi-lanh thông nhau chứa dầu, pittông nhỏ bên trái bị ấn xuống, pittông lớn bên phải nâng vật." height={290}>
        <path d={`M ${x1 - w1 / 2} 40 L ${x1 - w1 / 2} ${bottom} L ${x2 + w2 / 2} ${bottom} L ${x2 + w2 / 2} 60 M ${x2 - w2 / 2} 60 L ${x2 - w2 / 2} ${bottom - pipe} L ${x1 + w1 / 2} ${bottom - pipe} L ${x1 + w1 / 2} 40`} fill="none" stroke="#475569" strokeWidth="3" />
        <rect x={x1 - w1 / 2} y={y1} width={w1} height={bottom - y1} fill="#fde68a" />
        <rect x={x1 + w1 / 2} y={bottom - pipe} width={x2 - w2 / 2 - x1 - w1 / 2} height={pipe} fill="#fde68a" />
        <rect x={x2 - w2 / 2} y={y2} width={w2} height={bottom - y2} fill="#fde68a" />
        <rect x={x1 - w1 / 2} y={y1 - 8} width={w1} height="8" fill="#334155" />
        <rect x={x2 - w2 / 2} y={y2 - 8} width={w2} height="8" fill="#334155" />
        <rect x={x2 - 45} y={y2 - 42} width="90" height="34" rx="6" fill="#bfdbfe" stroke={blue} strokeWidth="2" />
        <text x={x2} y={y2 - 20} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">{number(F2 / G, 0)} kg</text>
        <Arrow x={x1} y={y1 - 50} dx={0} dy={40} color={orange} label="F⃗₁" offset={0} labelDx={-16} />
        <Arrow x={x2 + w2 / 2 + 18} y={y2} dx={0} dy={-50} color={green} label="F⃗₂" offset={0} labelDx={16} />
        <line x1={x1 + w1 / 2 + 8} y1="70" x2={x1 + w1 / 2 + 8} y2={y1} stroke={purple} strokeWidth="1.5" />
        <text x={x1 + w1 / 2 + 12} y={(70 + y1) / 2 + 4} fontSize="12" fill={purple}>s₁ = {number(s1, 0)} cm</text>
        <text x={x2 - w2 / 2 - 6} y={y2 + 16} textAnchor="end" fontSize="12" fill={purple}>s₂ = {number(h2, 2)} cm</text>
        <text x={(x1 + x2) / 2} y={bottom - 30} textAnchor="middle" fontSize="12" fill="#92400e">dầu thủy lực</text>
      </Diagram>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Slider label="Đường kính pittông nhỏ d₁" value={d1} min={1} max={5} step={0.5} unit="cm" digits={1} onChange={setD1} />
        <Slider label="Đường kính pittông lớn d₂" value={d2} min={10} max={40} step={1} unit="cm" digits={0} onChange={setD2} />
        <Slider label="Lực ấn F₁" value={F1} min={50} max={500} step={5} unit="N" digits={0} onChange={setF1} />
        <Slider label="Đoạn ấn pittông nhỏ s₁" value={s1} min={0} max={30} step={1} unit="cm" digits={0} onChange={setS1} />
      </div>
      <Readout items={[
        ['S₂/S₁ = (d₂/d₁)²', number(ratio, 1)],
        ['Lực nâng F₂', `${number(F2, 0)} N`],
        ['Công F₁s₁', `${number(F1 * s1 / 100, 1)} J`],
        ['Công F₂s₂', `${number(F2 * h2 / 100, 1)} J`],
      ]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Hình 15.4 — Thí nghiệm Torricelli                                    */
/* ------------------------------------------------------------------ */

export function TorricelliDiagram() {
  return (
    <Figure id="15.4" title="Hình 15.4 · Thí nghiệm Torricelli"
      caption="Áp suất tại điểm A (trong ống) bằng áp suất tại điểm B (trên mặt thoáng thủy ngân trong chậu) vì hai điểm cùng nằm trên một mặt phẳng ngang. Phía trên cột thủy ngân gần như chân không nên p_A = ρgh, còn p_B = p₀. Vậy p₀ = ρgh với h ≈ 760 mm.">
      <Diagram label="Ống thủy tinh úp ngược trong chậu thủy ngân, cột thủy ngân cao 760 mm." height={280}>
        <rect x="140" y="190" width="280" height="70" fill="#cbd5e1" stroke="#475569" strokeWidth="2.5" />
        <rect x="262" y="20" width="36" height="215" fill="#f8fafc" stroke="#475569" strokeWidth="2.5" />
        <rect x="264" y="70" width="32" height="163" fill="#94a3b8" />
        <text x="306" y="48" fontSize="12" fill={slate}>chân không (p ≈ 0)</text>
        <line x1="240" y1="70" x2="240" y2="190" stroke={purple} strokeWidth="1.5" />
        <text x="234" y="134" textAnchor="end" fontSize="13" fill={purple}>h ≈ 760 mm</text>
        <circle cx="280" cy="190" r="4" fill="#0f172a" />
        <text x="286" y="206" fontSize="13" fill="#0f172a">A</text>
        <circle cx="380" cy="190" r="4" fill="#0f172a" />
        <text x="386" y="184" fontSize="13" fill="#0f172a">B</text>
        <Arrow x={380} y={140} dx={0} dy={44} color={blue} label="p₀" offset={-50} labelDx={14} />
        <Arrow x={180} y={140} dx={0} dy={44} color={blue} label="p₀" offset={-50} labelDx={-14} />
      </Diagram>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 15.5 — Vật nổi, lơ lửng, chìm                               */
/* ------------------------------------------------------------------ */

const blocks = [
  { name: 'Gỗ', rho: 600 }, { name: 'Nước đá', rho: 920 }, { name: 'Nhôm', rho: 2700 }, { name: 'Sắt', rho: 7800 }, { name: 'Vàng', rho: 19300 },
];
const fluids = [
  { name: 'Nước', rho: 1000, fill: '#bfdbfe' }, { name: 'Dầu hỏa', rho: 800, fill: '#fde68a' }, { name: 'Thủy ngân', rho: 13600, fill: '#cbd5e1' },
];

export function BuoyancySim() {
  const [rv, setRv] = useState(600);
  const [fi, setFi] = useState(0);
  const Fl = fluids[fi];
  const V = 1e-3; // 1 dm³
  const P = rv * G * V;
  const state = Math.abs(rv - Fl.rho) < 1 ? 'suspend' : rv < Fl.rho ? 'float' : 'sink';
  const frac = state === 'float' ? rv / Fl.rho : 1;
  const FA = Fl.rho * G * V * frac;
  const N = state === 'sink' ? P - FA : 0;

  const surf = 80, bot = 260, a = 80, cx = 280;
  const topY = state === 'float' ? surf - (1 - frac) * a : state === 'suspend' ? 130 : bot - a;
  const k = 70 / Math.max(P, FA);
  const cy = topY + a / 2;

  return (
    <Figure id="15.5" badge="Mô phỏng 15.5" title="Vật nổi, lơ lửng hay chìm?"
      caption="Khối lập phương có thể tích 1 dm³. Nếu khối lượng riêng của vật nhỏ hơn của chất lỏng, vật nổi và phần chìm vừa đủ để lực đẩy Archimedes bằng trọng lượng; tỉ lệ phần chìm bằng ρ_vật/ρ_lỏng. Nếu lớn hơn, vật chìm xuống đáy và đáy bình đỡ phần còn lại.">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {fluids.map((f, i) => (
          <button key={f.name} type="button" className={`${presetClass} ${i === fi ? activePreset : ''}`} onClick={() => setFi(i)}>Chất lỏng: {f.name} ({f.rho})</button>
        ))}
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {blocks.map(b => (
          <button key={b.name} type="button" className={`${presetClass} ${rv === b.rho ? activePreset : ''}`} onClick={() => setRv(b.rho)}>{b.name} ({b.rho})</button>
        ))}
      </div>
      <Diagram label="Khối lập phương trong bể chất lỏng với trọng lực và lực đẩy Archimedes." height={290}>
        <rect x="120" y={surf} width="320" height={bot - surf} fill={Fl.fill} />
        <line x1="120" y1={surf} x2="440" y2={surf} stroke={waterLine} strokeWidth="2" />
        <path d={`M 120 40 L 120 ${bot} L 440 ${bot} L 440 40`} fill="none" stroke="#475569" strokeWidth="3" />
        <rect x={cx - a / 2} y={topY} width={a} height={a} fill="#f5d0a9" stroke="#92400e" strokeWidth="2" opacity="0.92" />
        <Arrow x={cx - 14} y={cy} dx={0} dy={k * P} color={slate} label="P⃗" offset={14} labelDx={-12} />
        <Arrow x={cx + 14} y={cy} dx={0} dy={-k * FA} color={blue} label="F⃗A" offset={-6} labelDx={16} />
        {N > 1e-9 && <Arrow x={cx + 34} y={bot} dx={0} dy={-k * N} color={orange} label="N⃗ (đáy)" offset={-6} labelDx={34} />}
        <text x="540" y="30" textAnchor="end" fontSize="14" fontWeight="700" fill={state === 'sink' ? red : green}>
          {state === 'float' ? `Nổi: chìm ${number(frac * 100, 0)}% thể tích` : state === 'suspend' ? 'Lơ lửng' : 'Chìm xuống đáy'}
        </text>
      </Diagram>
      <div className="mt-2">
        <Slider label="Khối lượng riêng của vật" value={rv} min={100} max={20000} step={100} unit="kg/m³" digits={0} onChange={setRv} />
      </div>
      <Readout items={[
        ['Trọng lượng P', `${number(P, 2)} N`],
        ['Lực đẩy F_A', `${number(FA, 2)} N`],
        ['Phần chìm', `${number(frac * 100, 0)} %`],
        ['Treo lực kế, nhúng chìm', P > Fl.rho * G * V ? `${number(P - Fl.rho * G * V, 2)} N` : 'vật tự nổi'],
      ]} />
    </Figure>
  );
}
