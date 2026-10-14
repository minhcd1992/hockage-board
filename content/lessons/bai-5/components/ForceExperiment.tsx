'use client';

import { useId, useState } from 'react';
import { Math as Formula } from '@/components/lesson/Math';
import { Angle, Arrow, Diagram, Figure, blue, orange, green, slate, rad, number } from './Lesson5Diagram';

const anchorX = 45, centerY = 130, naturalLength = 110, extensionPerNewton = 18;
const steps = ['Bố trí', 'Hai lực', 'Thay thế', 'Đối chiếu'];
const descriptions = [
  'Hiệu chỉnh lực kế về 0. Chốt C cố định; vòng R tự do, nối với C bằng dây đàn hồi. O là dấu mốc trên bảng, không phải chốt giữ vòng.',
  'Tăng đồng thời hai lực để vòng R đến O. Khi vòng trùng mốc, đọc F₁, F₂ và góc α rồi ghi lại trước khi thay dụng cụ.',
  'Giữ nguyên C và dây đàn hồi. Thay hai lực kế bằng một lực kế; chỉnh hướng và lực kéo để đưa vòng R trở lại O trong độ phân giải của mô phỏng.',
  'Vòng trở lại O nghĩa là dây đàn hồi có cùng hướng và gần như cùng độ giãn. Đối chiếu lực thay thế đã ghi với đường chéo hình bình hành.',
];
const buttonClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40';

