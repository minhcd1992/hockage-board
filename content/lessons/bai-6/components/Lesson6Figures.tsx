'use client';

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';

const blue = '#2563eb', orange = '#c2410c', green = '#0f766e', slate = '#64748b';
const number = (v: number) => Number(v.toFixed(2)).toLocaleString('vi-VN');
const buttonClass = 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 focus-visible:outline-blue-600';
const presetClass = 'rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800';

function Figure({
  id,
  badge,
  title,
  caption,
  children,
}: {
  id: string;
  badge?: string;
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure
      data-figure={id}
      className="mx-auto my-6 w-full max-w-[600px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 text-sm leading-relaxed shadow-xs sm:p-4"
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
        <div className="text-sm font-bold text-slate-800 sm:text-base">{title}</div>
        {badge && (
          <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
            {badge}
          </span>
        )}
      </div>
      {children}
      <figcaption className="mt-2.5 border-t border-slate-200/80 pt-2 text-xs leading-relaxed text-slate-600">
        {caption}
      </figcaption>
    </figure>
  );
}

function Diagram({ label, children, height = 260 }: { label: string; children: ReactNode; height?: number }) {
  return (
    <svg
      viewBox={`0 0 560 ${height}`}
      role="img"
      aria-label={label}
      className="mx-auto my-2 block w-full max-w-[520px] rounded-xl border border-slate-200/80 bg-white"
      style={{ fontSize: 15 }}
    >
      {children}
    </svg>
  );
}

