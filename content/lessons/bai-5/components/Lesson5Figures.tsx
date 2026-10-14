'use client';

import { useId, useState } from 'react';
import { Angle, Arrow, Diagram, Figure, orange, green, slate, rad, number } from './Lesson5Diagram';

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const id = useId();
  return <div className="min-w-0">
    <label htmlFor={id} className="flex justify-between gap-2 text-xs font-semibold text-slate-600"><span>{label}</span><span className="tabular-nums text-slate-900">{number(value)}</span></label>
    <input id={id} aria-label={label} type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))} className="block h-6 w-full accent-blue-600" />
  </div>;
}

function Tug({ x, y, name, color }: { x: number; y: number; name: string; color: string }) {
  return <g transform={`translate(${x} ${y})`} data-vessel="tug">
    <path d="M -25 -12 H -6 M -28 0 H -8 M -25 12 H -6" stroke="#bae6fd" strokeWidth="2" />
    <path d="M 0 -17 H 59 Q 79 -13 88 0 Q 79 13 59 17 H 0 Z" fill={color} stroke="#334155" strokeWidth="2" />
    <path d="M 8 -12 H 56 Q 70 -8 77 0 Q 70 8 56 12 H 8 Z" fill="#f8fafc" />
    <rect x="38" y="-10" width="20" height="20" rx="3" fill="#cbd5e1" />
    <path d="M 53 -7 H 57 V 7 H 53 Z" fill="#0c4a6e" />
    <rect x="20" y="-6" width="10" height="12" rx="2" fill="#64748b" />
    <circle cx="4" cy="0" r="3" fill="#0f172a" />
    <text x="44" y={y < 130 ? -29 : 40} textAnchor="middle" fill="#334155" fontSize="17">{name}</text>
  </g>;
}

export function TowingForces() {
  const angle = Math.atan2(65, 203) * 180 / Math.PI;
  return <Figure id="5.1a" title="Hình 5.1a · Nhìn từ trên xuống: hai tàu kéo xà lan" caption="Dây nối mũi xà lan với móc kéo ở đuôi mỗi tàu; cả hai tàu hướng về phía trước. Khi lực kéo bằng nhau, hợp lực theo phân giác. Hình này mô tả bố trí, không biểu diễn độ lớn lực.">
    <Diagram label="Xà lan chở cát phía sau hai tàu kéo, dây nối đúng mũi xà lan và đuôi tàu">
      <rect x="16" y="16" width="528" height="228" rx="12" fill="#f0f9ff" />
      <path d="M 30 72 h 85 M 220 40 h 50 M 40 210 h 125 M 470 135 h 52" stroke="#d3edf8" strokeWidth="2" />
      <path d="M 38 98 H 157 L 185 112 V 148 L 157 162 H 38 Z" fill="#475569" stroke="#334155" strokeWidth="2" data-vessel="barge" />
      <path d="M 49 106 H 153 L 169 115 V 145 L 153 154 H 49 Z" fill="#cbd5e1" />
      <rect x="57" y="112" width="93" height="36" rx="4" fill="#d6b278" />
      <path d="M 62 139 Q 88 105 116 137 Q 135 117 146 140 Z" fill="#edcc91" />
      <path d="M 60 109 V 151 M 151 109 V 151" stroke="#64748b" strokeWidth="2" />
      <text x="107" y="185" textAnchor="middle" fill="#334155">Xà lan chở cát</text>
      <path d="M 185 130 L 388 65 M 185 130 L 388 195" fill="none" stroke="#64748b" strokeWidth="2" />
      <path d="M 185 130 H 375" stroke={green} strokeDasharray="5 4" />
      <Angle x={185} y={130} radius={58} from={-angle} to={0} label="θ" />
      <Angle x={185} y={130} radius={58} from={0} to={angle} label="θ" />
      <circle cx="185" cy="130" r="4" fill="#0f172a" /><text x="177" y="155" fontSize="16">O</text>
      <Tug x={388} y={65} color="#2563eb" name="Tàu kéo 1" />
      <Tug x={388} y={195} color="#c2410c" name="Tàu kéo 2" />
      <Arrow x={397} y={130} dx={85} dy={0} label="Hướng kéo" color={green} width={2} />
    </Diagram>
  </Figure>;
}

