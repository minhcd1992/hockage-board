'use client';

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';

const blue = '#2563eb', orange = '#c2410c', green = '#0f766e';
const number = (value: number) => Number(value.toFixed(2)).toLocaleString('vi-VN');
const buttonClass = 'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-blue-600';

function Figure({ id, title, children, caption }: { id: string; title: string; children: ReactNode; caption: string }) {
  return <figure data-figure={id} className="my-4 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm leading-snug sm:p-3">
    <div className="mb-2 font-bold text-slate-800">{title}</div>
    {children}
    <figcaption className="mt-1.5 text-xs leading-relaxed text-slate-600">
      <details><summary className="cursor-pointer py-1">Giả thiết và cách đọc hình</summary><div className="pt-1">{caption}</div></details>
    </figcaption>
  </figure>;
}

function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  const id = useId();
  return <div className="min-w-0">
    <label htmlFor={id} className="block text-xs font-semibold text-slate-700">{label}: {number(value)}</label>
    <input id={id} aria-label={label} className="mt-0.5 block h-4 w-full accent-blue-600" type="range" min={min} max={max} step={step} value={value}
      onChange={event => onChange(Number(event.target.value))} />
  </div>;
}

function Arrow({ x, y, dx, dy, color = blue, dashed = false, label, labelOffset }: { x: number; y: number; dx: number; dy: number; color?: string; dashed?: boolean; label?: string; labelOffset?: number }) {
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return null;
  const ux = dx / length, uy = dy / length;
  const endX = x + dx, endY = y + dy;
  const head = Math.min(8, length * 0.4);
  return <g data-vector={label}>
    <line x1={x} y1={y} x2={endX} y2={endY} stroke={color} strokeWidth="3" strokeDasharray={dashed ? '5 3' : undefined} />
    <path d={`M ${endX - ux * head - uy * head / 2} ${endY - uy * head + ux * head / 2} L ${endX} ${endY} L ${endX - ux * head + uy * head / 2} ${endY - uy * head - ux * head / 2}`} fill="none" stroke={color} strokeWidth="3" />
    {label && <text x={endX + (label.length > 5 ? 0 : dx < 0 ? -10 : 10)} y={endY + (labelOffset ?? (dy > 0 ? 18 : -9))} textAnchor={label.length > 5 ? 'middle' : dx < 0 ? 'end' : 'start'} fill={color} fontSize="17" fontWeight="bold" stroke="white" strokeWidth="4" paintOrder="stroke">{label}</text>}
  </g>;
}