function Arrow({
  x,
  y,
  dx,
  dy = 0,
  color = blue,
  label,
  offset = -10,
  labelDx = 0,
  anchor = 'middle',
  width = 2.5,
  dashed = false,
}: {
  x: number;
  y: number;
  dx: number;
  dy?: number;
  color?: string;
  label?: string;
  offset?: number;
  labelDx?: number;
  anchor?: 'start' | 'middle' | 'end';
  width?: number;
  dashed?: boolean;
}) {
  const length = Math.hypot(dx, dy);
  if (length < 1e-7) return null;
  const ux = dx / length,
    uy = dy / length,
    ex = x + dx,
    ey = y + dy,
    head = Math.min(8, length * 0.4);
  return (
    <g data-vector={label}>
      <line
        x1={x}
        y1={y}
        x2={ex}
        y2={ey}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? '5 3' : undefined}
      />
      <path
        d={`M ${ex - ux * head - (uy * head) / 2} ${ey - uy * head + (ux * head) / 2} L ${ex} ${ey} L ${ex - ux * head + (uy * head) / 2} ${ey - uy * head - (ux * head) / 2}`}
        fill="none"
        stroke={color}
        strokeWidth={width}
      />
      {label && (
        <text
          x={ex + labelDx}
          y={ey + offset}
          textAnchor={anchor}
          fill={color}
          fontWeight="700"
          fontSize="14"
          stroke="white"
          strokeWidth="3.5"
          paintOrder="stroke"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Slider({
  label,
  shortLabel,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  shortLabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-0.5 flex items-center justify-between gap-1.5 text-[11.5px] font-semibold text-slate-700">
        <span className="truncate">{shortLabel ?? label}</span>
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11.5px] font-bold tabular-nums text-slate-900">
          {number(value)}
          {unit ? ` ${unit}` : ''}
        </span>
      </label>
      <input
        id={id}
        aria-label={label}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="block h-6 w-full cursor-pointer accent-blue-600"
      />
    </div>
  );
}

function useClock(duration: number, viewport: RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState({ time: 0, playing: false });
  useEffect(() => {
    if (!state.playing) return;
    let frame = 0,
      last = 0,
      visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      last = 0;
    });
    if (viewport.current) observer.observe(viewport.current);
    const tick = (now: number) => {
      if (!visible || document.hidden) last = 0;
      else if (!last) last = now;
      else if (now - last >= 30) {
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        setState(previous => {
          if (!previous.playing) return previous;
          const time = Math.min(duration, previous.time + dt);
          return { time, playing: time < duration };
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [state.playing, duration, viewport]);
  return {
    ...state,
    reset: () => setState({ time: 0, playing: false }),
    seek: (time: number) => setState({ time, playing: false }),
    toggle: () => setState(s => ({ time: s.time >= duration ? 0 : s.time, playing: !s.playing })),
  };
}

function Playback({ clock, duration }: { clock: ReturnType<typeof useClock>; duration: number }) {
  return (
    <div className="mt-2.5 space-y-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-action="play"
            aria-pressed={clock.playing}
            onClick={clock.toggle}
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 focus-visible:outline-blue-600"
          >
            {clock.playing ? 'Tạm dừng' : clock.time >= duration ? 'Chạy lại' : 'Chạy thí nghiệm'}
          </button>
          <button type="button" data-action="reset" onClick={clock.reset} className={buttonClass}>
            Về đầu
          </button>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold tabular-nums text-slate-700">
          t = {number(clock.time)} / {number(duration)} s
        </span>
      </div>
      <Slider
        label="Tiến trình (%)"
        value={(clock.time / duration) * 100}
        min={0}
        max={100}
        step={0.1}
        unit="%"
        onChange={v => clock.seek((v / 100) * duration)}
      />
    </div>
  );
}

export function BusBraking() {
  return (
    <Figure
      id="6.1"
      badge="Hiện tượng quán tính"
      title="Hình 6.1 · Xe buýt phanh gấp, người có xu hướng giữ vận tốc"
      caption="Sơ đồ định tính ở giai đoạn đầu phanh, nhìn từ hệ quy chiếu mặt đất. Sàn xe tác dụng lực ma sát giữ chân hành khách chậm lại cùng xe, trong khi phần thân trên có xu hướng tiếp tục tiến về trước với vận tốc cũ. Không có một lực thật nào đẩy người về phía trước."
    >
      <Diagram label="Xe buýt đang đi sang phải thì hãm phanh làm gia tốc hướng sang trái; hành khách và dây nắm nghiêng về phía đầu xe." height={255}>
        {/* Top kinematic header bar */}
        <rect x="16" y="10" width="528" height="38" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
        <text x="28" y="34" fill="#334155" fontWeight="600" fontSize="13.5">
          Chuyển động của xe:
        </text>
        <Arrow x={182} y={29} dx={58} color={blue} label="v xe (tiến)" offset={5} labelDx={42} />
        <Arrow x={516} y={29} dx={-58} color={green} label="a xe (hãm)" offset={5} labelDx={-44} />

        {/* Road & motion direction */}
        <rect x="16" y="205" width="528" height="16" rx="4" fill="#f1f5f9" />
        <path d="M 24 205 H 536" stroke="#94a3b8" strokeWidth="2.5" />
        <path d="M 45 213 H 515" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="10 8" />

        {/* Bus body shell */}
        <path
          d="M 58 182 V 76 Q 58 60 74 60 H 442 Q 474 60 486 98 L 496 140 V 182 Z"
          fill="#dbeafe"
          stroke={blue}
          strokeWidth="2"
        />
        {/* Front driver windshield & headlight */}
        <path d="M 448 72 H 472 L 486 122 H 448 Z" fill="#eff6ff" stroke="#60a5fa" strokeWidth="1.5" />
        <rect x="488" y="152" width="8" height="14" rx="2" fill="#f59e0b" />

        {/* Interior cutaway */}
        <rect x="74" y="70" width="362" height="102" rx="6" fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" />
        {/* Floor inside cutaway */}
        <line x1="74" y1="168" x2="436" y2="168" stroke="#64748b" strokeWidth="2.5" />
        {/* Overhead handrail */}
        <line x1="84" y1="80" x2="424" y2="80" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="152" y1="80" x2="152" y2="168" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="416" y1="80" x2="416" y2="168" stroke="#cbd5e1" strokeWidth="2" />

        {/* Seats on left */}
        <path d="M 90 136 V 156 H 114 V 168 M 122 136 V 156 H 144 V 168" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />

        {/* Hanging strap swinging forward */}
        <line x1="192" y1="80" x2="192" y2="112" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="192" y1="80" x2="208" y2="108" stroke="#64748b" strokeWidth="2" />
        <circle cx="211" cy="112" r="4.5" fill="none" stroke="#475569" strokeWidth="2" />
        <text x="192" y="129" textAnchor="middle" fill={slate} fontSize="11.5">
          Dây nắm lệch tới
        </text>

        {/* Standing passenger leaning forward */}
        <path
          d="M 262 167 L 272 138 L 292 106 M 272 138 L 288 167 M 284 116 L 316 112"
          stroke={orange}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="299" cy="92" r="10" fill="#fed7aa" stroke={orange} strokeWidth="2.5" />

        {/* Upper body inertia velocity vector */}
        <Arrow x={316} y={94} dx={60} color={orange} label="v người" offset={-9} />
        <text x="352" y="128" textAnchor="middle" fill={orange} fontSize="12" fontWeight="600">
          Thân trên giữ đà tiến
        </text>

        {/* Floor braking force on feet */}
        <Arrow x={258} y={161} dx={-42} color={green} label="f sàn" offset={-8} labelDx={-6} />

        {/* Wheels in clean wheel wells */}
        {[136, 412].map(x => (
          <g key={x}>
            <circle cx={x} cy="186" r="20" fill="#1e293b" />
            <circle cx={x} cy="186" r="9" fill="#cbd5e1" />
            <circle cx={x} cy="186" r="3" fill="#475569" />
          </g>
        ))}

        {/* Footer annotation */}
        <text x="95" y="238" fill={slate} fontSize="13">
          Hệ quy chiếu: Mặt đất
        </text>
        <text x="435" y="238" textAnchor="middle" fill="#334155" fontWeight="600" fontSize="13.5">
          Chiều xe đang chạy →
        </text>
      </Diagram>
    </Figure>
  );
}

export function BoatJump() {
  return (
    <Figure
      id="6.3"
      badge="Tương tác hai chiều"
      title="Hình 6.2 · Người đạp xuồng để nhảy lên bến"
      caption="Hai mũi tên biểu diễn thành phần ngang của cặp lực tiếp xúc trong lúc chân còn đạp vào mạn xuồng. Hai lực cùng độ lớn, ngược chiều nhưng đặt vào hai vật khác nhau (người và xuồng) nên không triệt tiêu nhau trên từng vật; các lực phương đứng được lược bỏ."
    >
      <Diagram label="Người ở xuồng bên trái đạp xuồng để nhảy sang bến bên phải; xuồng đẩy người sang phải, người đẩy xuồng sang trái." height={255}>
        {/* Sky and water background */}
        <rect x="16" y="10" width="528" height="232" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
        <path
          d="M 16 192 Q 44 185 72 192 T 128 192 T 184 192 T 240 192 T 296 192 T 352 192 T 408 192 T 464 192 T 520 192 L 544 192 V 242 H 16 Z"
          fill="#e0f2fe"
        />
        <path
          d="M 20 192 Q 46 185 72 192 T 124 192 T 176 192 T 228 192 T 280 192 T 332 192 T 384 192"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
        />

        {/* Top badge wide enough for text */}
        <rect x="24" y="18" width="416" height="28" rx="6" fill="#ffffff" stroke="#cbd5e1" />
        <text x="232" y="36" textAnchor="middle" fill="#334155" fontSize="13" fontWeight="600">
          Trong lúc đạp xuồng: F(xuồng → người) = −F(người → xuồng)
        </text>

        {/* Wooden pier on the right */}
        <rect x="384" y="148" width="146" height="14" rx="3" fill="#d97706" stroke="#78350f" strokeWidth="2" />
        <line x1="408" y1="162" x2="408" y2="236" stroke="#78350f" strokeWidth="7" />
        <line x1="504" y1="162" x2="504" y2="236" stroke="#78350f" strokeWidth="7" />
        <text x="457" y="136" textAnchor="middle" fill="#78350f" fontWeight="700" fontSize="14">
          Bến gỗ (Bờ)
        </text>

        {/* Wooden boat on the left */}
        <path
          d="M 68 162 H 302 L 278 196 H 94 Z"
          fill="#eab308"
          fillOpacity="0.35"
          stroke="#92400e"
          strokeWidth="2.5"
        />
        <line x1="68" y1="162" x2="302" y2="162" stroke="#78350f" strokeWidth="3.5" />
        <line x1="142" y1="163" x2="148" y2="195" stroke="#92400e" strokeWidth="2.5" />
        <line x1="228" y1="163" x2="222" y2="195" stroke="#92400e" strokeWidth="2.5" />
        <text x="112" y="184" textAnchor="middle" fill="#78350f" fontWeight="700" fontSize="13.5">
          Xuồng
        </text>

        {/* Person leaping from boat deck (x=256, y=160) toward pier */}
        <path
          d="M 256 159 L 274 124 L 298 92 M 274 124 L 308 114 L 324 126 M 288 102 L 320 96"
          stroke={orange}
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="305" cy="76" r="10.5" fill="#fed7aa" stroke={orange} strokeWidth="2.5" />

        {/* Contact point O */}
        <circle cx="256" cy="161" r="5.5" fill={green} stroke="white" strokeWidth="1.5" />

        {/* Force vectors at contact point */}
        <Arrow
          x={256}
          y={155}
          dx={96}
          color={blue}
          label="Xuồng → người"
          offset={22}
          labelDx={-14}
        />
        <Arrow
          x={256}
          y={172}
          dx={-92}
          color={orange}
          label="Người → xuồng"
          offset={44}
          labelDx={22}
        />

        {/* Motion tendency indicators */}
        <Arrow x={324} y={66} dx={44} color={blue} label="Người tiến" offset={-8} width={2} dashed />
        <Arrow x={108} y={144} dx={-44} color={orange} label="Xuồng lùi" offset={-8} width={2} dashed />
      </Diagram>
    </Figure>
  );
}

export function AirTrack() {
  const [speed, setSpeed] = useState(1);
  const viewport = useRef<HTMLDivElement>(null),
    duration = 4 / speed;
  const clock = useClock(duration, viewport);
  const x = speed * clock.time,
    px = 60 + x * 102;
  const tA = 1 / speed,
    tB = 3 / speed;
  const passedA = x >= 1 - 1e-6,
    passedB = x >= 3 - 1e-6;
  const graphY = (pos: number) => 296 - 24 * pos;

  return (
    <Figure
      id="6.4"
      badge="Thí nghiệm đệm khí"
      title="Mô phỏng 6.3 · Con trượt trên băng đệm khí và cổng quang điện"
      caption="Ray đệm khí nằm ngang, bỏ qua ma sát và lực cản (∑F = 0), x₀ = 0. Cổng quang A đặt tại 1 m, cổng B tại 3 m. Đồ thị x–t bên dưới giữ cố định thang thời gian 0–8 s để dễ so sánh độ dốc v = Δx/Δt khi thay đổi vận tốc ban đầu. Mô phỏng dừng ở x = 4 m."
    >
      <div
        ref={viewport}
        data-simulation="air-track"
        data-time={clock.time}
        data-playing={clock.playing}
        data-x={x}
        data-v={speed}
        data-duration={duration}
      >
        <div className="mb-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
          <Slider
            label="Vận tốc ban đầu (m/s)"
            value={speed}
            min={0.5}
            max={2}
            step={0.25}
            unit="m/s"
            onChange={v => {
              clock.reset();
              setSpeed(v);
            }}
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Chọn nhanh:</span>
            {[0.5, 1, 1.5, 2].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  clock.reset();
                  setSpeed(v);
                }}
                className={`${presetClass} ${speed === v ? '!border-blue-500 !bg-blue-50 !font-bold !text-blue-800' : ''}`}
              >
                v = {number(v)} m/s
              </button>
            ))}
          </div>
        </div>

        <Diagram label={`Con trượt ở x = ${number(x)} m, vận tốc ${number(speed)} m/s không đổi.`} height={336}>
          {/* Panel 1: Air track apparatus */}
          <rect x="12" y="8" width="536" height="148" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="24" y="26" fill="#334155" fontWeight="700" fontSize="13.5">
            1. Bố trí băng đệm khí (N + P = 0, hợp lực ngang = 0)
          </text>

          {/* Air track beam and air nozzles */}
          <rect x="34" y="104" width="484" height="14" rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
          <line x1="42" y1="118" x2="42" y2="128" stroke="#64748b" strokeWidth="4" />
          <line x1="486" y1="118" x2="486" y2="128" stroke="#64748b" strokeWidth="4" />
          {Array.from({ length: 21 }, (_, i) => (
            <path key={i} d={`M ${48 + i * 22} 102 v -6`} stroke="#38bdf8" strokeWidth="1.8" />
          ))}

          {/* Ruler ticks along the rail */}
          <line x1="60" y1="128" x2="468" y2="128" stroke="#94a3b8" strokeWidth="1.5" />
          {Array.from({ length: 17 }, (_, i) => {
            const tx = 60 + i * 25.5;
            const major = i % 4 === 0;
            return (
              <line
                key={i}
                x1={tx}
                y1="128"
                x2={tx}
                y2={major ? 135 : 132}
                stroke={major ? '#475569' : '#94a3b8'}
                strokeWidth={major ? '1.8' : '1'}
              />
            );
          })}
          {[0, 1, 2, 3, 4].map(n => (
            <text key={n} x={60 + n * 102} y="149" textAnchor="middle" fill="#475569" fontSize="13" fontWeight="600">
              {n}
            </text>
          ))}
          <text x="512" y="149" textAnchor="middle" fill={slate} fontSize="13" fontWeight="600">
            x (m)
          </text>

          {/* Photogates A (1 m) and B (3 m) */}
          {[
            { pos: 1, name: 'A', passed: passedA, tGate: tA },
            { pos: 3, name: 'B', passed: passedB, tGate: tB },
          ].map(({ pos, name, passed, tGate }) => {
            const gx = 60 + pos * 102;
            const gateColor = passed ? green : '#94a3b8';
            return (
              <g key={name}>
                <path
                  d={`M ${gx - 12} 104 v -54 h 24 v 54`}
                  fill="none"
                  stroke={gateColor}
                  strokeWidth="2.5"
                />
                <line x1={gx} y1="50" x2={gx} y2="104" stroke={passed ? '#10b981' : '#cbd5e1'} strokeDasharray="3 3" />
                <rect
                  x={gx - 38}
                  y="29"
                  width="76"
                  height="18"
                  rx="4"
                  fill={passed ? '#ecfdf5' : '#ffffff'}
                  stroke={gateColor}
                  strokeWidth="1.2"
                />
                <text x={gx} y="42" textAnchor="middle" fill={passed ? green : '#475569'} fontSize="11.5" fontWeight="700">
                  Cổng {name}: {passed ? `${number(tGate)}s` : 'chờ'}
                </text>
              </g>
            );
          })}

          {/* Glider (Con trượt) */}
          <rect x={px - 18} y="80" width="36" height="20" rx="4" fill="#dbeafe" stroke={blue} strokeWidth="2" />
          <rect x={px - 3} y="73" width="6" height="7" rx="1" fill={blue} />
          <Arrow x={px} y={80} dx={0} dy={-23} label="N" color={green} offset={4} labelDx={-14} />
          <Arrow x={px} y={100} dx={0} dy={23} label="P" color={orange} offset={-2} labelDx={-14} />
          <Arrow x={px + 18} y={89} dx={speed * 26} label="v" color={blue} offset={-8} />

          {/* Panel 2: x-t Graph */}
          <rect x="12" y="164" width="536" height="164" rx="10" fill="#ffffff" stroke="#e2e8f0" />
          <text x="24" y="183" fill="#334155" fontWeight="700" fontSize="13.5">
            2. Đồ thị tọa độ – thời gian x(t) (Độ dốc = vận tốc v)
          </text>

          {/* Gridlines for x-t graph */}
          {[1, 2, 3, 4].map(m => (
            <g key={m}>
              <line x1="70" y1={graphY(m)} x2="470" y2={graphY(m)} stroke="#f1f5f9" strokeWidth="1.2" />
              <text x="58" y={graphY(m) + 4} textAnchor="end" fill={slate} fontSize="12">
                {m}
              </text>
            </g>
          ))}
          <text x="58" y={graphY(0) + 4} textAnchor="end" fill={slate} fontSize="12">
            0
          </text>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(t => (
            <g key={t}>
              <line x1={70 + 50 * t} y1="196" x2={70 + 50 * t} y2="296" stroke="#f1f5f9" strokeWidth="1.2" />
              {t % 2 === 0 && (
                <text x={70 + 50 * t} y="315" textAnchor="middle" fill={slate} fontSize="12.5">
                  {t}
                </text>
              )}
            </g>
          ))}
          <text x="70" y="315" textAnchor="middle" fill={slate} fontSize="12.5">
            0
          </text>

          {/* Axes */}
          <path d="M 70 192 V 296 H 482" stroke="#64748b" strokeWidth="1.8" fill="none" />
          <text x="28" y="252" textAnchor="middle" fill="#475569" fontWeight="600" fontSize="12.5">
            x (m)
          </text>
          <text x="492" y="300" fill="#475569" fontWeight="600" fontSize="12.5">
            t (s)
          </text>

          {/* Gate A and Gate B reference projections on graph */}
          {[
            { m: 1, tGate: tA, name: 'A' },
            { m: 3, tGate: tB, name: 'B' },
          ].map(({ m, tGate, name }) => (
            <g key={name}>
              <path
                d={`M 70 ${graphY(m)} H ${70 + 50 * tGate} V 296`}
                fill="none"
                stroke="#cbd5e1"
                strokeDasharray="3 3"
              />
              <circle cx={70 + 50 * tGate} cy={graphY(m)} r="3.5" fill={green} />
            </g>
          ))}

          {/* Predicted full line and active line */}
          <path
            d={`M 70 296 L ${70 + 50 * duration} ${graphY(4)}`}
            stroke="#93c5fd"
            strokeWidth="2"
            strokeDasharray="5 4"
            fill="none"
          />
          <path
            d={`M 70 296 L ${70 + 50 * clock.time} ${graphY(x)}`}
            stroke={blue}
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx={70 + 50 * clock.time}
            cy={graphY(x)}
            r="5.5"
            fill={blue}
            stroke="white"
            strokeWidth="2"
            data-graph-point="position"
          />
          <text
            x={Math.min(410, 70 + 50 * duration + 10)}
            y={graphY(4) + 12}
            fill={blue}
            fontWeight="700"
            fontSize="13.5"
          >
            x = vt
          </text>
        </Diagram>

        <output className="block rounded-xl border border-blue-200 bg-blue-50/90 px-3 py-2 text-xs leading-relaxed text-blue-950">
          <strong>x = {number(x)} m</strong> · <strong>v = {number(speed)} m/s</strong> · <strong>a = 0</strong>. Dự kiến: tA = {number(tA)} s; tB = {number(tB)} s; Δt = {number(tB - tA)} s ⇒ Δx/Δt = {number(speed)} m/s.
        </output>
        <Playback clock={clock} duration={duration} />
      </div>
    </Figure>
  );
}

