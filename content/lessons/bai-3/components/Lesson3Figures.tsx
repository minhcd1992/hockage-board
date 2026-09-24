'use client';

import { useId, useState, type ReactNode } from 'react';

const blue = '#2563eb';
const orange = '#c2410c';
const teal = '#0f766e';
const format = (value: number) => Number(value.toFixed(1)).toLocaleString('vi-VN');

function Figure({ title, children, caption }: { title: string; children: ReactNode; caption: string }) {
  return (
    <figure className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-5" data-figure={title}>
      <div className="mb-3 font-bold text-slate-800">{title}</div>
      {children}
      <figcaption className="mt-3 text-sm leading-relaxed text-slate-600">{caption}</figcaption>
    </figure>
  );
}

function Arrow({ x, y, end, color, label }: { x: number; y: number; end: number; color: string; label: string }) {
  const direction = end >= x ? 1 : -1;
  return (
    <g fill={color} stroke={color}>
      <line x1={x} y1={y} x2={end} y2={y} strokeWidth="4" />
      <path d={'M ' + (end - 9 * direction) + ' ' + (y - 6) + ' L ' + end + ' ' + y + ' L ' + (end - 9 * direction) + ' ' + (y + 6)} fill="none" strokeWidth="3" />
      <text x={(x + end) / 2} y={y - 12} textAnchor="middle" stroke="none" fontSize="14">{label}</text>
    </g>
  );
}

export function MotionScenarios() {
  return (
    <Figure title="A1. Vận tốc không đổi và vận tốc thay đổi" caption="Các mũi tên biểu diễn vận tốc tại những thời điểm liên tiếp; độ dài thể hiện độ lớn vận tốc.">
      <svg viewBox="0 0 430 260" role="img" aria-label="Chuyển động đều có các mũi tên vận tốc bằng nhau; xe tăng tốc có các mũi tên dài dần." className="w-full">
        <rect x="1" y="1" width="428" height="112" rx="12" fill="#dbeafe" />
        <text x="18" y="28" fill="#1e40af" fontSize="16" fontWeight="bold">Chạy thẳng đều · 60 km/h</text>
        {[40, 170, 300].map(x => <Arrow key={x} x={x} y={75} end={x + 65} color={blue} label="v" />)}
        <text x="18" y="100" fill="#1e40af" fontSize="14">Vận tốc không đổi → a = 0</text>
        <rect x="1" y="129" width="428" height="128" rx="12" fill="#ffedd5" />
        <text x="18" y="157" fill="#9a3412" fontSize="16" fontWeight="bold">F1 xuất phát · 0 → 100 km/h trong 2,6 s</text>
        {[{ x: 40, length: 28, label: 'v₁' }, { x: 150, length: 58, label: 'v₂' }, { x: 280, length: 110, label: 'v₃' }].map(({ x, length, label }) => (
          <Arrow key={x} x={x} y={208} end={x + length} color={orange} label={label} />
        ))}
        <text x="18" y="241" fill="#9a3412" fontSize="14">Vận tốc thay đổi → có gia tốc</text>
      </svg>
    </Figure>
  );
}

export function AccelerationVectors() {
  return (
    <Figure title="B1. Gia tốc cùng hướng với độ biến thiên vận tốc" caption="Xét cùng khoảng Δt > 0 và chiều dương sang phải. Cả hai trường hợp đều có v > 0, nhưng gia tốc mang dấu khác nhau.">
      <div className="grid gap-4 md:grid-cols-2">
        {[true, false].map(speeding => (
          <svg key={String(speeding)} viewBox="0 0 330 230" role="img" aria-label={speeding ? 'Nhanh dần: v1 bằng 4, v2 bằng 8 m/s; delta v dương.' : 'Chậm dần: v1 bằng 4, v2 bằng 2 m/s; delta v âm.'} className="w-full rounded-lg bg-white">
            <text x="18" y="28" fill="#334155" fontSize="16" fontWeight="bold">{speeding ? 'Nhanh dần: a > 0' : 'Chậm dần: a < 0'}</text>
            <Arrow x={90} y={78} end={170} color={blue} label="v₁ = 4 m/s" />
            <Arrow x={90} y={135} end={speeding ? 250 : 130} color={blue} label={speeding ? 'v₂ = 8 m/s' : 'v₂ = 2 m/s'} />
            <Arrow x={90} y={192} end={speeding ? 170 : 50} color={orange} label={speeding ? 'Δv = +4 m/s' : 'Δv = −2 m/s'} />
            <text x="230" y="213" fill="#64748b" fontSize="13">Ox →</text>
          </svg>
        ))}
      </div>
    </Figure>
  );
}

