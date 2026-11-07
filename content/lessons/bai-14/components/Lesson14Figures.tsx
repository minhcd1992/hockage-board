'use client';

import { useState } from 'react';
import { Arrow, Diagram, Figure, Readout, Slider, G, activePreset, blue, green, number, orange, presetClass, purple, red, slate } from '@/components/lesson/FigureKit';
import { coil } from './springPath';

/* ------------------------------------------------------------------ */
/* Hình 14.1 — Mô hình "lò xo vi mô" giữa các nguyên tử                */
/* ------------------------------------------------------------------ */

export function MicroSpringDiagram() {
  const rows = [
    { y: 50, label: 'Bị nén: r < r₀', gap: 50, color: red, arrow: 'out', note: 'lực đẩy' },
    { y: 135, label: 'Không biến dạng: r = r₀', gap: 80, color: slate, arrow: 'none', note: 'hợp lực bằng 0' },
    { y: 220, label: 'Bị kéo: r > r₀', gap: 120, color: blue, arrow: 'in', note: 'lực hút' },
  ];
  return (
    <Figure id="14.1" title="Hình 14.1 · Liên kết giữa các nguyên tử như những lò xo rất nhỏ"
      caption="Ở khoảng cách cân bằng r₀, lực hút và lực đẩy giữa hai nguyên tử cân bằng nhau. Bị nén thì lực đẩy thắng, bị kéo thì lực hút thắng: lực tương tác luôn chống lại sự thay đổi khoảng cách. Tổng hợp vô số lực như vậy tạo nên lực đàn hồi của vật.">
      <Diagram label="Ba trạng thái của hai nguyên tử: bị nén, cân bằng và bị kéo." height={260}>
        {rows.map(r => {
          const x1 = 330 - r.gap / 2, x2 = 330 + r.gap / 2;
          return (
            <g key={r.y}>
              <text x="20" y={r.y + 5} fontSize="13" fill="#334155">{r.label}</text>
              <path d={`M ${x1 + 14} ${r.y} ` + Array.from({ length: 8 }, (_, i) => `L ${x1 + 14 + ((x2 - x1 - 28) * (i + 0.5)) / 8} ${r.y + (i % 2 ? -6 : 6)}`).join(' ') + ` L ${x2 - 14} ${r.y}`} fill="none" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx={x1} cy={r.y} r="14" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
              <circle cx={x2} cy={r.y} r="14" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
              {r.arrow === 'out' && <><Arrow x={x1 - 16} y={r.y} dx={-34} color={r.color} /><Arrow x={x2 + 16} y={r.y} dx={34} color={r.color} /></>}
              {r.arrow === 'in' && <><Arrow x={x1 - 50} y={r.y} dx={34} color={r.color} /><Arrow x={x2 + 50} y={r.y} dx={-34} color={r.color} /></>}
              <text x="540" y={r.y + 5} textAnchor="end" fontSize="13" fontWeight="700" fill={r.color}>{r.note}</text>
            </g>
          );
        })}
      </Diagram>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 14.1 — Định luật Hooke và giới hạn đàn hồi                  */
/* ------------------------------------------------------------------ */

const L0 = 0.2, YIELD = 0.06, FMAX = 0.6 * G; // natural length, elastic-limit extension (m), max load (N)

export function HookeLab() {
  const [k, setK] = useState(80);
  const [m, setM] = useState(200); // g
  const [peak, setPeak] = useState(0); // largest load so far on this spring (N)

  const F = (m / 1000) * G;
  const Fy = k * YIELD, kp = k / 3; // elastic limit and slope beyond it
  const Fp = Math.max(peak, F);
  const dPeak = Fp <= Fy ? Fp / k : YIELD + (Fp - Fy) / kp;
  const resid = dPeak - Fp / k; // permanent set after unloading
  const dL = resid + F / k;
  const plastic = resid > 1e-6;

  const changeM = (x: number) => { setM(x); setPeak(p => Math.max(p, (x / 1000) * G)); };
  const newSpring = () => { setPeak(0); setM(0); };

  // Spring picture: 400 px per metre.
  const top = 30, bottom = top + (L0 + dL) * 400;
  // Graph F–ΔL.
  const gx = 300, gy = 270, sx = 220 / 0.35, sy = 230 / 6;
  const X = (d: number) => gx + d * sx, Y = (f: number) => gy - f * sy;
  const loadPath = Fy >= FMAX
    ? `M ${X(0)} ${Y(0)} L ${X(FMAX / k)} ${Y(FMAX)}`
    : `M ${X(0)} ${Y(0)} L ${X(YIELD)} ${Y(Fy)} L ${X(YIELD + (FMAX - Fy) / kp)} ${Y(FMAX)}`;

  return (
    <Figure id="14.2" badge="Mô phỏng 14.2" title="Treo vật vào lò xo: định luật Hooke và giới hạn đàn hồi"
      caption="Trong giới hạn đàn hồi, đồ thị F theo ΔL là đoạn thẳng qua gốc có hệ số góc k. Lò xo ảo này có giới hạn đàn hồi ở độ dãn 6 cm. Treo vật nặng hơn, lò xo bị biến dạng dẻo: khi bớt vật, lò xo co lại theo đường song song (màu cam) và không về được chiều dài ban đầu.">
      <Diagram label="Lò xo treo thẳng đứng mang vật nặng và đồ thị lực đàn hồi theo độ dãn." height={300}>
        <rect x="70" y={top - 10} width="100" height="10" fill="#94a3b8" />
        <line x1="190" y1={top + L0 * 400} x2="240" y2={top + L0 * 400} stroke={slate} strokeDasharray="4 3" />
        <text x="244" y={top + L0 * 400 + 4} fontSize="12" fill={slate}>L₀</text>
        <path d={coil(120, top, bottom, 14, 11)} fill="none" stroke={plastic ? orange : blue} strokeWidth="2" />
        {m > 0 && <rect x="100" y={bottom} width="40" height="26" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />}
        {m > 0 && <text x="120" y={bottom + 17} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">{m} g</text>}
        {F > 0 && <Arrow x={150} y={bottom - 4} dx={0} dy={-Math.min(80, 14 * F)} color={green} label="F⃗đh" offset={-4} labelDx={20} />}
        <line x1={gx} y1={gy} x2={gx + 240} y2={gy} stroke="#334155" />
        <line x1={gx} y1={gy} x2={gx} y2={25} stroke="#334155" />
        <text x={gx + 240} y={gy + 16} textAnchor="end" fontSize="12" fill="#334155">ΔL</text>
        <text x={gx + 6} y={32} fontSize="12" fill="#334155">F (N)</text>
        {[2, 4, 6].map(f => <text key={f} x={gx - 6} y={Y(f) + 4} textAnchor="end" fontSize="11" fill={slate}>{f}</text>)}
        {[0.1, 0.2, 0.3].map(d => <text key={d} x={X(d)} y={gy + 14} textAnchor="middle" fontSize="11" fill={slate}>{d * 100} cm</text>)}
        <path d={loadPath} fill="none" stroke={blue} strokeWidth="2" />
        {Fy < FMAX && <circle cx={X(YIELD)} cy={Y(Fy)} r="4" fill={purple} />}
        {Fy < FMAX && <text x={X(YIELD) + 8} y={Y(Fy) + 16} fontSize="11" fill={purple}>giới hạn đàn hồi</text>}
        {plastic && <line x1={X(resid)} y1={Y(0)} x2={X(dPeak)} y2={Y(Fp)} stroke={orange} strokeWidth="2" strokeDasharray="5 3" />}
        <circle cx={X(dL)} cy={Y(F)} r="6" fill={plastic ? orange : green} />
      </Diagram>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Slider label="Khối lượng vật treo m" value={m} min={0} max={600} step={20} unit="g" digits={0} onChange={changeM} />
        <Slider label="Độ cứng lò xo k" value={k} min={40} max={200} step={10} unit="N/m" digits={0} onChange={x => { setK(x); setPeak(0); }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className={presetClass} onClick={newSpring}>Thay lò xo mới</button>
        <span className={`text-xs font-semibold ${plastic ? 'text-orange-700' : 'text-teal-700'}`}>
          {plastic ? `Đã vượt giới hạn đàn hồi: bỏ hết vật, lò xo vẫn dài hơn L₀ khoảng ${number(resid * 100, 1)} cm.` : 'Đang trong giới hạn đàn hồi: bỏ vật, lò xo trở về L₀.'}
        </span>
      </div>
      <Readout items={[
        ['F_đh = P = mg', `${number(F, 2)} N`],
        ['Độ dãn ΔL', `${number(dL * 100, 1)} cm`],
        ['Chiều dài L', `${number((L0 + dL) * 100, 1)} cm`],
        ['F/ΔL', dL > 0 ? `${number(F / dL, 0)} N/m` : '—'],
      ]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 14.3 — Ghép lò xo (mở rộng)                                 */
/* ------------------------------------------------------------------ */

export function SpringCombinationSim() {
  const [mode, setMode] = useState<'parallel' | 'series'>('parallel');
  const [k1, setK1] = useState(60);
  const [k2, setK2] = useState(40);
  const [F, setF] = useState(6);

  const par = mode === 'parallel';
  const kt = par ? k1 + k2 : (k1 * k2) / (k1 + k2);
  const dL = F / kt;
  const d1 = par ? dL : F / k1, d2 = par ? dL : F / k2;
  const F1 = par ? k1 * dL : F, F2 = par ? k2 * dL : F;
  const L0px = 60, s = Math.min(300, (par ? 140 : 100) / Math.max(dL, 1e-6));
  const top = 25;

  return (
    <Figure id="14.3" badge="Mô phỏng 14.3 · Mở rộng" title="Ghép hai lò xo song song và nối tiếp"
      caption="Ghép song song: hai lò xo có cùng độ dãn, lực kéo chia cho hai lò xo, k = k₁ + k₂ (cứng hơn). Ghép nối tiếp: hai lò xo chịu cùng một lực, độ dãn cộng lại, 1/k = 1/k₁ + 1/k₂ (mềm hơn). Khi biến dạng lớn, hình được thu nhỏ để vừa khung.">
      <div className="mb-2 flex flex-wrap gap-1.5">
        <button type="button" className={`${presetClass} ${par ? activePreset : ''}`} onClick={() => setMode('parallel')}>Song song</button>
        <button type="button" className={`${presetClass} ${!par ? activePreset : ''}`} onClick={() => setMode('series')}>Nối tiếp</button>
      </div>
      <Diagram label={par ? 'Hai lò xo ghép song song nối với một thanh ngang.' : 'Hai lò xo ghép nối tiếp, lò xo này nối dưới lò xo kia.'} height={280}>
        <rect x="160" y={top - 10} width="240" height="10" fill="#94a3b8" />
        {par ? (() => {
          const yb = top + L0px + dL * s;
          return (
            <g>
              <path d={coil(230, top, yb, 12, 10)} fill="none" stroke={blue} strokeWidth="2" />
              <path d={coil(330, top, yb, 12, 10)} fill="none" stroke={orange} strokeWidth="2" />
              <rect x="210" y={yb} width="140" height="8" fill="#475569" />
              <Arrow x={280} y={yb + 8} dx={0} dy={40} color={green} label={`F = ${number(F, 1)} N`} offset={14} labelDx={40} />
              <text x="215" y={top + 30} textAnchor="end" fontSize="13" fill={blue}>k₁</text>
              <text x="345" y={top + 30} fontSize="13" fill={orange}>k₂</text>
            </g>
          );
        })() : (() => {
          const ym = top + L0px + d1 * s, yb = ym + L0px + d2 * s;
          return (
            <g>
              <path d={coil(280, top, ym, 12, 10)} fill="none" stroke={blue} strokeWidth="2" />
              <circle cx="280" cy={ym} r="4" fill="#475569" />
              <path d={coil(280, ym, yb, 12, 10)} fill="none" stroke={orange} strokeWidth="2" />
              <rect x="260" y={yb} width="40" height="8" fill="#475569" />
              <Arrow x={280} y={yb + 8} dx={0} dy={34} color={green} label={`F = ${number(F, 1)} N`} offset={14} labelDx={40} />
              <text x="300" y={(top + ym) / 2} fontSize="13" fill={blue}>k₁</text>
              <text x="300" y={(ym + yb) / 2} fontSize="13" fill={orange}>k₂</text>
            </g>
          );
        })()}
      </Diagram>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Slider label="Độ cứng k₁" value={k1} min={20} max={200} step={10} unit="N/m" digits={0} onChange={setK1} />
        <Slider label="Độ cứng k₂" value={k2} min={20} max={200} step={10} unit="N/m" digits={0} onChange={setK2} />
        <Slider label="Lực kéo F" value={F} min={0} max={12} step={0.5} unit="N" digits={1} onChange={setF} />
      </div>
      <Readout items={[
        ['k tương đương', `${number(kt, 1)} N/m`],
        ['ΔL của hệ', `${number(dL * 100, 1)} cm`],
        ['Lò xo 1: F₁, ΔL₁', `${number(F1, 1)} N · ${number(d1 * 100, 1)} cm`],
        ['Lò xo 2: F₂, ΔL₂', `${number(F2, 1)} N · ${number(d2 * 100, 1)} cm`],
      ]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Hình 14.4 — Kéo lực kế ở hai đầu                                     */
/* ------------------------------------------------------------------ */

function Scale({ y }: { y: number }) {
  return (
    <g>
      <rect x="200" y={y - 14} width="160" height="28" rx="8" fill="#e0f2fe" stroke={blue} strokeWidth="2" />
      <path d={`M 210 ${y} ` + Array.from({ length: 10 }, (_, i) => `L ${214 + i * 13} ${y + (i % 2 ? -7 : 7)}`).join(' ') + ` L 350 ${y}`} fill="none" stroke={blue} strokeWidth="1.5" />
      <text x="280" y={y - 20} textAnchor="middle" fontSize="13" fontWeight="700" fill={green}>chỉ 10 N</text>
    </g>
  );
}

export function SpringScaleParadox() {
  return (
    <Figure id="14.4" title="Hình 14.4 · Kéo hai đầu lực kế bằng hai lực 10 N"
      caption="Ở hình trên, tường giữ một đầu lực kế bằng lực 10 N (theo định luật III Newton). Ở hình dưới, người bên trái đóng đúng vai trò của bức tường. Trong cả hai trường hợp, lò xo chịu kéo 10 N ở mỗi đầu nên lực kế chỉ 10 N, không phải 0 N hay 20 N.">
      <Diagram label="Hai trường hợp: lực kế móc vào tường và lực kế bị hai người kéo." height={230}>
        <rect x="150" y="30" width="14" height="70" fill="#94a3b8" />
        <line x1="164" y1="65" x2="200" y2="65" stroke="#475569" strokeWidth="2" />
        <Arrow x={196} y={80} dx={-30} color={slate} label="10 N (tường)" offset={18} />
        <Scale y={65} />
        <line x1="360" y1="65" x2="380" y2="65" stroke="#475569" strokeWidth="2" />
        <Arrow x={380} y={65} dx={70} color={orange} label="10 N" offset={-8} />
        <line x1="20" y1="125" x2="540" y2="125" stroke="#e2e8f0" />
        <line x1="180" y1="175" x2="200" y2="175" stroke="#475569" strokeWidth="2" />
        <Arrow x={180} y={175} dx={-70} color={orange} label="10 N" offset={-8} />
        <Scale y={175} />
        <line x1="360" y1="175" x2="380" y2="175" stroke="#475569" strokeWidth="2" />
        <Arrow x={380} y={175} dx={70} color={orange} label="10 N" offset={-8} />
      </Diagram>
    </Figure>
  );
}