export function CarForces() {
  const [mass, setMass] = useState(2600),
    [traction, setTraction] = useState(18200),
    [resistance, setResistance] = useState(2600);
  const net = traction - resistance,
    acceleration = net / mass,
    forceScale = 0.0025;
  const cx = 418,
    cy = 148;

  return (
    <Figure
      id="6.2"
      badge="Thí nghiệm định luật II"
      title="Mô phỏng 6.4 · Điều chỉnh ngoại lực và khối lượng của ô tô"
      caption="Xét một thời điểm xe đang đi sang phải trên đường ngang. Fk là lực phát động hiệu dụng từ mặt đường, Fc là tổng lực cản; N = P = mg (lấy g = 10 m/s²). Sơ đồ bên phải biểu diễn ngoại lực trên toàn xe như chất điểm với cùng tỉ lệ lực; mũi tên gia tốc a dùng thang riêng. Số liệu giả định để luyện mô hình."
    >
      <div data-simulation="car-forces" data-mass={mass} data-net-force={net} data-acceleration={acceleration}>
        {/* Quick scenario buttons matching theory text */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-600">Tình huống mẫu:</span>
          <button
            type="button"
            onClick={() => {
              setMass(2600);
              setTraction(18200);
              setResistance(2600);
            }}
            className={presetClass}
          >
            1. Tăng tốc (a = 6 m/s²)
          </button>
          <button
            type="button"
            onClick={() => {
              setMass(1300);
              setTraction(18200);
              setResistance(2600);
            }}
            className={presetClass}
          >
            2. Giảm nửa m (a = 12 m/s²)
          </button>
          <button
            type="button"
            onClick={() => {
              setMass(2600);
              setTraction(2600);
              setResistance(2600);
            }}
            className={presetClass}
          >
            3. Cân bằng Fk = Fc (a = 0)
          </button>
          <button
            type="button"
            onClick={() => {
              setMass(2600);
              setTraction(0);
              setResistance(2600);
            }}
            className={presetClass}
          >
            4. Ngắt lực kéo (a &lt; 0)
          </button>
        </div>

        <Diagram
          label={`Ô tô đang đi sang phải; hợp lực ${number(net)} N, gia tốc ${number(acceleration)} mét trên giây bình phương.`}
          height={280}
        >
          {/* Left panel: Car motion */}
          <rect x="12" y="10" width="264" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="24" y="30" fill="#334155" fontWeight="700" fontSize="13.5">
            1. Trạng thái chuyển động
          </text>

          {/* Velocity arrow */}
          <Arrow x={88} y={72} dx={96} label="v" color={blue} offset={-9} />
          <text x="144" y="90" textAnchor="middle" fill={slate} fontSize="12">
            Xe đang đi sang phải →
          </text>

          {/* Road & Car silhouette */}
          <line x1="26" y1="188" x2="262" y2="188" stroke="#94a3b8" strokeWidth="3" />
          <path
            d="M 48 160 L 68 146 L 94 114 H 164 L 198 144 L 230 153 V 174 H 48 Z"
            fill="#dbeafe"
            stroke={blue}
            strokeWidth="2"
          />
          <path d="M 100 121 H 158 L 180 143 H 84 Z" fill="#eff6ff" stroke="#93c5fd" />
          <line x1="130" y1="121" x2="130" y2="143" stroke="#93c5fd" />
          {[86, 192].map(x => (
            <g key={x}>
              <circle cx={x} cy="174" r="14" fill="#1e293b" />
              <circle cx={x} cy="174" r="6" fill="#cbd5e1" />
            </g>
          ))}

          {/* Acceleration box inside left panel */}
          <rect x="24" y="204" width="240" height="52" rx="8" fill="#ffffff" stroke="#e2e8f0" />
          <text x="34" y="222" fill={slate} fontSize="12" fontWeight="600">
            Gia tốc:
          </text>
          <Arrow x={144} y={236} dx={acceleration * 6.5} label="a" color={green} offset={-8} />
          {net === 0 && (
            <text x="154" y="239" textAnchor="middle" fill={green} fontWeight="700" fontSize="13.5">
              a = 0 (giữ nguyên vận tốc)
            </text>
          )}

          {/* Right panel: Free-body diagram */}
          <rect x="286" y="10" width="262" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="298" y="30" fill="#334155" fontWeight="700" fontSize="13.5">
            2. Sơ đồ ngoại lực (chất điểm)
          </text>

          {/* Reference axes */}
          <line x1="304" y1={cy} x2="532" y2={cy} stroke="#cbd5e1" strokeDasharray="4 4" />
          <line x1={cx} y1="42" x2={cx} y2="254" stroke="#cbd5e1" strokeDasharray="4 4" />
          <text x="530" y={cy - 6} textAnchor="end" fill={slate} fontSize="11.5">
            Ox
          </text>

          {/* Force vectors sharing forceScale */}
          <Arrow
            x={cx}
            y={cy}
            dx={traction * forceScale}
            label="Fk"
            color={blue}
            offset={-10}
            labelDx={traction * forceScale < 24 ? 18 : 0}
          />
          <Arrow
            x={cx}
            y={cy}
            dx={-resistance * forceScale}
            label="Fc"
            color={orange}
            offset={20}
            labelDx={resistance * forceScale < 24 ? -18 : -8}
          />
          <Arrow x={cx} y={cy} dx={0} dy={-mass * 10 * forceScale} label="N" color={green} offset={10} labelDx={16} />
          <Arrow x={cx} y={cy} dx={0} dy={mass * 10 * forceScale} label="P" color={green} offset={-2} labelDx={16} />
          <circle cx={cx} cy={cy} r="6.5" fill="#1e293b" stroke="white" strokeWidth="1.5" />
        </Diagram>

        <div className="mt-2 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs sm:grid-cols-3">
          <Slider
            label="Khối lượng m (kg)"
            shortLabel="Khối lượng m"
            value={mass}
            min={1000}
            max={4000}
            step={100}
            unit="kg"
            onChange={setMass}
          />
          <Slider
            label="Lực kéo Fk (N)"
            shortLabel="Lực kéo Fk"
            value={traction}
            min={0}
            max={20000}
            step={200}
            unit="N"
            onChange={setTraction}
          />
          <Slider
            label="Lực cản Fc (N)"
            shortLabel="Lực cản Fc"
            value={resistance}
            min={0}
            max={6000}
            step={200}
            unit="N"
            onChange={setResistance}
          />
        </div>

        <output className="mt-2.5 block rounded-xl border border-teal-200 bg-teal-50/90 px-3 py-2 text-xs leading-relaxed text-teal-950">
          <strong>Fhợp = Fk − Fc = {number(net)} N</strong> · <strong>a = (Fk − Fc)/m = {number(acceleration)} m/s²</strong>.{' '}
          {net > 0
            ? 'Hợp lực cùng chiều vận tốc: xe tăng tốc (nhanh dần).'
            : net < 0
              ? 'Hợp lực ngược chiều vận tốc: xe giảm tốc (chậm dần khi còn đi sang phải).'
              : 'Hợp lực bằng 0: vận tốc hiện có được giữ nguyên.'}
        </output>
      </div>
    </Figure>
  );
}

export function ForceSensors() {
  const [peak, setPeak] = useState(12);
  const viewport = useRef<HTMLDivElement>(null),
    clock = useClock(5, viewport);
  const forceAt = (t: number) => peak * (t < 1 ? t : t <= 3 ? 1 : t < 4 ? 4 - t : 0);
  const f = forceAt(clock.time);
  const zeroY = 240;
  const graph = (sign: number) =>
    [0, 1, 3, 4, 5]
      .map((t, i) => `${i ? 'L' : 'M'} ${65 + t * 86} ${zeroY - sign * forceAt(t) * 2.3}`)
      .join(' ');

  return (
    <Figure
      id="6.5"
      badge="Thí nghiệm cảm biến lực"
      title="Mô phỏng 6.5 · Hai cảm biến lực móc nối (Lực và phản lực)"
      caption="Hai đầu ngoài được kéo đối xứng, gần cân bằng; chỉ xét cặp lực tương tác giữa hai cảm biến tại móc nối. Hai lực đặt lên hai vật khác nhau. Đồ thị biểu diễn hình chiếu hai lực theo cùng chiều dương sang phải: hai đường luôn đối xứng qua trục thời gian tại mọi thời điểm."
    >
      <div
        ref={viewport}
        data-simulation="force-sensors"
        data-time={clock.time}
        data-playing={clock.playing}
        data-force-a={f}
        data-force-b={-f}
      >
        <div className="mb-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
          <Slider
            label="Lực giữ (N)"
            value={peak}
            min={4}
            max={20}
            unit="N"
            onChange={v => {
              clock.reset();
              setPeak(v);
            }}
          />
        </div>

        <Diagram
          label={`Lực B tác dụng lên A bằng ${number(f)} N; lực A tác dụng lên B bằng ${number(-f)} N.`}
          height={336}
        >
          {/* Panel 1: Force sensors apparatus */}
          <rect x="12" y="8" width="536" height="128" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="24" y="26" fill="#334155" fontWeight="700" fontSize="13.5">
            1. Hai cảm biến lực A và B móc vào nhau (Chiều dương Ox →)
          </text>

          {/* Left pull handle & Sensor A */}
          <line x1="36" y1="72" x2="76" y2="72" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <circle cx="34" cy="72" r="6" fill="none" stroke="#475569" strokeWidth="3" />
          <rect x="76" y="48" width="154" height="48" rx="8" fill="#dbeafe" stroke={blue} strokeWidth="2" />
          <text x="118" y="68" textAnchor="middle" fill={blue} fontWeight="700" fontSize="13.5">
            Cảm biến A
          </text>
          <text x="118" y="84" textAnchor="middle" fill="#1e40af" fontSize="11">
            Chịu lực từ B
          </text>
          <rect x="164" y="55" width="58" height="34" rx="5" fill="#ffffff" stroke="#93c5fd" />
          <text x="193" y="77" textAnchor="middle" fill={blue} fontWeight="700" fontSize="13">
            +{number(f)} N
          </text>

          {/* Right pull handle & Sensor B */}
          <line x1="484" y1="72" x2="524" y2="72" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <circle cx="526" cy="72" r="6" fill="none" stroke="#475569" strokeWidth="3" />
          <rect x="330" y="48" width="154" height="48" rx="8" fill="#ffedd5" stroke={orange} strokeWidth="2" />
          <rect x="338" y="55" width="58" height="34" rx="5" fill="#ffffff" stroke="#fdba74" />
          <text x="367" y="77" textAnchor="middle" fill={orange} fontWeight="700" fontSize="13">
            {number(-f)} N
          </text>
          <text x="440" y="68" textAnchor="middle" fill={orange} fontWeight="700" fontSize="13.5">
            Cảm biến B
          </text>
          <text x="440" y="84" textAnchor="middle" fill="#9a3412" fontSize="11">
            Chịu lực từ A
          </text>

          {/* Interlocking hooks at x=280, y=72 */}
          <path
            d="M 230 72 H 266 C 284 72 284 62 272 62 M 330 72 H 294 C 276 72 276 82 288 82"
            fill="none"
            stroke="#475569"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="280" cy="72" r="3.5" fill={green} />

          {/* Force vectors above and below the hooks */}
          <Arrow x={262} y={40} dx={f * 3.8} label="F(B → A)" color={blue} offset={-7} />
          <Arrow x={298} y={106} dx={-f * 3.8} label="F(A → B)" color={orange} offset={19} />

          {/* Panel 2: Force-Time Graph */}
          <rect x="12" y="144" width="536" height="184" rx="10" fill="#ffffff" stroke="#e2e8f0" />
          <text x="24" y="163" fill="#334155" fontWeight="700" fontSize="13.5">
            2. Đồ thị lực tương tác theo thời gian F(t)
          </text>

          {/* Legend in header row (never overlaps curves) */}
          <line x1="330" y1="159" x2="352" y2="159" stroke={blue} strokeWidth="3" />
          <text x="357" y="163" fill={blue} fontWeight="700" fontSize="12.5">
            F(B→A)
          </text>
          <line x1="428" y1="159" x2="450" y2="159" stroke={orange} strokeWidth="3" />
          <text x="455" y="163" fill={orange} fontWeight="700" fontSize="12.5">
            F(A→B)
          </text>

          {/* Gridlines */}
          {[20, 10, 0, -10, -20].map(val => (
            <g key={val}>
              <line
                x1="72"
                y1={zeroY - val * 2.3}
                x2="494"
                y2={zeroY - val * 2.3}
                stroke={val === 0 ? '#94a3b8' : '#f1f5f9'}
                strokeWidth={val === 0 ? '1.6' : '1.2'}
              />
              {val % 20 === 0 && (
                <text x="64" y={zeroY - val * 2.3 + 4} textAnchor="end" fill={slate} fontSize="12">
                  {val > 0 ? `+${val}` : val < 0 ? `−${Math.abs(val)}` : '0'}
                </text>
              )}
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map(t => (
            <g key={t}>
              <line x1={65 + t * 86} y1="186" x2={65 + t * 86} y2="294" stroke="#f1f5f9" strokeWidth="1.2" />
              <text x={65 + t * 86} y="314" textAnchor="middle" fill={slate} fontSize="12.5">
                {t}
              </text>
            </g>
          ))}

          {/* Phase labels */}
          <text x="108" y="182" textAnchor="middle" fill="#64748b" fontSize="11">
            Kéo tăng
          </text>
          <text x="237" y="182" textAnchor="middle" fill="#64748b" fontSize="11">
            Giữ không đổi
          </text>
          <text x="366" y="182" textAnchor="middle" fill="#64748b" fontSize="11">
            Nhả dần
          </text>
          <text x="452" y="182" textAnchor="middle" fill="#64748b" fontSize="11">
            Đã nhả
          </text>

          {/* Axes */}
          <line x1="65" y1="184" x2="65" y2="296" stroke="#64748b" strokeWidth="1.6" />
          <text x="26" y="244" textAnchor="middle" fill="#475569" fontWeight="600" fontSize="12">
            F (N)
          </text>
          <text x="506" y="244" fill="#475569" fontWeight="600" fontSize="12.5">
            t (s)
          </text>

          {/* Symmetric force curves */}
          <path d={graph(1)} stroke={blue} strokeWidth="2.5" fill="none" />
          <path d={graph(-1)} stroke={orange} strokeWidth="2.5" fill="none" />

          {/* Current time cursor and live points */}
          <line
            x1={65 + clock.time * 86}
            x2={65 + clock.time * 86}
            y1="186"
            y2="294"
            stroke="#64748b"
            strokeDasharray="3 3"
          />
          {[1, -1].map(sign => (
            <circle
              key={sign}
              cx={65 + clock.time * 86}
              cy={zeroY - sign * f * 2.3}
              r="5"
              fill={sign === 1 ? blue : orange}
              stroke="white"
              strokeWidth="1.5"
            />
          ))}
        </Diagram>

        <output className="block rounded-xl border border-blue-200 bg-blue-50/90 px-3 py-2 text-xs leading-relaxed text-blue-950">
          Giai đoạn:{' '}
          <strong>
            {clock.time < 1 ? 'Kéo tăng' : clock.time <= 3 ? 'Giữ' : clock.time < 4 ? 'Nhả dần' : 'Đã nhả'}
          </strong>{' '}
          · <strong>F(B→A) = {number(f)} N</strong> · <strong>F(A→B) = {number(-f)} N</strong>. Tổng đại số hai hình chiếu bằng 0, nhưng hai lực đặt lên hai cảm biến khác nhau.
        </output>
        <Playback clock={clock} duration={5} />
      </div>
    </Figure>
  );
}

export function GalileoRamps() {
  const [selected, setSelected] = useState<'all' | 0 | 1 | 2>('all');
  const cases = [
    {
      id: 0 as const,
      tag: 'a',
      name: 'Dốc phải nghiêng nhiều',
      end: 265,
      note: 'Vật lên lại đúng độ cao h sau quãng đường ngắn.',
    },
    {
      id: 1 as const,
      tag: 'b',
      name: 'Dốc phải thoải hơn',
      end: 410,
      note: 'Vật phải đi quãng đường dài hơn nhiều mới đạt lại độ cao h.',
    },
    {
      id: 2 as const,
      tag: 'c',
      name: 'Mặt phải nằm ngang (độ dốc = 0)',
      end: 485,
      note: 'Không lên cao thêm: vật giữ vận tốc không đổi và chuyển động thẳng đều mãi.',
    },
  ];

  return (
    <Figure
      id="6.6"
      badge="Thí nghiệm tưởng tượng Galileo"
      title="Hình 6.6 · Dốc càng thoải, quãng đường đi càng dài"
      caption="Ba mô hình có cùng độ cao thả h. Vật nhỏ trượt không ma sát, bỏ qua chuyển động quay và mất mát cơ năng ở chỗ chuyển tiếp. Hình thể hiện quỹ đạo và vị trí đạt độ cao cực đại ở từng trường hợp."
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-600">Chế độ xem:</span>
        <button
          type="button"
          onClick={() => setSelected('all')}
          className={`${presetClass} ${selected === 'all' ? '!border-blue-500 !bg-blue-50 !font-bold !text-blue-800' : ''}`}
        >
          So sánh cả 3 trường hợp
        </button>
        {cases.map(c => (
          <button
            key={c.tag}
            type="button"
            onClick={() => setSelected(c.id)}
            className={`${presetClass} ${selected === c.id ? '!border-blue-500 !bg-blue-50 !font-bold !text-blue-800' : ''}`}
          >
            Trường hợp ({c.tag})
          </button>
        ))}
      </div>

      <Diagram
        label="Hai dốc lên có độ nghiêng khác nhau đều đưa vật về cùng độ cao h; trên đoạn ngang lý tưởng vật tiếp tục đi mãi với vận tốc không đổi."
        height={318}
      >
        {cases.map((item, row) => {
          const base = 92 + row * 98;
          const topY = base - 36;
          const active = selected === 'all' || selected === row;
          return (
            <g key={row} opacity={active ? 1 : 0.32}>
              {/* Lane card background */}
              <rect
                x="14"
                y={base - 76}
                width="532"
                height="90"
                rx="8"
                fill={selected === row ? '#eff6ff' : '#f8fafc'}
                stroke={selected === row ? '#93c5fd' : '#e2e8f0'}
              />
              {/* Case label well above ball */}
              <circle cx="34" cy={base - 58} r="9.5" fill={active ? blue : '#94a3b8'} />
              <text x="34" y={base - 54} textAnchor="middle" fill="white" fontWeight="700" fontSize="12">
                {item.tag}
              </text>
              <text x="50" y={base - 54} fill="#334155" fontWeight="600" fontSize="12.5">
                {item.name}
              </text>

              {/* Height h marker on left */}
              <line x1="62" y1={topY} x2="62" y2={base} stroke="#64748b" strokeWidth="1.5" />
              <line x1="58" y1={topY} x2="66" y2={topY} stroke="#64748b" strokeWidth="1.5" />
              <line x1="58" y1={base} x2="66" y2={base} stroke="#64748b" strokeWidth="1.5" />
              <text x="48" y={base - 14} textAnchor="middle" fill={slate} fontWeight="600" fontSize="13">
                h
              </text>

              {/* Dashed equal-height reference line */}
              <line
                x1="66"
                y1={topY}
                x2={row < 2 ? item.end : 495}
                y2={topY}
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />

              {/* Smooth ramp track */}
              <path
                d={
                  row < 2
                    ? `M 84 ${topY} L 154 ${base} L 182 ${base} L ${item.end} ${topY}`
                    : `M 84 ${topY} L 154 ${base} H 485`
                }
                fill="none"
                stroke="#475569"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Start ball at height h */}
              <circle cx="84" cy={topY - 6} r="6" fill={blue} stroke="white" strokeWidth="1.5" />

              {row < 2 ? (
                <>
                  {/* End ball reaching same height h */}
                  <circle cx={item.end} cy={topY - 6} r="6" fill={orange} stroke="white" strokeWidth="1.5" />
                  <text x={item.end + 12} y={topY + 4} fill={orange} fontWeight="700" fontSize="13">
                    Đạt lại độ cao h
                  </text>
                </>
              ) : (
                <>
                  <circle cx="245" cy={base - 7} r="6" fill={green} stroke="white" strokeWidth="1.5" />
                  <Arrow x={256} y={base - 7} dx={82} color={green} label="v không đổi" offset={-9} />
                  <path d={`M 485 ${base} H 532`} stroke="#475569" strokeWidth="3" strokeDasharray="5 4" />
                </>
              )}
            </g>
          );
        })}
      </Diagram>

      {selected !== 'all' && (
        <output className="mt-2 block rounded-xl border border-blue-200 bg-blue-50/90 px-3 py-2 text-xs text-blue-950">
          <strong>Trường hợp ({cases[selected].tag}):</strong> {cases[selected].note}
        </output>
      )}
    </Figure>
  );
}