export function VelocityArea() {
  return (
    <Figure title="B2. Độ dịch chuyển từ diện tích đồ thị v–t" caption="Ví dụ v₀ > 0, a > 0: diện tích xanh là v₀t, diện tích cam là ½at². Tổng hai diện tích bằng độ dịch chuyển d.">
      <svg viewBox="0 0 550 295" role="img" aria-label="Hình thang dưới đường vận tốc gồm hình chữ nhật v0 nhân t và tam giác một phần hai a t bình phương." className="mx-auto w-full max-w-2xl">
        <rect x="65" y="161" width="350" height="80" fill="#bfdbfe" />
        <path d="M 65 161 L 415 51 L 415 161 Z" fill="#fed7aa" />
        <path d="M 65 25 V 241 H 485" stroke="#475569" strokeWidth="2" fill="none" />
        <line x1="65" y1="161" x2="415" y2="51" stroke={blue} strokeWidth="4" />
        <path d="M 65 161 H 415 V 241 M 415 51 H 65" stroke="#94a3b8" strokeDasharray="5 5" fill="none" />
        <text x="12" y="26" fill="#334155" fontSize="16">v</text>
        <text x="491" y="246" fill="#334155" fontSize="16">t</text>
        <text x="46" y="263" fill="#334155" fontSize="16">0</text>
        <text x="34" y="165" fill="#334155" fontSize="16">v₀</text>
        <text x="34" y="56" fill="#334155" fontSize="16">v</text>
        <text x="411" y="266" fill="#334155" fontSize="16">t</text>
        <text x="215" y="207" fill="#1e40af" fontSize="23">v₀t</text>
        <text x="293" y="136" fill="#9a3412" fontSize="23">½at²</text>
        <text x="275" y="41" fill="#1e40af" fontSize="16">v = v₀ + at</text>
        <text x="427" y="109" fill="#9a3412" fontSize="16">at</text>
      </svg>
    </Figure>
  );
}

type Series = { label: string; color: string; at: (t: number) => number };

export function ExerciseMotionGraph({ title, points, acceleration = false }: {
  title: string;
  points: [number, number][];
  acceleration?: boolean;
}) {
  const end = points[points.length - 1][0];
  const min = Math.min(0, ...points.map(point => point[1]));
  const max = Math.max(1, ...points.map(point => point[1]));
  const px = (t: number) => 55 + 450 * t / end;
  const py = (value: number) => 200 - 160 * (value - min) / (max - min);
  const times = [...new Set(points.map(point => point[0]))];
  const values = [...new Set([0, ...points.map(point => point[1])])];
  const segments = acceleration
    ? points.slice(0, -1).filter((point, i) => point[0] !== points[i + 1][0]).map((point, i) => {
      const next = points.find(p => p[0] > point[0])!;
      return <line key={i} x1={px(point[0])} x2={px(next[0])} y1={py(point[1])} y2={py(point[1])} stroke={orange} strokeWidth="3" />;
    })
    : <polyline points={points.map(([t, v]) => px(t) + ',' + py(v)).join(' ')} fill="none" stroke={blue} strokeWidth="3" />;
  return (
    <Figure title={title} caption={acceleration
      ? 'Gia tốc không đổi trên từng khoảng mở; tại các mốc chuyển giai đoạn, mô hình lý tưởng có bước nhảy.'
      : 'Nối các mốc theo thứ tự thời gian. Độ dốc cho gia tốc, diện tích có dấu dưới đồ thị cho độ dịch chuyển.'}>
      <svg viewBox="0 0 560 250" className="w-full" role="img" aria-label={title}>
        {times.map(t => <g key={t}>
          <line x1={px(t)} x2={px(t)} y1="40" y2="200" stroke="#e2e8f0" strokeDasharray="4 4" />
          <text x={px(t)} y="223" textAnchor="middle" fontSize="14" fill="#475569">{format(t)}</text>
        </g>)}
        {values.map(value => <g key={value}>
          <line x1="55" x2="505" y1={py(value)} y2={py(value)} stroke="#e2e8f0" />
          <text x="45" y={py(value) + 5} textAnchor="end" fontSize="14" fill="#475569">{format(value)}</text>
        </g>)}
        <path d={'M 55 25 V 200 M 55 ' + py(0) + ' H 520'} fill="none" stroke="#64748b" strokeWidth="1.5" />
        <text x="16" y="20" fill="#475569" fontSize="15">{acceleration ? 'a (m/s²)' : 'v (m/s)'}</text>
        <text x="515" y="223" fill="#475569" fontSize="15">t (s)</text>
        {segments}
      </svg>
    </Figure>
  );
}