function Control({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  const id = useId();
  return <div>
    <label htmlFor={id} className="flex justify-between gap-2 text-xs font-semibold text-slate-700"><span>{label}</span><span className="tabular-nums">{number(value)}</span></label>
    <input id={id} aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="block h-7 w-full accent-blue-600" />
  </div>;
}

function Gauge({ x, y, angle, label, value, color }: { x: number; y: number; angle: number; label: string; value: number; color: string }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`} data-apparatus={label} data-reading={value}>
    <path d="M 0 0 H 9 M 69 0 H 80" stroke={slate} strokeWidth="2" />
    <rect x="9" y="-11" width="60" height="22" rx="4" fill="#f8fafc" stroke={color} strokeWidth="1.5" />
    <path d="M 14 0 h 4 l 3 -4 l 4 8 l 4 -8 l 4 8 l 4 -4 H 63" fill="none" stroke={slate} strokeWidth="1.2" />
    <path d={`M ${17 + value * 5.5} -8 V 8`} stroke={color} strokeWidth="2" />
    <text x="39" y="-19" textAnchor="middle" fill={color} fontSize="16">{label}</text>
  </g>;
}

function elasticPath(x: number, y: number) {
  const dx = x - anchorX, dy = y - centerY, length = Math.hypot(dx, dy);
  const ux = dx / length, uy = dy / length;
  const point = (distance: number, side = 0) => `${anchorX + distance * ux - side * uy} ${centerY + distance * uy + side * ux}`;
  let d = `M ${anchorX} ${centerY} L ${point(20)}`;
  for (let i = 0; i <= 12; i++) d += ` L ${point(20 + (length - 38) * i / 12, i === 0 || i === 12 ? 0 : i % 2 ? -5 : 5)}`;
  return d + ` L ${point(length - 8)}`;
}

export function ForceExperiment() {
  const [step, setStep] = useState(0);
  const [alpha, setAlpha] = useState(60);
  const [pull, setPull] = useState(0);
  const [force, setForce] = useState(4);
  const [direction, setDirection] = useState(10);
  const [record, setRecord] = useState<{ force: number; direction: number } | null>(null);
  const selectId = useId();
  const resultant = Math.sqrt(3 ** 2 + 4 ** 2 + 2 * 3 * 4 * Math.cos(rad(alpha)));
  // Orient the two forces so their vertical components cancel for unequal magnitudes.
  const theta1 = Math.atan2(4 * Math.sin(rad(alpha)), 3 + 4 * Math.cos(rad(alpha))) * 180 / Math.PI;
  const theta2 = alpha - theta1;
  const targetX = anchorX + naturalLength + extensionPerNewton * resultant;
  const applied = step === 0 ? 0 : step === 1 ? resultant * pull / 100 : (record?.force ?? force);
  const appliedDirection = step < 2 || applied === 0 ? 0 : (record?.direction ?? direction);
  // Quasi-static equilibrium: spring force is opposite the applied resultant.
  const length = naturalLength + extensionPerNewton * applied;
  const ringX = anchorX + length * Math.cos(rad(appliedDirection));
  const ringY = centerY - length * Math.sin(rad(appliedDirection));
  const displacement = Math.hypot(ringX - targetX, ringY - centerY);
  const aligned = displacement <= extensionPerNewton * 0.05 + 1e-7;
  const ready = step === 0 || (step === 1 && pull === 100) || (step === 2 && aligned);
  const deviation = record ? Math.abs(record.force - resultant) / resultant * 100 : 0;
  const reset = (newAlpha = alpha) => {
    setAlpha(newAlpha); setStep(0); setPull(0); setForce(4); setDirection(10); setRecord(null);
  };
  const next = () => {
    if (!ready) return;
    if (step === 1) { setForce(4); setDirection(10); setRecord(null); }
    if (step === 2) setRecord({ force, direction });
    setStep(step + 1);
  };
  const back = () => { if (step <= 1) reset(); else { setRecord(null); setStep(step - 1); } };
  const vectorScale = 20;
  const v1 = { x: 3 * Math.cos(rad(theta1)) * vectorScale, y: -3 * Math.sin(rad(theta1)) * vectorScale };
  const v2 = { x: 4 * Math.cos(rad(theta2)) * vectorScale, y: 4 * Math.sin(rad(theta2)) * vectorScale };

  return <Figure id="5.4" title="Thí nghiệm 5.4 · Tự tìm lực thay thế" caption="Mô phỏng các trạng thái cân bằng, không mô tả chuyển động theo thời gian. Vòng và dây nhẹ; bỏ qua ma sát. Số chỉ do bạn điều chỉnh, không phải số liệu đo thật. Thang lực thay thế có bước 0,1 N; ngưỡng trùng mốc tương ứng ±0,05 N khi kéo đúng hướng.">
    <div data-experiment-step={step + 1} data-aligned={aligned} data-target-force={resultant}>
      <ol className="!m-0 !grid !list-none grid-cols-4 gap-1 !p-0" aria-label="Các bước thí nghiệm">
        {steps.map((label, i) => <li key={label} aria-current={i === step ? 'step' : undefined} className={`!my-0 rounded-lg px-1 py-2 text-center text-xs ${i === step ? 'bg-blue-600 font-semibold text-white' : i < step ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-500'}`}><span className="block font-bold">{i + 1}</span>{label}</li>)}
      </ol>
      <p className="!my-3 text-sm text-slate-700"><strong>Bước {step + 1}.</strong> {descriptions[step]}</p>
      {step === 0 && <div className="flex flex-wrap items-center gap-2 text-xs">
        <label htmlFor={selectId} className="font-semibold">Góc giữa hai lực α</label>
        <select id={selectId} aria-label="Góc thí nghiệm" value={alpha} onChange={e => reset(Number(e.target.value))} className="rounded-md border border-slate-300 bg-white px-2 py-1.5">
          {[30,60,90].map(value => <option key={value} value={value}>{value}°</option>)}
        </select>
        <span className="text-slate-500">Chọn trước mỗi lượt đo.</span>
      </div>}
      <Diagram label={`Bước ${step + 1}: ${steps[step]}. ${aligned ? 'Vòng trùng mốc O.' : 'Vòng R chưa trùng mốc O.'}`}>
        <circle cx={targetX} cy={centerY} r="94" fill="#f8fafc" stroke="#e2e8f0" />
        {Array.from({ length: 24 }, (_, i) => <line key={i} x1={targetX + 88 * Math.cos(rad(i * 15))} y1={centerY + 88 * Math.sin(rad(i * 15))} x2={targetX + 94 * Math.cos(rad(i * 15))} y2={centerY + 94 * Math.sin(rad(i * 15))} stroke="#cbd5e1" />)}
        <path d={`M ${targetX - 105} ${centerY} H ${targetX + 158}`} stroke="#cbd5e1" strokeDasharray="4 4" />
        <text x={targetX + 102} y={centerY + 23} fill={slate} fontSize="15">0°</text>
        <circle cx={targetX} cy={centerY} r="10" fill="none" stroke={green} strokeWidth="2" strokeDasharray="3 2" data-target="O" />
        <path d={`M ${targetX - 4} ${centerY} h 8 M ${targetX} ${centerY - 4} v 8`} stroke={green} />
        <text x={targetX} y={centerY + 39} textAnchor="middle" fill={green} fontSize="16">Mốc O</text>
        <path d={elasticPath(ringX, ringY)} fill="none" stroke={slate} strokeWidth="2" data-elastic="spring" />
        <circle cx={anchorX} cy={centerY} r="6" fill="#334155" /><text x={anchorX} y={centerY - 17} textAnchor="middle">C</text>
        <text x="82" y="211" fill={slate} fontSize="16">Dây đàn hồi</text>
        {step === 0 && <>
          <Gauge x={340} y={52} angle={0} label="LK₁" value={0} color={blue} />
          <Gauge x={340} y={218} angle={0} label="LK₂" value={0} color={orange} />
          <text x="453" y="58" fontSize="16" fill={slate}>0 N</text><text x="453" y="224" fontSize="16" fill={slate}>0 N</text>
        </>}
        {step === 1 && [-theta1, theta2].map((angle, i) => {
          const gx = ringX + 64 * Math.cos(rad(angle)), gy = ringY + 64 * Math.sin(rad(angle));
          return <g key={i}>
            <line x1={ringX} y1={ringY} x2={gx} y2={gy} stroke={slate} strokeWidth="2" />
            <Gauge x={gx} y={gy} angle={angle} label={i === 0 ? 'LK₁' : 'LK₂'} value={(i === 0 ? 3 : 4) * pull / 100} color={i === 0 ? blue : orange} />
          </g>;
        })}
        {step === 1 && <Angle x={ringX} y={ringY} radius={27} from={-theta1} to={theta2} label="α" />}
        {step === 2 && <>
          <line x1={ringX} y1={ringY} x2={ringX + 65 * Math.cos(rad(-direction))} y2={ringY + 65 * Math.sin(rad(-direction))} stroke={slate} strokeWidth="2" />
          <Gauge x={ringX + 65 * Math.cos(rad(-direction))} y={ringY + 65 * Math.sin(rad(-direction))} angle={-direction} label="LK thay thế" value={force} color={green} />
          <path d={`M ${ringX} ${ringY} h 122`} stroke="#cbd5e1" strokeDasharray="3 3" />
          <Angle x={ringX} y={ringY} radius={36} from={0} to={-direction} label="β" />
        </>}
        {step === 3 && <>
          <path d={`M ${targetX + v1.x} ${centerY + v1.y} l ${v2.x} ${v2.y} l ${-v1.x} ${-v1.y}`} fill="#ecfdf5" fillOpacity="0.5" stroke="#94a3b8" strokeDasharray="4 3" />
          <Arrow x={targetX} y={centerY} dx={v1.x} dy={v1.y} label="F₁" color={blue} />
          <Arrow x={targetX} y={centerY} dx={v2.x} dy={v2.y} label="F₂" color={orange} offset={23} />
          <Arrow x={targetX} y={centerY} dx={resultant * vectorScale} dy={0} label="Flt" color={green} offset={-17} />
        </>}
        <circle cx={ringX} cy={ringY} r="7" fill="white" stroke={aligned ? green : '#334155'} strokeWidth="2.5" data-ring="R" />
        {!aligned && <text x={ringX - 14} y={ringY - 13} fill="#334155" fontSize="16">R</text>}
      </Diagram>
      {step === 0 && <div className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">Cố định: chốt C và dây đàn hồi. Cần theo dõi: vị trí vòng R so với mốc O.</div>}
      {step === 1 && <div className="space-y-2">
        <Control label="Mức kéo hai lực (%)" value={pull} min={0} max={100} onChange={setPull} />
        <button type="button" className={buttonClass} onClick={() => setPull(100)} data-action="pull-to-target">Kéo vòng đến O</button>
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-white p-2 text-center text-xs font-semibold"><span className="text-blue-700">F₁ = {number(3 * pull / 100)} N</span><span className="text-orange-700">F₂ = {number(4 * pull / 100)} N</span><span>α = {alpha}°</span></div>
      </div>}
      {step === 2 && <div className="space-y-2">
        <div className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">Đã ghi: F₁ = 3 N · F₂ = 4 N · α = {alpha}°. Vị trí cần khôi phục vẫn là O.</div>
        <Control label="Hướng kéo β (°)" value={direction} min={-15} max={15} onChange={value => { setDirection(value); setRecord(null); }} />
        <Control label="Lực thay thế (N)" value={force} min={0} max={8} step={0.1} onChange={value => { setForce(value); setRecord(null); }} />
        <p className="!my-1 text-xs text-slate-500">β = 0°: kéo ngang. β dương: chếch lên; β âm: chếch xuống. Chỉnh hướng trước, rồi chỉnh lực.</p>
      </div>}
      {step > 0 && step < 3 && <output className={`mt-2 block rounded-lg px-3 py-2 text-xs font-semibold ${aligned ? 'bg-teal-50 text-teal-800' : 'bg-amber-50 text-amber-900'}`} role="status">
        {aligned ? 'Vòng đã trùng mốc O trong độ phân giải. Có thể ghi kết quả.' : step === 1 ? 'Vòng chưa đến O. Tăng mức kéo để đưa vòng tới mốc.' : Math.abs(direction) > 0 ? 'Vòng lệch cao độ so với O. Chỉnh hướng kéo về phương ngang.' : ringX < targetX ? 'Vòng còn ở bên trái O. Tăng lực kéo.' : 'Vòng vượt sang phải O. Giảm lực kéo.'}
      </output>}
      {step === 3 && record && <div className="space-y-2" data-experiment-result="recorded">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-3 text-center text-xs"><div><span className="block text-slate-500">Lực thay thế đã ghi</span><strong className="text-base text-teal-800">{number(record.force)} N</strong></div><div><span className="block text-slate-500">Hợp lực lý thuyết</span><strong className="text-base text-slate-800">{number(resultant)} N</strong></div></div>
        <div className="min-w-0 text-xs"><Formula>{`F_{\\mathrm{lt}}=\\sqrt{3^2+4^2+2\\cdot3\\cdot4\\cos ${alpha}^\\circ}`}</Formula></div>
        <output className="block rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-900">Cùng hướng ngang (β = {number(record.direction)}°). Độ lệch độ lớn: δF = {number(deviation)}%. Vòng trở lại O: lực thay thế có cùng tác dụng với hai lực ban đầu trong độ phân giải này.</output>
        <p className="!my-1 text-xs text-slate-500">Độ lệch ở đây chủ yếu do thang chỉnh 0,1 N. Thí nghiệm thật còn có sai số lực kế, đọc góc và định vị vòng; mô phỏng không phải một phép đo độc lập chứng minh công thức.</p>
      </div>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <button type="button" onClick={back} disabled={step === 0} className={buttonClass} data-action="experiment-back">← Bước trước</button>
        {step < 3 ? <button type="button" onClick={next} disabled={!ready} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300" data-action="experiment-next">{step === 0 ? 'Đã chỉnh 0 · Bắt đầu →' : step === 1 ? 'Ghi hai lực →' : 'Ghi lực thay thế →'}</button> : <button type="button" onClick={() => reset()} className={buttonClass} data-action="experiment-reset">Làm lại / đổi góc</button>}
      </div>
    </div>
  </Figure>;
}
