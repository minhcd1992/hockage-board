'use client';

import { useEffect, useRef, useState } from 'react';
import { cancelLessonFrame, requestLessonFrame } from '@/lib/lessonAnimation';
import { Arrow, Diagram, Figure, Readout, Slider, G, activePreset, blue, green, number, orange, presetClass, purple, red, slate } from '@/components/lesson/FigureKit';

/* ------------------------------------------------------------------ */
/* Mô phỏng 10.1 — Vật trượt trên máng: chuyển hóa Wđ ⇄ Wt             */
/* ------------------------------------------------------------------ */

// Track height (m) as a function of horizontal position x (m), 0 ≤ x ≤ 40.
// Left start at 20 m, a 12 m bump in the middle, and a right wall rising to 24 m.
const trackY = (x: number) => 20 * Math.exp(-(x * x) / 50) + 12 * Math.exp(-((x - 20) ** 2) / 20) + 24 * Math.exp(-((x - 40) ** 2) / 50);
const slope = (x: number) => (trackY(x + 1e-3) - trackY(x - 1e-3)) / 2e-3;

export function EnergyTrack() {
  const m = 50;
  const [cr, setCr] = useState(0); // resistive force as a fraction of weight
  const [state, setState] = useState({ x: 0.5, v: 0, heat: 0, t: 0 });
  const [playing, setPlaying] = useState(false);
  const ref = useRef(state);
  const W0 = m * G * trackY(0.5);

  useEffect(() => {
    if (!playing) return;
    let last: number | null = null, id = 0;
    const step = (now: number) => {
      if (last !== null) {
        let { x, v, heat, t } = ref.current;
        let dtLeft = Math.min((now - last) / 1000, 0.05);
        while (dtLeft > 0) {
          const dt = Math.min(dtLeft, 0.002);
          dtLeft -= dt;
          const s = slope(x), cosT = 1 / Math.sqrt(1 + s * s), sinT = s * cosT;
          // speed along the track; x-velocity = v·cosθ
          const drive = -G * sinT;
          const resist = cr * G * cosT; // F_c = cr·mg·cosθ (like friction)
          const aT = Math.abs(v) < 1e-3 && Math.abs(drive) <= resist ? -v / dt : drive - Math.sign(v || drive) * resist;
          const vNew = v + aT * dt;
          const dx = ((v + vNew) / 2) * dt * cosT;
          heat += resist * m * Math.abs(((v + vNew) / 2) * dt);
          v = vNew; x += dx; t += dt;
          if (x < 0) { x = 0; v = Math.abs(v); }
          if (x > 40) { x = 40; v = -Math.abs(v); }
        }
        ref.current = { x, v, heat, t };
        setState(ref.current);
        if (cr > 0 && Math.abs(v) < 0.02 && Math.abs(slope(x)) < cr + 0.02 && t > 1) { setPlaying(false); return; }
      }
      last = now;
      id = requestLessonFrame(step);
    };
    id = requestLessonFrame(step);
    return () => cancelLessonFrame(id);
  }, [playing, cr]);

  const reset = () => { setPlaying(false); ref.current = { x: 0.5, v: 0, heat: 0, t: 0 }; setState(ref.current); };
  const z = trackY(state.x);
  const Wt = m * G * z, Wd = 0.5 * m * state.v * state.v;
  const px = (x: number) => 30 + x * 12.5, py = (y: number) => 200 - y * 8;
  const path = Array.from({ length: 161 }, (_, i) => { const x = (40 * i) / 160; return `${px(x)},${py(trackY(x))}`; }).join(' ');
  const bar = (val: number) => (130 * val) / W0;

  return (
    <Figure id="10.1" badge="Mô phỏng" title="Mô phỏng 10.1 · Vật trượt trên máng — động năng và thế năng"
      caption="Vật 50 kg thả không vận tốc đầu từ đỉnh trái (cao 20 m); mốc thế năng ở mặt đất (đường ngang dưới cùng). Khi không có lực cản, cơ năng W = Wđ + Wt không đổi: vật vượt qua gò giữa và lên tới đúng độ cao 20 m ở sườn phải rồi quay lại. Khi có lực cản, một phần cơ năng chuyển thành nhiệt (cột cam); vật lên thấp dần, có thể không vượt được gò giữa, rồi dừng ở đáy một thung lũng.">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPlaying(p => !p)} className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">{playing ? 'Tạm dừng' : 'Thả vật'}</button>
          <button type="button" onClick={reset} className={presetClass}>Về đầu</button>
          {[0, 0.05, 0.15].map(c => <button key={c} type="button" onClick={() => { reset(); setCr(c); }} className={`${presetClass} ${cr === c ? activePreset : ''}`}>{c === 0 ? 'Không lực cản' : `Lực cản ${c * 100}% áp lực`}</button>)}
        </div>
      </div>
      <Diagram label={`Vật ở độ cao ${number(z, 1)} m, tốc độ ${number(Math.abs(state.v), 1)} m/s.`} height={240}>
        <polyline points={path} fill="none" stroke="#475569" strokeWidth="3" />
        <line x1={px(0)} y1={py(20)} x2={px(40)} y2={py(20)} stroke="#cbd5e1" strokeDasharray="5 4" />
        <text x={px(40)} y={py(20) - 4} textAnchor="end" fontSize="11" fill={slate}>độ cao thả 20 m</text>
        <line x1={px(0)} y1={py(0)} x2={px(40)} y2={py(0)} stroke="#cbd5e1" />
        <text x={px(0)} y={py(0) + 14} fontSize="11" fill={slate}>mốc z = 0</text>
        <circle cx={px(state.x)} cy={py(z) - 7} r="7" fill={blue} stroke="white" strokeWidth="2" />
        {[['Wđ', Wd, green], ['Wt', Wt, blue], ['Nhiệt', state.heat, orange], ['W', Wd + Wt, purple]].map(([lbl, val, col], i) => (
          <g key={lbl as string}>
            <rect x={540 - (4 - i) * 26} y={200 - bar(val as number)} width="18" height={bar(val as number)} fill={col as string} />
            <text x={549 - (4 - i) * 26} y="216" textAnchor="middle" fontSize="11" fill="#334155">{lbl as string}</text>
          </g>
        ))}
      </Diagram>
      <Readout items={[['Wđ', `${number(Wd / 1000, 2)} kJ`], ['Wt', `${number(Wt / 1000, 2)} kJ`], ['Cơ năng W', `${number((Wd + Wt) / 1000, 2)} kJ`], ['Đã thành nhiệt', `${number(state.heat / 1000, 2)} kJ`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 10.2 — Chọn mốc thế năng                                   */
/* ------------------------------------------------------------------ */

const levels = [
  { key: 'yard', label: 'Sân trường', z: 0 },
  { key: 'floor', label: 'Sàn nhà', z: 3 },
  { key: 'table', label: 'Mặt bàn', z: 4.2 },
];

export function ReferenceLevel() {
  const [ref0, setRef0] = useState('floor');
  const m = 0.5;
  const zRef = levels.find(l => l.key === ref0)!.z;
  const zA = 4.2, zB = 3; // table top, floor (heights above the yard)
  const WtA = m * G * (zA - zRef), WtB = m * G * (zB - zRef);
  const py = (z: number) => 210 - z * 40;
  return (
    <Figure id="10.2" badge="Mô phỏng" title="Mô phỏng 10.2 · Đổi mốc thế năng"
      caption="Viên bi 0,5 kg rơi từ mặt bàn (A) xuống sàn nhà (B); sàn nhà cao hơn sân trường 3,0 m, mặt bàn cao hơn sàn 1,2 m. Đổi mốc thì thế năng tại từng điểm thay đổi (có thể âm), nhưng hiệu thế năng W_tA − W_tB, tức công của trọng lực, không đổi.">
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5">
        <span className="text-xs font-semibold text-slate-600">Chọn mốc:</span>
        {levels.map(l => <button key={l.key} type="button" onClick={() => setRef0(l.key)} className={`${presetClass} ${l.key === ref0 ? activePreset : ''}`}>{l.label}</button>)}
      </div>
      <Diagram label={`Mốc tại ${levels.find(l => l.key === ref0)!.label}.`} height={230}>
        <rect x="40" y={py(3)} width="260" height={py(0) - py(3)} fill="#f1f5f9" stroke="#94a3b8" />
        <text x="50" y={py(1.5)} fontSize="12" fill={slate}>tầng 1</text>
        <line x1="20" y1={py(0)} x2="540" y2={py(0)} stroke="#475569" strokeWidth="3" />
        <rect x="170" y={py(4.2)} width="90" height="8" fill="#92400e" />
        <line x1="180" y1={py(4.2)} x2="180" y2={py(3)} stroke="#92400e" strokeWidth="4" /><line x1="250" y1={py(4.2)} x2="250" y2={py(3)} stroke="#92400e" strokeWidth="4" />
        <circle cx="215" cy={py(4.2) - 8} r="8" fill={blue} />
        <text x="232" y={py(4.2) - 8} fontSize="13" fontWeight="700">A</text>
        <circle cx="300" cy={py(3) - 8} r="8" fill={blue} opacity="0.5" />
        <text x="314" y={py(3) - 8} fontSize="13" fontWeight="700">B</text>
        <line x1="20" y1={py(zRef)} x2="540" y2={py(zRef)} stroke={red} strokeWidth="2" strokeDasharray="6 4" />
        <text x="536" y={py(zRef) - 6} textAnchor="end" fontSize="12" fontWeight="700" fill={red}>mốc z = 0</text>
        <text x="380" y="40" fontSize="13" fill="#334155">W_tA = {number(WtA, 1)} J</text>
        <text x="380" y="62" fontSize="13" fill="#334155">W_tB = {number(WtB, 1)} J</text>
        <text x="380" y="88" fontSize="13" fontWeight="700" fill={green}>W_tA − W_tB = {number(WtA - WtB, 1)} J</text>
      </Diagram>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 10.3 — Con lắc vướng đinh (Galileo)                        */
/* ------------------------------------------------------------------ */

export function GalileoNail() {
  const L = 1.0, alpha0 = 60;
  const [nail, setNail] = useState(0.4); // distance from pivot to nail (m)
  const h = L * (1 - Math.cos((alpha0 * Math.PI) / 180)); // 0,5 m
  const r = L - nail;
  const k = 150; // px per metre
  const ox = 280, oy = 30; // pivot
  const low = { x: ox, y: oy + L * k };
  const nx = ox, ny = oy + nail * k;
  const reaches = h <= r + 1e-9;
  // Highest point on the small circle if it reaches h, else the slack point (T = 0) at y_s = (2h + r)/3.
  const yEnd = reaches ? h : (2 * h + r) / 3;
  const cosPhi = 1 - yEnd / r;
  const phi = Math.acos(Math.max(-1, Math.min(1, cosPhi)));
  const end = { x: nx + r * k * Math.sin(phi), y: ny + r * k * Math.cos(phi) };
  const arc = Array.from({ length: 41 }, (_, i) => { const p = (phi * i) / 40; return `${nx + r * k * Math.sin(p)},${ny + r * k * Math.cos(p)}`; }).join(' ');
  const start = { x: ox - L * k * Math.sin((alpha0 * Math.PI) / 180), y: oy + L * k * Math.cos((alpha0 * Math.PI) / 180) };
  const bigArc = Array.from({ length: 41 }, (_, i) => { const p = (alpha0 * Math.PI / 180) * (1 - i / 40); return `${ox - L * k * Math.sin(p)},${oy + L * k * Math.cos(p)}`; }).join(' ');
  // Projectile after slack: velocity tangent to circle at angle phi.
  let proj = '', yMax = yEnd;
  if (!reaches) {
    const vs = Math.sqrt(2 * G * (h - yEnd));
    const vx = vs * Math.cos(phi), vy = vs * Math.sin(phi); // tangent of the CCW motion (x right, y up)
    yMax = yEnd + (vy * vy) / (2 * G);
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = ((2 * vy) / G) * (i / 40) * 0.6;
      const x = end.x + vx * t * k, y = end.y - (vy * t - 0.5 * G * t * t) * k;
      pts.push(`${x},${y}`);
    }
    proj = pts.join(' ');
  }
  const hLine = low.y - h * k;

  return (
    <Figure id="10.3" badge="Mô phỏng" title="Mô phỏng 10.3 · Con lắc vướng đinh — khi nào bi lên lại đúng độ cao ban đầu?"
      caption={`Dây dài 1,0 m, thả từ góc 60° (bi cao hơn điểm thấp nhất h = 0,5 m). Đinh đặt dưới điểm treo một khoảng tùy chọn, nên bán kính quay mới là r′ = L − (khoảng cách đinh). Nếu h ≤ r′ (bi không lên quá mức ngang đinh), bi lên lại đúng độ cao h. Nếu h > r′, dây chùng ở độ cao (2h + r′)/3 và bi bay theo parabol, không đạt độ cao h.`}>
      <div className="rounded-xl border border-slate-200 bg-white p-2.5">
        <Slider label="Khoảng cách từ điểm treo đến đinh" value={nail} min={0.1} max={0.8} step={0.05} unit="m" onChange={setNail} />
      </div>
      <Diagram label={reaches ? 'Bi lên lại đúng độ cao ban đầu.' : 'Dây chùng, bi không đạt độ cao ban đầu.'} height={220}>
        <line x1="200" y1={oy} x2="360" y2={oy} stroke="#475569" strokeWidth="3" />
        <line x1="40" y1={hLine} x2="540" y2={hLine} stroke={green} strokeDasharray="6 4" />
        <text x="536" y={hLine - 4} textAnchor="end" fontSize="11" fill={green}>độ cao thả h = 0,5 m</text>
        <polyline points={bigArc} fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <polyline points={arc} fill="none" stroke={reaches ? green : orange} strokeWidth="2.5" />
        {!reaches && <polyline points={proj} fill="none" stroke={red} strokeWidth="2" strokeDasharray="4 3" />}
        <line x1={ox} y1={oy} x2={nx} y2={ny} stroke="#475569" strokeWidth="1.5" />
        <line x1={nx} y1={ny} x2={end.x} y2={end.y} stroke="#475569" strokeWidth="1.5" strokeDasharray={reaches ? undefined : '3 3'} />
        <circle cx={nx} cy={ny} r="4" fill="#0f172a" />
        <text x={nx - 8} y={ny + 4} textAnchor="end" fontSize="12">đinh</text>
        <circle cx={start.x} cy={start.y} r="7" fill={blue} opacity="0.5" />
        <circle cx={end.x} cy={end.y} r="7" fill={reaches ? green : orange} />
        <text x="40" y="40" fontSize="14" fontWeight="700" fill={reaches ? green : red}>{reaches ? 'Bi lên lại đúng độ cao h' : 'Dây chùng — bi không lên tới h'}</text>
      </Diagram>
      <Readout items={[['r′ = L − OO′', `${number(r)} m`], ['h', `${number(h)} m`], [reaches ? 'Độ cao đạt được' : 'Dây chùng ở độ cao', `${number(yEnd, 3)} m`], ['Độ cao lớn nhất', `${number(yMax, 3)} m`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Hình tĩnh                                                           */
/* ------------------------------------------------------------------ */

export function CoasterExample() {
  return (
    <Figure id="10.4" title="Hình 10.4 · Toa tàu trượt từ A qua B lên C (Ví dụ 1)"
      caption="Bỏ qua ma sát; phản lực của đường ray luôn vuông góc với quỹ đạo nên không sinh công. Chỉ trọng lực sinh công, nên cơ năng tại A, B, C bằng nhau. Mốc thế năng ở mặt đất.">
      <Diagram label="Đường ray qua A, B, C." height={220}>
        <path d="M 60 40 C 140 40, 160 190, 240 190 C 300 190, 330 110, 380 110 C 430 110, 460 190, 530 190" fill="none" stroke="#475569" strokeWidth="3" />
        <line x1="20" y1="190" x2="540" y2="190" stroke="#94a3b8" />
        <circle cx="60" cy="40" r="6" fill={blue} /><text x="70" y="36" fontSize="13" fontWeight="700">A (45 m, v = 0)</text>
        <circle cx="240" cy="190" r="6" fill={blue} /><text x="232" y="210" fontSize="13" fontWeight="700">B (0 m)</text>
        <circle cx="380" cy="110" r="6" fill={blue} /><text x="390" y="100" fontSize="13" fontWeight="700">C (20 m)</text>
        <Arrow x={380} y={110} dx={0} dy={50} color={slate} label="P" offset={14} labelDx={10} />
        <Arrow x={380} y={110} dx={0} dy={-40} color={green} label="N" offset={-4} labelDx={12} />
      </Diagram>
    </Figure>
  );
}