function Plot({ title, unit, series, time }: { title: string; unit: string; series: Series[]; time: number }) {
  const samples = Array.from({ length: 81 }, (_, i) => i / 8);
  const values = series.flatMap(item => samples.map(item.at));
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const padding = Math.max(1, (high - low) * 0.14);
  const min = low - padding;
  const max = high + padding;
  const px = (t: number) => 60 + t * 27;
  const py = (value: number) => 192 - (value - min) / (max - min) * 151;
  const zero = py(0);
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-2">
      <div className="text-center text-sm font-semibold text-slate-700">{title}</div>
      <svg viewBox="0 0 385 244" role="img" aria-label={title + ', trục đứng ' + unit + ', trục ngang thời gian từ 0 đến 10 giây'} className="w-full">
        {[low, (low + high) / 2, high].filter((value, index, all) => all.indexOf(value) === index).map(value => (
          <g key={value}>
            <line x1="60" x2="330" y1={py(value)} y2={py(value)} stroke="#e2e8f0" />
            <text x="52" y={py(value) + 4} textAnchor="end" fill="#64748b" fontSize="12">{format(value)}</text>
          </g>
        ))}
        <path d={'M 60 28 V 198 M 60 ' + zero + ' H 342'} fill="none" stroke="#64748b" strokeWidth="1.5" />
        {[0, 5, 10].map(t => (
          <g key={t}>
            <line x1={px(t)} x2={px(t)} y1={zero - 3} y2={zero + 3} stroke="#64748b" />
            <text x={px(t)} y="216" textAnchor="middle" fill="#475569" fontSize="13">{t}</text>
          </g>
        ))}
        <text x="15" y="21" fill="#475569" fontSize="13">{unit}</text>
        <text x="337" y="216" fill="#475569" fontSize="13">t (s)</text>
        <line x1={px(time)} x2={px(time)} y1="35" y2="198" stroke="#94a3b8" strokeDasharray="4 4" />
        {series.map(item => (
          <g key={item.label}>
            <path d={samples.map((t, i) => (i ? 'L ' : 'M ') + px(t) + ' ' + py(item.at(t))).join(' ')} stroke={item.color} strokeWidth="3" fill="none" />
            <circle cx={px(time)} cy={py(item.at(time))} r="4" fill={item.color} />
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 text-xs">
        {series.map(item => <span key={item.label} style={{ color: item.color }}>{item.label}: {format(item.at(time))} {unit}</span>)}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}: {format(value)}</label>
      <input id={id} aria-label={label} type="range" min={min} max={max} step={step} value={value}
        onChange={event => onChange(Number(event.target.value))} className="mt-2 w-full accent-blue-600" />
    </div>
  );
}

export function MotionGraphs({ accelerated }: { accelerated: boolean }) {
  const [v0, setV0] = useState(accelerated ? 2 : 4);
  const [acceleration, setAcceleration] = useState(2);
  const [x0, setX0] = useState(5);
  const [time, setTime] = useState(5);
  const a = accelerated ? acceleration : 0;
  const v = (t: number) => v0 + a * t;
  const d = (t: number) => v0 * t + a * t * t / 2;
  const motion = a === 0 ? (v0 === 0 ? 'Đứng yên' : 'Chuyển động thẳng đều')
    : v(time) === 0 ? 'Vận tốc bằng 0 tại thời điểm này; gia tốc khác 0'
      : a * v(time) > 0 ? 'Nhanh dần đều tại thời điểm đang xét' : 'Chậm dần đều tại thời điểm đang xét';
  return (
    <Figure title={accelerated ? 'B4. Khám phá chuyển động có gia tốc không đổi' : 'B3. Bốn đồ thị chuyển động thẳng đều'}
      caption="Kéo thanh trượt để thay đổi tham số. Đường nét đứt đánh dấu thời điểm đang xét. Mỗi đồ thị có thang đo riêng; đọc giá trị và đơn vị trên trục.">
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Slider label="Vận tốc ban đầu v₀ (m/s)" value={v0} min={-10} max={10} onChange={setV0} />
        {accelerated && <Slider label="Gia tốc a (m/s²)" value={a} min={-3} max={3} step={0.5} onChange={setAcceleration} />}
        <Slider label="Tọa độ ban đầu x₀ (m)" value={x0} min={-20} max={20} onChange={setX0} />
        <Slider label="Thời điểm t (s)" value={time} min={0} max={10} step={0.5} onChange={setTime} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Plot title="Gia tốc – thời gian (a–t)" unit="m/s²" series={[{ label: 'a', color: orange, at: () => a }]} time={time} />
        <Plot title="Vận tốc – thời gian (v–t)" unit="m/s" series={[{ label: 'v', color: blue, at: v }]} time={time} />
        <Plot title="Độ dịch chuyển – thời gian (d–t)" unit="m" series={[{ label: 'd', color: teal, at: d }]} time={time} />
        <Plot title="Tọa độ – thời gian (x–t)" unit="m" series={[{ label: 'x', color: '#7c3aed', at: t => x0 + d(t) }]} time={time} />
      </div>
      <output className="mt-4 block rounded-lg bg-blue-100 p-3 text-sm text-blue-900">
        t = {format(time)} s · v = {format(v(time))} m/s · d = {format(d(time))} m · x = {format(x0 + d(time))} m. {motion}.
      </output>
    </Figure>
  );
}

export function BrakingDiagram() {
  return (
    <Figure title="D1. Hai giai đoạn trước khi dừng" caption="Sơ đồ theo tỉ lệ quãng đường. Xe cần 52 m để dừng nếu không có vật cản, nhưng vật cản nằm ở mốc 40 m.">
      <svg viewBox="0 0 570 245" role="img" aria-label="Xe phản ứng trong 12 mét, cần thêm 40 mét để phanh; vật cản ở 40 mét, trước điểm dừng dự kiến 52 mét." className="w-full">
        <path d="M 50 120 H 535" stroke="#64748b" strokeWidth="2" />
        <rect x="50" y="81" width="96" height="24" rx="4" fill={blue} />
        <rect x="146" y="81" width="320" height="24" rx="4" fill="#fdba74" />
        <text x="98" y="44" textAnchor="middle" fontSize="16" fill={blue}>Phản ứng</text>
        <text x="98" y="65" textAnchor="middle" fontSize="14" fill={blue}>0,6 s · 12 m</text>
        <text x="306" y="44" textAnchor="middle" fontSize="16" fill={orange}>Hãm phanh</text>
        <text x="306" y="65" textAnchor="middle" fontSize="14" fill={orange}>a = −5 m/s² · cần 40 m</text>
        {[0, 12, 40, 52].map(x => (
          <g key={x}>
            <line x1={50 + 8 * x} x2={50 + 8 * x} y1="111" y2="130" stroke="#475569" />
            <text x={50 + 8 * x} y="150" textAnchor="middle" fontSize="15" fill="#334155">{x} m</text>
          </g>
        ))}
        <line x1="370" x2="370" y1="74" y2="133" stroke="#dc2626" strokeWidth="4" />
        <line x1="466" x2="466" y1="75" y2="130" stroke={teal} strokeDasharray="4 4" strokeWidth="2" />
        <text x="370" y="180" textAnchor="middle" fontSize="15" fill="#b91c1c">Vật cản</text>
        <text x="466" y="204" textAnchor="middle" fontSize="14" fill={teal}>Dừng dự kiến</text>
        <text x="146" y="180" textAnchor="middle" fontSize="14" fill="#475569">Bắt đầu phanh</text>
        <text x="521" y="143" fontSize="14" fill="#475569">x →</text>
      </svg>
    </Figure>
  );
}

export function ChaseDiagram() {
  const [time, setTime] = useState(5);
  return (
    <Figure title="D2. Cùng vận tốc và gặp nhau là hai thời điểm khác nhau" caption="Đường xanh: xe (1), v₁ = 2t và d₁ = t². Đường cam: xe (2), v₂ = 10 và d₂ = 10t.">
      <Slider label="Thời gian hai xe chuyển động (s)" value={time} min={0} max={10} step={0.5} onChange={setTime} />
      <div className="my-3 grid gap-3 sm:grid-cols-2">
        <Plot title="Vận tốc hai xe (v–t)" unit="m/s" time={time} series={[
          { label: 'Xe 1', color: blue, at: t => 2 * t },
          { label: 'Xe 2', color: orange, at: () => 10 },
        ]} />
        <Plot title="Độ dịch chuyển hai xe (d–t)" unit="m" time={time} series={[
          { label: 'Xe 1', color: blue, at: t => t * t },
          { label: 'Xe 2', color: orange, at: t => 10 * t },
        ]} />
      </div>
      <output className="block rounded-lg bg-blue-100 p-3 text-sm text-blue-900">
        t = {format(time)} s · Khoảng cách = {format(10 * time - time * time)} m.
        {time === 5 ? ' Cùng vận tốc 10 m/s; khoảng cách đạt cực đại 25 m.' : time === 10 ? ' Hai xe gặp lại tại vị trí 100 m.' : time === 0 ? ' Hai xe cùng vị trí xuất phát.' : ' So sánh vận tốc và vị trí trên hai đồ thị.'}
      </output>
    </Figure>
  );
}