export function BridgeForces() {
  return <Figure id="5.1b" title="Hình 5.1b · Cầu dây văng: cáp truyền tải lên trụ tháp" caption="Sơ đồ cấu tạo, không sao chép hình dáng một cây cầu cụ thể. Cáp neo ở nhiều điểm trên dầm; lực căng tại mỗi điểm neo hướng dọc cáp về trụ tháp. Mô hình ba lực ở phần vận dụng là một phép lý tưởng hóa riêng.">
    <Diagram label="Cầu dây văng gồm trụ tháp, nhiều dây xiên neo vào dầm cầu và móng trụ" height={235}>
      <path d="M 20 207 Q 50 197 80 207 T 140 207 T 200 207 T 260 207 T 320 207 T 380 207 T 440 207 T 500 207 T 540 207 V 230 H 20 Z" fill="#e0f2fe" />
      <path d="M 250 221 V 39 H 269 V 221 M 291 221 V 39 H 310 V 221" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
      <rect x="258" y="39" width="44" height="16" fill="#94a3b8" />
      {[60,105,150,195,365,410,455,500].map(x => <line key={x} x1={280} y1={45} x2={x} y2={165} stroke="#94a3b8" strokeWidth="2" />)}
      <rect x="32" y="165" width="496" height="12" rx="2" fill="#64748b" />
      <path d="M 32 157 H 528" stroke="#cbd5e1" strokeWidth="3" />
      <text x="280" y="27" textAnchor="middle" fill="#334155">Trụ tháp</text>
      <text x="85" y="88" fill="#334155">Cáp văng</text><path d="M 130 94 L 175 115" stroke={slate} />
      <text x="417" y="198" fill="#334155">Dầm cầu</text>
      <Arrow x={500} y={165} dx={-62} dy={-62 * 120 / 220} label="T" color={orange} />
      <circle cx="500" cy="165" r="4" fill={orange} />
    </Diagram>
  </Figure>;
}

export function ForceAddition() {
  const [f1, setF1] = useState(30), [f2, setF2] = useState(40), [angle, setAngle] = useState(90);
  const bx = f2 * Math.cos(rad(angle)), by = -f2 * Math.sin(rad(angle));
  const minX = Math.min(0, bx), maxX = Math.max(f1, f1 + bx);
  const scale = Math.min(4, 340 / (maxX - minX), 125 / Math.max(1, -by));
  const x = 280 - (minX + maxX) * scale / 2, y = 145 - by * scale / 2;
  const ax = f1 * scale, bdx = bx * scale, bdy = by * scale;
  const resultant = Math.hypot(f1 + bx, by);
  return <Figure id="5.2" title="Hình 5.2 · Dựng hợp lực bằng hình bình hành" caption="Xanh lam: F₁ · Cam: F₂ · Xanh lục: hợp lực. Các vectơ cùng tỉ lệ trong mỗi khung; khung tự căn theo các lực. Ở 0° và 180°, hình bình hành suy biến thành đoạn thẳng.">
    <Diagram label="Hai cạnh kề và đường chéo hợp lực, có cung góc giữa hai lực">
      <path d={`M ${x} ${y} h ${ax} l ${bdx} ${bdy} h ${-ax} Z`} fill="#ecfdf5" fillOpacity="0.7" />
      <path d={`M ${x + ax} ${y} l ${bdx} ${bdy} h ${-ax}`} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" fill="none" />
      <Angle x={x} y={y} radius={22} from={0} to={-angle} label="α" />
      <Arrow x={x} y={y} dx={ax} dy={0} label="F₁" offset={25} />
      <Arrow x={x} y={y} dx={bdx} dy={bdy} label="F₂" color={orange} dashed={angle === 0 || angle === 180} offset={-12} />
      <Arrow x={x} y={y} dx={ax + bdx} dy={bdy} label="Fth" color={green} offset={-33} width={3} />
      <circle cx={x} cy={y} r="4" fill="#334155" /><text x={x - 14} y={y + 23}>O</text>
    </Diagram>
    <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
      <Slider label="F₁ (N)" value={f1} min={10} max={100} onChange={setF1} />
      <Slider label="F₂ (N)" value={f2} min={10} max={100} onChange={setF2} />
      <Slider label="Góc α (°)" value={angle} min={0} max={180} onChange={setAngle} />
    </div>
    <output className="mt-2 block rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">F = {number(resultant)} N · {Math.abs(f1 - f2)} ≤ F ≤ {f1 + f2} N{resultant < 1e-8 ? ' · Hợp lực bằng 0, không có hướng xác định.' : ''}</output>
  </Figure>;
}