// One clock per figure. Hidden or off-screen figures suspend animation work.
function useSimulationClock(duration: number, viewportRef: RefObject<HTMLDivElement | null>) {
  const [clock, setClock] = useState({ time: 0, playing: false });
  const [rate, setRate] = useState(0.5);
  useEffect(() => {
    if (!clock.playing) return;
    let visible = true, last = 0, frame = 0;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; last = 0; });
    if (viewportRef.current) observer.observe(viewportRef.current);
    const tick = (stamp: number) => {
      if (!visible || document.hidden) last = 0;
      else if (!last) last = stamp;
      else if (stamp - last >= 30) {
        const delta = Math.min((stamp - last) / 1000, 0.1) * rate;
        last = stamp;
        setClock(previous => {
          if (!previous.playing) return previous;
          const time = Math.min(duration, previous.time + delta);
          return { time, playing: time < duration };
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [clock.playing, duration, rate, viewportRef]);
  return {
    ...clock, rate, setRate,
    reset: () => setClock({ time: 0, playing: false }),
    pause: () => setClock(previous => ({ ...previous, playing: false })),
    seek: (progress: number) => setClock({ time: duration * progress / 100, playing: false }),
    toggle: () => setClock(previous => ({ time: previous.time >= duration ? 0 : previous.time, playing: !previous.playing })),
  };
}

function Playback({ clock, duration, label }: { clock: ReturnType<typeof useSimulationClock>; duration: number; label: string }) {
  return <div className="my-2 rounded-lg border border-slate-200 bg-white p-2">
    <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      <button type="button" data-action="play" aria-label={clock.playing ? 'Tạm dừng mô phỏng' : 'Chạy mô phỏng'} aria-pressed={clock.playing} onClick={clock.toggle} className={buttonClass}>{clock.playing ? 'Tạm dừng' : clock.time >= duration ? 'Chạy lại' : 'Chạy'}</button>
      <button type="button" data-action="reset" onClick={clock.reset} className={buttonClass}>Về đầu</button>
      <label className="text-xs text-slate-700">Tốc độ{' '}
        <select aria-label="Tốc độ phát" value={clock.rate} onChange={event => clock.setRate(Number(event.target.value))} className="rounded border border-slate-300 bg-white p-1">
          {[0.25, 0.5, 1, 2].map(rate => <option key={rate} value={rate}>{number(rate)}×</option>)}
        </select>
      </label>
      <span className="text-xs tabular-nums text-slate-600">t = {number(clock.time)} / {number(duration)} s</span>
    </div>
    <Slider label={label} value={clock.time / duration * 100} min={0} max={100} step={0.1} onChange={clock.seek} />
  </div>;
}

function VelocityVectors({ x, y, vx, vyScreen, scale, labels = true }: { x: number; y: number; vx: number; vyScreen: number; scale: number; labels?: boolean }) {
  const dx = vx * scale, dy = vyScreen * scale;
  const horizontalOnly = Math.abs(dy) < 0.01, verticalOnly = Math.abs(dx) < 0.01;
  return <g>
    <path d={`M ${x + dx} ${y} V ${y + dy} H ${x}`} stroke="#94a3b8" strokeDasharray="4 4" fill="none" />
    <Arrow x={x} y={y} dx={dx} dy={dy} color={green} label={labels ? horizontalOnly ? 'v′ = v′ₓ' : verticalOnly ? 'v′ = v′ᵧ' : 'v′' : undefined} labelOffset={dy < 0 ? -18 : 22} />
    <Arrow x={x} y={y} dx={dx} dy={0} color={blue} dashed label={labels && !horizontalOnly ? 'v′ₓ' : undefined} labelOffset={dy < 0 ? 22 : -12} />
    <Arrow x={x} y={y} dx={0} dy={dy} color={orange} dashed label={labels && !verticalOnly ? 'v′ᵧ' : undefined} />
    <circle cx={x} cy={y} r="4" fill="#334155" />
  </g>;
}

type ProjectileKind = 'horizontal' | 'oblique' | 'aid' | 'target';
type ReferenceFrame = 'ground' | 'moving' | 'custom' | 'falling';

function ProjectileSimulation({ kind }: { kind: ProjectileKind }) {
  const aid = kind === 'aid', oblique = kind === 'oblique', target = kind === 'target';
  const [height, setHeight] = useState(aid ? 490 : 20);
  const [speed, setSpeed] = useState(aid ? 50 : oblique || target ? 20 : 10);
  const [angle, setAngle] = useState(45);
  const [frame, setFrame] = useState<ReferenceFrame>('ground');
  const [observerSpeed, setObserverSpeed] = useState(10);
  const [showPath, setShowPath] = useState(true);
  const [zoom, setZoom] = useState(false);
  const g = aid ? 9.8 : 10;
  const radians = target ? Math.atan2(height, 30) : oblique ? angle * Math.PI / 180 : 0;
  const initialY = oblique || target ? 0 : height;
  const vx = speed * Math.cos(radians), vy0 = speed * Math.sin(radians);
  const flightTime = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * initialY)) / g;
  const meetingTime = target ? 30 / vx : Infinity;
  const targetFallTime = Math.sqrt(2 * height / g);
  const duration = target ? Math.min(meetingTime, targetFallTime, flightTime) : flightTime;
  const meets = target && meetingTime <= Math.min(targetFallTime, flightTime);
  const range = vx * flightTime, peak = vy0 * vy0 / (2 * g);
  const viewportRef = useRef<HTMLDivElement>(null);
  const clock = useSimulationClock(duration, viewportRef);
  const t = clock.time;
  const u = frame === 'moving' ? vx : frame === 'custom' ? observerSpeed : 0;
  const falling = frame === 'falling';
  const frameY = (at: number) => falling ? -g * at * at / 2 : 0;
  const point = (at: number) => ({ x: (vx - u) * at, y: initialY + vy0 * at - g * at * at / 2 - frameY(at) });
  const current = point(t);
  const relativeVx = vx - u, relativeVyUp = vy0 - g * t + (falling ? g * t : 0);
  const ySign = oblique || target ? 1 : -1;
  const relativeVy = ySign * relativeVyUp;
  const relativeY = ySign * (current.y - initialY);
  const samples = Array.from({ length: 81 }, (_, i) => point(duration * i / 80));
  // Trajectory samples use the observer at their own time, scenery at the current time.
  // A fixed viewport for each run uses the same spatial scale on both axes.
  const bounds = [...samples, { x: 0, y: 0 }, { x: -u * duration, y: -frameY(duration) }];
  if (target) bounds.push({ x: 30, y: height }, { x: 30 - u * duration, y: height - g * duration * duration / 2 - frameY(duration) });
  if (aid) bounds.push({ x: vx * duration, y: height }, { x: (vx - u) * duration, y: height });
  const minX = Math.min(...bounds.map(p => p.x)), maxX = Math.max(...bounds.map(p => p.x));
  const minY = Math.min(...bounds.map(p => p.y)), maxY = Math.max(...bounds.map(p => p.y));
  const scale = Math.min(490 / Math.max(10, maxX - minX), 240 / Math.max(10, maxY - minY));
  const px = (x: number) => 135 + (x - minX) * scale;
  const py = (y: number) => 335 - (y - minY) * scale;
  const rawTick = 90 / scale;
  const tickPower = 10 ** Math.floor(Math.log10(rawTick));
  const tickStep = ([1, 2, 5, 10].find(step => step * tickPower >= rawTick) ?? 10) * tickPower;
  const firstTick = Math.floor((minX + u * t - 110 / scale) / tickStep) * tickStep;
  const path = (until: number) => Array.from({ length: 81 }, (_, i) => {
    const p = point(until * i / 80);
    return `${i ? 'L' : 'M'} ${px(p.x)} ${py(p.y)}`;
  }).join(' ');
  const maxVelocity = Math.hypot(Math.abs(vx - u), Math.max(vy0, Math.abs(vy0 - g * duration))) || 1;
  const vectorScale = 74 / maxVelocity;
  const id = aid ? '4.7' : oblique ? '4.4' : target ? '4.6' : '4.3';
  const title = aid ? 'Thả hàng cứu trợ' : oblique ? 'Khám phá ném xiên' : target ? 'Vật phóng và mục tiêu cùng rơi' : 'So sánh thả rơi và ném ngang';
  const change = (setter: (value: number) => void) => (value: number) => { clock.reset(); setter(value); };
  const frameName = frame === 'ground' ? 'Mặt đất' : frame === 'moving' ? (aid ? 'Máy bay' : 'Chuyển động ngang cùng v₀ₓ') : frame === 'falling' ? 'Cùng rơi tự do' : 'Người quan sát tùy chỉnh';
  return <Figure id={id} title={`Mô phỏng ${id}. ${title}`} caption={`Bỏ qua lực cản; g = ${number(g)} m/s². ${ySign > 0 ? 'Oy hướng lên.' : 'Gốc tọa độ ở độ cao thả, Oy hướng xuống.'} Mũi tên vận tốc dùng thang riêng với khoảng cách. Thang hình và vectơ giữ cố định theo thời gian, tự điều chỉnh khi đổi tham số hoặc hệ quy chiếu. Khi kết thúc, vận tốc là giá trị ngay trước va chạm.`}>
    <div ref={viewportRef} data-simulation={kind} data-time={t} data-playing={clock.playing} data-frame={frame} data-vx={relativeVx} data-vy={relativeVy} data-x={current.x} data-y={relativeY} data-duration={duration}>
      <div className="grid items-start gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))' }}>
      <div className="min-w-0">
      <div className="grid grid-cols-2 gap-2">
        {!oblique && <Slider label={target ? 'Độ cao mục tiêu H (m)' : 'Độ cao h (m)'} value={height} min={aid ? 100 : 10} max={aid ? 800 : 80} onChange={change(setHeight)} />}
        <Slider label="Tốc độ ném v₀ (m/s)" value={speed} min={aid ? 20 : 5} max={aid ? 100 : 40} onChange={change(setSpeed)} />
        {oblique && <Slider label="Góc ném α (độ)" value={angle} min={15} max={75} onChange={change(setAngle)} />}
      </div>
      <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-indigo-950"><span className="shrink-0">Hệ quy chiếu</span>
          <select aria-label="Hệ quy chiếu" value={frame} onChange={event => { clock.pause(); setFrame(event.target.value as ReferenceFrame); }} className="min-w-0 flex-1 rounded border border-indigo-200 bg-white p-1 text-slate-800">
            <option value="ground">Mặt đất</option>
            <option value="moving">{aid ? 'Máy bay (chuyển động ngang đều)' : 'Chuyển động ngang cùng v₀ₓ'}</option>
            <option value="custom">Người quan sát tùy chỉnh</option>
            {target && <option value="falling">Cùng rơi tự do (hệ có gia tốc)</option>}
          </select>
        </label>
        {frame === 'custom' && <div className="mt-1.5"><Slider label="Vận tốc hệ U (m/s)" value={observerSpeed} min={-100} max={100} onChange={value => { clock.pause(); setObserverSpeed(value); }} /></div>}
        <div className="mt-1 text-xs text-indigo-950">{falling ? 'Hệ rơi tự do · a′ᵧ = 0' : `U = ${number(u)} m/s · g = ${number(g)} m/s²`} · Oy {ySign > 0 ? '↑' : '↓'}</div>
      </div>
      <Playback clock={clock} duration={duration} label={oblique || target ? 'Tiến trình bay (%)' : 'Tiến trình rơi (%)'} />
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs text-slate-700"><input type="checkbox" checked={showPath} onChange={event => setShowPath(event.target.checked)} />Quỹ đạo dự đoán</label>
        <button type="button" aria-pressed={zoom} onClick={() => setZoom(!zoom)} className={buttonClass}>{zoom ? 'Thu gọn hình' : 'Phóng to hình'}</button>
      </div>
      {zoom && <div className="mb-2 text-xs text-slate-600">Cuộn ngang trong khung để xem toàn bộ hình phóng to.</div>}
      </div>
      <div className="min-w-0">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <svg viewBox="0 0 760 480" role="img" aria-label={`${title} trong hệ ${frameName}: quỹ đạo, cảnh nền và các vectơ vận tốc`} className={zoom ? 'block w-full min-w-[900px]' : 'mx-auto block w-full'} style={zoom ? undefined : { maxHeight: 'min(45svh, 320px)' }}>
          <text x="20" y="26" fontSize="17" fontWeight="bold" fill="#334155">{frameName} · t = {number(t)} s</text>
          <line x1="25" x2="735" y1={py(-frameY(t))} y2={py(-frameY(t))} stroke={green} strokeWidth="3" />
          {Array.from({ length: 10 }, (_, i) => {
            const worldX = firstTick + i * tickStep;
            const x = px(worldX - u * t);
            return x > 30 && x < 710 ? <g key={i}>
              <path d={`M ${x} ${py(-frameY(t))} l -10 12`} stroke="#94a3b8" />
              <text x={x} y={py(-frameY(t)) + 29} textAnchor="middle" fontSize="13" fill="#64748b">{number(worldX)} m</text>
            </g> : null;
          })}
          <text x="25" y="460" fill="#64748b" fontSize="14">Các mốc có số gắn với mặt đất; trục x′, y′ gắn với người quan sát.</text>
          <Arrow x={px(0)} y={py(initialY)} dx={60} dy={0} color="#64748b" />
          <Arrow x={px(0)} y={py(initialY)} dx={0} dy={-ySign * 60} color="#64748b" />
          <text x={px(0) + 64} y={py(initialY) + 6} fontSize="15" fill="#475569">x′</text>
          <text x={px(0) - 22} y={py(initialY) - ySign * 65} fontSize="15" fill="#475569">y′</text>
          {showPath && <path data-trajectory="predicted" d={path(duration)} fill="none" stroke={blue} strokeWidth="2" strokeDasharray="5 5" opacity="0.45" />}
          <path data-trajectory="trail" d={path(t)} fill="none" stroke={blue} strokeWidth="3" />
          {kind === 'horizontal' && <g>
            <line x1={px(-u * t)} x2={px(current.x)} y1={py(current.y)} y2={py(current.y)} stroke="#94a3b8" strokeDasharray="4 4" />
            <circle cx={px(-u * t)} cy={py(height - g * t * t / 2)} r="7" fill={orange} />
            <text x={px(-u * t) - 12} y={py(current.y) - 12} fill={orange} fontSize="16" textAnchor="end">A: thả rơi</text>
          </g>}
          {target && <g data-target-x={30 - u * t} data-target-y={height - g * t * t / 2 - frameY(t)}>
            <path d={`M ${px(-u * t)} ${py(-frameY(t))} L ${px(30 - u * t)} ${py(height - frameY(t))}`} stroke="#94a3b8" strokeDasharray="5 5" fill="none" />
            <circle cx={px(30 - u * t)} cy={py(height - g * t * t / 2 - frameY(t))} r="10" fill={orange} />
            <text x={px(30 - u * t) + 14} y={py(height - g * t * t / 2 - frameY(t)) - 14} fontSize="16" fill={orange}>Mục tiêu</text>
          </g>}
          {aid && <g>
            <g data-plane-x={(vx - u) * t} transform={`translate(${px((vx - u) * t)},${py(height) - 22})`}>
              <path d="M -24 0 H 24 L 12 -6 H -2 L -9 -20 H -16 L -12 -6 H -23 Z M -2 0 L -12 14 H -20 L -13 0" fill="#475569" />
              <text x="30" y="0" fontSize="15" fill="#475569">Máy bay</text>
            </g>
            <path d={`M ${px(range - u * t)} ${py(0)} v -25 h 18 l -6 6 l 6 6 h -18`} fill="#fbbf24" stroke="#a16207" strokeWidth="2" />
            <text x={px(range - u * t)} y={py(0) + 49} textAnchor="middle" fontSize="16" fill={green}>Mốc nhận hàng</text>
          </g>}
          <VelocityVectors x={px(current.x)} y={py(current.y)} vx={relativeVx} vyScreen={-relativeVyUp} scale={vectorScale} />
          {aid ? <rect x={px(current.x) - 7} y={py(current.y) - 7} width="14" height="14" fill={blue} stroke="white" strokeWidth="2" /> : <circle cx={px(current.x)} cy={py(current.y)} r="7" fill={blue} stroke="white" strokeWidth="2" />}
        </svg>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        <details className="order-2 text-xs text-slate-700">
          <summary className="cursor-pointer py-1 font-semibold">Phân tích vectơ và hệ quy chiếu</summary>
          <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2">
          <svg viewBox="0 0 340 230" className="mx-auto w-full max-w-sm" role="img" aria-label={`Vectơ vận tốc: thành phần ngang ${number(relativeVx)}, thành phần đứng ${number(relativeVy)}, độ lớn ${number(Math.hypot(relativeVx, relativeVy))} mét trên giây`}>
            <line x1="15" x2="325" y1="110" y2="110" stroke="#e2e8f0" />
            <line x1="145" x2="145" y1="10" y2="215" stroke="#e2e8f0" />
            <VelocityVectors x={145} y={110} vx={relativeVx} vyScreen={-relativeVyUp} scale={85 / maxVelocity} />
            {Math.abs(relativeVx) < 1e-8 && <text x="15" y="210" fill={blue} fontSize="16">v′ₓ = 0</text>}
            {Math.abs(relativeVy) < 1e-8 && <text x="190" y="210" fill={orange} fontSize="16">v′ᵧ = 0</text>}
          </svg>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold"><span style={{ color: blue }}>Ngang v′ₓ</span><span style={{ color: orange }}>Đứng v′ᵧ</span><span style={{ color: green }}>Tổng hợp v′</span></div>
          <p className="!mb-0 text-xs text-slate-600">Nét đứt là thành phần. Khi một thành phần bằng 0, vectơ tổng hợp trùng thành phần còn lại.</p>
          <p className="!mb-0 text-xs text-indigo-950">{falling
            ? 'Gốc hệ cùng rơi từ trạng thái nghỉ: y′ = y + ½gt², v′ᵧ = vᵧ + gt, a′ᵧ = 0. Mục tiêu đứng yên, mặt đất đi lên.'
            : `x′ = x − Ut; v′ₓ = vₓ − U; v′ᵧ = vᵧ. U = ${number(u)} m/s; gia tốc trọng trường không đổi. Dấu phẩy chỉ đại lượng trong hệ đang chọn.`}</p>
          {frame === 'moving' && <p className="!mb-0">Vận tốc ngang tương đối bằng 0: vật chuyển động theo đường thẳng đứng. Mặt đất và các mốc đi về phía sau.</p>}
          {frame === 'custom' && u > vx && <p className="!mb-0">Người quan sát đi nhanh hơn vật theo phương ngang, nên v′ₓ âm và vật chuyển động về phía sau.</p>}
        </div>
        </details>
        <output className="order-1 block rounded-lg bg-blue-100 p-2 text-xs leading-snug text-blue-950">
          <div className="flex flex-wrap gap-x-3 gap-y-1 font-semibold">
            <span style={{ color: blue }}>v′ₓ = {number(relativeVx)} m/s</span>
            <span style={{ color: orange }}>v′ᵧ = {number(relativeVy)} m/s</span>
            <strong style={{ color: green }}>|v′| = {number(Math.hypot(relativeVx, relativeVy))} m/s</strong>
          </div>
          <div className="my-1">x′ = {number(current.x)} m · y′ = {number(relativeY)} m</div>
          {target ? <>{meets ? `Hai vật gặp nhau ở t = ${number(duration)} s, độ cao ${number(height - g * duration * duration / 2)} m so với đất.` : 'Tốc độ chưa đủ: một vật chạm đất trước thời điểm gặp dự kiến. Mô phỏng dừng ở va chạm đầu tiên.'}</> : oblique ? <>
            Trong hệ mặt đất: T = {number(duration)} s · H = {number(peak)} m · L = {number(range)} m.
            {angle === 45 && ` Góc 45° cho tầm xa lớn nhất: ${number(range)} m.`}
            {Math.abs(t - duration / 2) < 0.001 && ' Tại đỉnh: vᵧ = 0, nhưng gia tốc vẫn hướng xuống.'}
          </> : <>Thời gian chạm đất = {number(duration)} s · Tầm xa = {number(range)} m (so với mặt đất).{kind === 'horizontal' && t >= duration && ' Hai vật chạm đất đồng thời.'}</>}
        </output>
      </div>
      </div>
      </div>
    </div>
  </Figure>;
}

export function HorizontalThrow() { return <ProjectileSimulation kind="horizontal" />; }
export function ObliqueThrow() { return <ProjectileSimulation kind="oblique" />; }
export function AidDrop() { return <ProjectileSimulation kind="aid" />; }
export function FallingTarget() { return <ProjectileSimulation kind="target" />; }

// Illustrative linear drag: dv/dt = g(1 - v/v_terminal).
function dropState(t: number, terminal: number) {
  return terminal === Infinity
    ? { distance: 5 * t * t, velocity: 10 * t }
    : { distance: terminal * t - terminal * terminal / 10 * (-Math.expm1(-10 * t / terminal)), velocity: terminal * (-Math.expm1(-10 * t / terminal)) };
}

function dropTime(height: number, terminal: number) {
  let lo = 0, hi = height / (terminal === Infinity ? 1 : terminal) + Math.sqrt(height / 5) + 10;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (dropState(mid, terminal).distance < height) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function DropSimulation({ kind }: { kind: 'air' | 'free' | 'galileo' }) {
  const [height, setHeight] = useState(20);
  const [vacuum, setVacuum] = useState(false);
  const air = kind === 'air', free = kind === 'free';
  const objects = air
    ? [{ label: 'Giấy', terminal: vacuum ? Infinity : 4, color: blue }, { label: 'Đá', terminal: vacuum ? Infinity : 30, color: orange }]
    : free ? [{ label: 'Vật rơi', terminal: Infinity, color: blue }]
      : [{ label: 'A · 10 kg', terminal: Infinity, color: blue }, { label: 'B · 1 kg', terminal: Infinity, color: orange }, { label: 'A + B · 11 kg', terminal: Infinity, color: green }];
  const times = objects.map(object => dropTime(height, object.terminal));
  const duration = Math.max(...times);
  const viewportRef = useRef<HTMLDivElement>(null);
  const clock = useSimulationClock(duration, viewportRef);
  const id = air ? '4.1' : free ? '4.2' : '4.5';
  return <Figure id={id} title={`Mô phỏng ${id}. ${air ? 'Vai trò của không khí' : free ? 'Vận tốc tăng, gia tốc không đổi' : 'So sánh hai vật và hệ buộc chung'}`} caption={air
    ? 'Mô hình minh họa lực cản tuyến tính theo vận tốc, không mô tả sự chao đảo của giấy. Tốc độ tới hạn giả định: giấy 4 m/s, đá 30 m/s. Trong chân không, bỏ lực cản: cả hai có cùng g = 10 m/s².'
    : 'Bỏ qua lực cản, g = 10 m/s². Gốc tại điểm thả, Oy hướng xuống. Vận tốc v = vᵧ; vₓ = 0. Sau khi chạm đất vật được giữ đứng yên; không mô phỏng va chạm.'}>
    <div ref={viewportRef} data-simulation={kind} data-time={clock.time} data-playing={clock.playing}>
      <Slider label="Độ cao h (m)" value={height} min={10} max={50} onChange={value => { clock.reset(); setHeight(value); }} />
      {air && <label className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={vacuum} onChange={event => { clock.reset(); setVacuum(event.target.checked); }} />Chân không — bỏ lực cản không khí</label>}
      {kind === 'galileo' && <div className="mt-1.5 text-xs text-slate-700">So sánh A (10 kg), B (1 kg) và hệ A + B (11 kg) khi chỉ có trọng lực.</div>}
      <Playback clock={clock} duration={duration} label="Tiến trình rơi (%)" />
      <div className="overflow-x-auto rounded-lg bg-white">
        <svg viewBox="0 0 620 420" role="img" aria-label="Các vật rơi theo thời gian, có vectơ vận tốc và vị trí ở những thời điểm cách đều" className="mx-auto block w-full" style={{ maxHeight: 'min(38svh, 280px)' }}>
          <path d="M 40 65 H 580 M 40 315 H 580" stroke="#94a3b8" strokeDasharray="4 4" />
          <text x="20" y="30" fontSize="16" fill="#475569">{air ? vacuum ? 'Chân không' : 'Không khí' : 'Chỉ có trọng lực'} · t = {number(clock.time)} s</text>
          <text x="20" y="346" fontSize="15" fill="#475569">Mặt đất · h = {height} m</text>
          {objects.map((object, index) => {
            const landed = clock.time >= times[index] - 1e-8;
            const state = dropState(Math.min(clock.time, times[index]), object.terminal);
            const x = free ? 260 : 140 + index * (360 / Math.max(1, objects.length - 1));
            const y = 65 + Math.min(height, state.distance) * 250 / height;
            const velocity = landed ? 0 : state.velocity;
            return <g key={object.label} data-drop={index} data-landed={landed}>
              {Array.from({ length: 6 }, (_, i) => i * times[index] / 5).filter(t => t <= clock.time).map(t => <circle key={t} cx={x} cy={65 + Math.min(height, dropState(t, object.terminal).distance) * 250 / height} r="4" fill={object.color} opacity="0.25" />)}
              <text x={x} y="52" textAnchor="middle" fill={object.color} fontSize="17" fontWeight="bold">{object.label}</text>
              <circle cx={x} cy={y} r="9" fill={object.color} />
              <Arrow x={x + 15} y={y} dx={0} dy={velocity * 60 / Math.sqrt(20 * height)} color={green} label="v" />
              {free && !landed && <Arrow x={x + 110} y={y} dx={0} dy={32} color={orange} label="g" />}
              <text x={x} y="378" textAnchor="middle" fontSize="15" fill="#334155">v = {number(velocity)} m/s</text>
              <text x={x} y="402" textAnchor="middle" fontSize="14" fill="#64748b">Chạm đất: {number(times[index])} s</text>
            </g>;
          })}
        </svg>
      </div>
      <output className="mt-2 block rounded-lg bg-blue-100 p-2 text-xs text-blue-950">{air && !vacuum
        ? 'Lực cản làm hai vật có thời gian rơi khác nhau. Bật “Chân không” để so sánh.'
        : free ? 'Các dấu mờ ứng với những khoảng thời gian bằng nhau: càng về sau quãng đường càng lớn. Khi còn rơi, vận tốc tăng nhưng gia tốc g không đổi.'
          : 'Các vật chạm đất đồng thời dù khối lượng khác nhau. Mô hình lý tưởng này minh họa kết quả khi chỉ có trọng lực.'}</output>
    </div>
  </Figure>;
}

export function AirResistance() { return <DropSimulation kind="air" />; }
export function FreeFallVectors() { return <DropSimulation kind="free" />; }
export function GalileoParadox() { return <DropSimulation kind="galileo" />; }