export function InclineForces() {
  const [angle, setAngle] = useState(15);
  const s = Math.sin(rad(angle)), c = Math.cos(rad(angle)), p = 100;
  const x = 265, y = 108, dx = p * s * c, dy = p * s * s;
  return <Figure id="5.3" title="Hình 5.3 · Tách trọng lực của ô tô trên dốc" caption="Chỉ phân tích trọng lực, chưa vẽ phản lực và ma sát. P∥ dọc dốc; P⊥ hướng vào mặt dốc. Ox xuống dốc, Oy ra ngoài dốc. Mô hình xe 2 600 kg, g = 9,8 m/s²; các vectơ lực cùng tỉ lệ.">
    <Diagram label="Ô tô có bánh tiếp xúc mặt dốc; trọng lực thẳng đứng và hai thành phần vuông góc">
      <g transform={`translate(${x} ${y}) rotate(${angle})`} data-car-angle={angle}>
        <path d="M -115 16 H 135 V 95 H -115 Z" fill="#f1f5f9" />
        <path d="M -115 16 H 135" stroke="#64748b" strokeWidth="3" />
        <path d="M -43 -9 L -29 -15 L -18 -31 H 17 L 33 -16 L 44 -10 V 4 H -43 Z" fill="#93c5fd" stroke="#1e40af" strokeWidth="2" />
        <path d="M -22 -16 L -13 -27 H 0 V -16 Z M 5 -27 H 15 L 25 -16 H 5 Z" fill="#eff6ff" />
        <circle cx="-27" cy="7" r="9" fill="#334155" /><circle cx="28" cy="7" r="9" fill="#334155" />
        <circle cx="-27" cy="7" r="4" fill="#cbd5e1" /><circle cx="28" cy="7" r="4" fill="#cbd5e1" />
      </g>
      <path d={`M ${x - 16 * s} ${y + 16 * c} h 112`} stroke="#94a3b8" strokeDasharray="4 4" />
      <Angle x={x - 16 * s} y={y + 16 * c} radius={70} from={0} to={angle} label="α" />
      <Arrow x={x} y={y} dx={155 * c} dy={155 * s} label="x" color={slate} width={1.5} />
      <Arrow x={x} y={y} dx={85 * s} dy={-85 * c} label="y" color={slate} width={1.5} offset={-7} />
      <path d={`M ${x + dx} ${y + dy} L ${x} ${y + p} L ${x - dx} ${y + p - dy}`} stroke="#94a3b8" strokeDasharray="4 4" fill="none" />
      <Arrow x={x} y={y} dx={dx} dy={dy} label="P∥" offset={27} labelDx={16} />
      <Arrow x={x} y={y} dx={-dx} dy={p - dy} label="P⊥" color={orange} labelDx={-17} offset={12} />
      <Arrow x={x} y={y} dx={0} dy={p} label="P" color={green} offset={26} />
      <circle cx={x} cy={y} r="4" fill="#334155" /><text x={x - 15} y={y - 8} fontSize="16">O</text>
    </Diagram>
    <Slider label="Góc dốc α (°)" value={angle} min={0} max={60} onChange={setAngle} />
    <output className="mt-2 block rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">P∥ = {number(25480 * s)} N · P⊥ = {number(25480 * c)} N · Py = {number(-25480 * c)} N</output>
  </Figure>;
}

export { ForceExperiment } from './ForceExperiment';

export function CableTension() {
  const [angle, setAngle] = useState(30);
  const s = Math.sin(rad(angle)), c = Math.cos(rad(angle));
  const x = 280, y = 36 + 130 * s, tension = 10 / s;
  return <Figure id="5.5" title="Hình 5.5 · Kéo dây ngang hơn: lực căng tăng thế nào?" caption="Dây nhẹ dài 2 m, vật 2 kg, g = 10 m/s². Hai đầu luôn cùng cao và dịch ra xa nhau khi góc giảm; chiều dài dây không đổi. Các lực cùng tỉ lệ trong mỗi khung. θ = 0° không cân bằng được với lực căng hữu hạn.">
    <Diagram label="Dây dài không đổi treo vật ở giữa; hai đầu tách xa làm giảm độ võng và tăng lực căng">
      <path d={`M ${x - 130 * c} 36 L ${x} ${y} L ${x + 130 * c} 36`} stroke={slate} strokeWidth="3" fill="none" data-cable-angle={angle} />
      <path d={`M ${x - 145} ${y} H ${x + 145}`} stroke="#cbd5e1" strokeDasharray="4 4" />
      <circle cx={x - 130 * c} cy="36" r="5" fill="#334155" /><circle cx={x + 130 * c} cy="36" r="5" fill="#334155" />
      <text x={x - 130 * c} y="21" textAnchor="middle" fontSize="16">A</text><text x={x + 130 * c} y="21" textAnchor="middle" fontSize="16">B</text>
      <circle cx={x} cy={y} r="9" fill="#cbd5e1" stroke="#64748b" />
      <Angle x={x} y={y} radius={28} from={0} to={-angle} label="θ" />
      <Arrow x={x} y={y} dx={-48 * c} dy={-48 * s} label="T₁" offset={-13} />
      <Arrow x={x} y={y} dx={48 * c} dy={-48 * s} label="T₂" color={orange} offset={-20} />
      <Arrow x={x} y={y} dx={0} dy={96 * s} label="P" color={green} offset={24} />
      <text x="95" y="237" fontSize="16" fill={slate}>Độ võng: {number(s)} m</text><text x="350" y="237" fontSize="16" fill={slate}>AB = {number(2*c)} m</text>
    </Diagram>
    <Slider label="Góc dây θ (°)" value={angle} min={1} max={60} onChange={setAngle} />
    <output className="mt-2 block rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">T = {number(tension)} N mỗi dây · 2T sin θ = 20 N</output>
  </Figure>;
}
