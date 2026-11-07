'use client';

import { useState } from 'react';
import { Arrow, Diagram, Figure, Readout, Slider, G, activePreset, blue, green, number, orange, presetClass, purple, red, slate } from '@/components/lesson/FigureKit';

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Small right-angle marker at point (x, y) between unit directions u and v. */
function RightAngle({ x, y, ux, uy, vx, vy, size = 9 }: { x: number; y: number; ux: number; uy: number; vx: number; vy: number; size?: number }) {
  const a = { x: x + ux * size, y: y + uy * size };
  const b = { x: x + (ux + vx) * size, y: y + (uy + vy) * size };
  const c = { x: x + vx * size, y: y + vy * size };
  return <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y}`} fill="none" stroke="#475569" strokeWidth="1.5" />;
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 8.1 — Cờ-lê: momen lực M = F·d = F·r·sinφ                 */
/* ------------------------------------------------------------------ */

export function TorqueWrench() {
  const [F, setF] = useState(40);
  const [r, setR] = useState(0.25);
  const [phi, setPhi] = useState(90);
  const scale = 560; // px per metre
  const ox = 110, oy = 150;
  const px = ox + r * scale, py = oy;
  const fx = Math.cos(rad(phi)), fy = -Math.sin(rad(phi)); // force direction (svg y down)
  const d = r * Math.sin(rad(phi));
  const M = F * d;
  // Foot of the perpendicular from O to the line of action through P.
  const t = (ox - px) * fx + (oy - py) * fy;
  const footX = px + t * fx, footY = py + t * fy;
  const arrowLen = 30 + F * 1.2;
  const ext = 400;
  const dPx = Math.hypot(footX - ox, footY - oy);

  return (
    <Figure id="8.1" badge="Mô phỏng" title="Mô phỏng 8.1 · Vặn ốc bằng cờ-lê"
      caption="O là trục quay (tâm con ốc), lực đặt tại đầu cán cách O một khoảng r. Đường nét đứt là giá của lực. Cánh tay đòn d là khoảng cách vuông góc từ O đến giá của lực, d = r·sinφ. Khi giá của lực đi qua O (φ = 0° hoặc 180°), d = 0 nên lực không làm ốc quay.">
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-3">
        <Slider label="Lực F" value={F} min={0} max={100} step={1} unit="N" digits={0} onChange={setF} />
        <Slider label="Khoảng cách r" value={r} min={0.1} max={0.5} step={0.01} unit="m" onChange={setR} />
        <Slider label="Góc φ giữa r và F" value={phi} min={0} max={180} step={1} unit="°" digits={0} onChange={setPhi} />
      </div>
      <Diagram label={`Momen lực ${number(M)} N·m, cánh tay đòn ${number(d, 3)} m.`} height={250}>
        {/* line of action */}
        <line x1={px - fx * ext} y1={py - fy * ext} x2={px + fx * ext} y2={py + fy * ext} stroke="#94a3b8" strokeDasharray="6 5" />
        {/* wrench */}
        <rect x={ox - 6} y={oy - 9} width={r * scale + 18} height={18} rx={9} fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
        <polygon points={`${ox},${oy - 22} ${ox + 19},${oy - 11} ${ox + 19},${oy + 11} ${ox},${oy + 22} ${ox - 19},${oy + 11} ${ox - 19},${oy - 11}`} fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
        <circle cx={ox} cy={oy} r="4" fill="#0f172a" />
        <text x={ox - 14} y={oy + 40} fontSize="13" fill="#0f172a" fontWeight="700">O</text>
        {/* r and d */}
        <text x={(ox + px) / 2} y={oy + 28} textAnchor="middle" fontSize="13" fill={slate}>r = {number(r)} m</text>
        {dPx > 2 && <>
          <line x1={ox} y1={oy} x2={footX} y2={footY} stroke={green} strokeWidth="2.5" />
          <RightAngle x={footX} y={footY} ux={(ox - footX) / dPx} uy={(oy - footY) / dPx} vx={fx} vy={fy} />
          <text x={(ox + footX) / 2 - 10} y={(oy + footY) / 2 - 6} textAnchor="end" fontSize="14" fontWeight="700" fill={green} stroke="white" strokeWidth="3" paintOrder="stroke">d</text>
        </>}
        <Arrow x={px} y={py} dx={fx * arrowLen} dy={fy * arrowLen} color={blue} label="F" offset={-6} labelDx={fx >= 0 ? 10 : -10} />
        <text x={px + 10} y={py + 30} fontSize="12" fill={slate}>φ = {phi}°</text>
        {M > 0.05 && <path d={`M ${ox + 34} ${oy - 30} A 40 40 0 0 0 ${ox - 30} ${oy - 34}`} fill="none" stroke={purple} strokeWidth="2.5" />}
        {M > 0.05 && <Arrow x={ox - 26} y={oy - 36} dx={-6} dy={4} color={purple} />}
        <text x="540" y="30" textAnchor="end" fontSize="15" fontWeight="700" fill={M > 0.05 ? purple : red}>{M > 0.05 ? 'Ốc quay ngược chiều kim đồng hồ' : 'M = 0: ốc không quay'}</text>
      </Diagram>
      <Readout items={[['Cánh tay đòn d', `${number(d, 3)} m`], ['sin φ', number(Math.sin(rad(phi)), 3)], ['Momen M = F·d', `${number(M)} N·m`], ['M lớn nhất (φ = 90°)', `${number(F * r)} N·m`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 8.2 — Bập bênh: quy tắc momen lực                          */
/* ------------------------------------------------------------------ */

export function SeesawBalance() {
  const [m1, setM1] = useState(40);
  const [d1, setD1] = useState(1.5);
  const [m2, setM2] = useState(30);
  const [d2, setD2] = useState(1.8);
  const M1 = m1 * G * d1, M2 = m2 * G * d2;
  const diff = M2 - M1;
  const balanced = Math.abs(diff) <= 0.005 * Math.max(M1, M2);
  const tilt = balanced ? 0 : Math.sign(diff) * Math.min(12, 2 + (Math.abs(diff) / Math.max(M1, M2)) * 30);
  const cx = 280, cy = 150, k = 100; // px per metre
  const c = Math.cos(rad(tilt)), s = Math.sin(rad(tilt));
  const pt = (x: number) => ({ x: cx + x * k * c, y: cy + x * k * s });
  const L = pt(-d1), R = pt(d2);
  const needD2 = (m1 * d1) / m2;

  return (
    <Figure id="8.2" badge="Mô phỏng" title="Mô phỏng 8.2 · Bập bênh và quy tắc momen lực"
      caption="Bỏ qua khối lượng tấm ván, trục quay O ở giữa. Trọng lực của bạn bên trái gây momen ngược chiều kim đồng hồ, của bạn bên phải gây momen cùng chiều kim đồng hồ. Ván nằm ngang cân bằng khi hai momen bằng nhau: m₁gd₁ = m₂gd₂. Hình nghiêng chỉ minh họa chiều có xu hướng quay.">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-4">
        <Slider label="m₁ (trái)" value={m1} min={10} max={80} step={1} unit="kg" digits={0} onChange={setM1} />
        <Slider label="d₁" value={d1} min={0.2} max={2.4} step={0.05} unit="m" onChange={setD1} />
        <Slider label="m₂ (phải)" value={m2} min={10} max={80} step={1} unit="kg" digits={0} onChange={setM2} />
        <Slider label="d₂" value={d2} min={0.2} max={2.4} step={0.05} unit="m" onChange={setD2} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <button type="button" disabled={needD2 > 2.4} onClick={() => setD2(Math.round(needD2 * 100) / 100)} className={`${presetClass} ${balanced ? activePreset : ''}`}>
          {needD2 > 2.4 ? 'Không thể cân bằng chỉ bằng cách dời bạn bên phải' : `Đặt d₂ = ${number(needD2)} m để cân bằng`}
        </button>
      </div>
      <Diagram label={`Momen bên trái ${number(M1, 0)} N·m, bên phải ${number(M2, 0)} N·m.`} height={240}>
        <polygon points={`${cx},${cy + 4} ${cx - 26},${cy + 64} ${cx + 26},${cy + 64}`} fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
        <line x1="40" y1={cy + 64} x2="520" y2={cy + 64} stroke="#94a3b8" strokeWidth="3" />
        <line x1={pt(-2.5).x} y1={pt(-2.5).y} x2={pt(2.5).x} y2={pt(2.5).y} stroke="#92400e" strokeWidth="9" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#0f172a" />
        <rect x={L.x - 16} y={L.y - 40} width="32" height="32" rx="6" fill="#bfdbfe" stroke={blue} strokeWidth="2" />
        <text x={L.x} y={L.y - 19} textAnchor="middle" fontSize="12" fontWeight="700" fill={blue}>m₁</text>
        <rect x={R.x - 16} y={R.y - 40} width="32" height="32" rx="6" fill="#fed7aa" stroke={orange} strokeWidth="2" />
        <text x={R.x} y={R.y - 19} textAnchor="middle" fontSize="12" fontWeight="700" fill={orange}>m₂</text>
        <Arrow x={L.x} y={L.y - 4} dx={0} dy={22 + m1 * 0.6} color={blue} label="P₁" offset={14} labelDx={-14} />
        <Arrow x={R.x} y={R.y - 4} dx={0} dy={22 + m2 * 0.6} color={orange} label="P₂" offset={14} labelDx={14} />
        <text x="280" y="30" textAnchor="middle" fontSize="15" fontWeight="700" fill={balanced ? green : red}>
          {balanced ? 'Cân bằng: M₁ = M₂' : diff > 0 ? 'M₂ > M₁: ván quay theo chiều kim đồng hồ' : 'M₁ > M₂: ván quay ngược chiều kim đồng hồ'}
        </text>
      </Diagram>
      <Readout items={[['M₁ = m₁gd₁', `${number(M1, 0)} N·m`], ['M₂ = m₂gd₂', `${number(M2, 0)} N·m`], ['M₂ − M₁', `${number(diff, 0)} N·m`], ['Lực đỡ ở trục', `${number((m1 + m2) * G, 0)} N`]]} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Mô phỏng 8.3 — Thang tựa tường nhẵn: khi nào thang trượt?            */
/* ------------------------------------------------------------------ */

export function LadderSlip() {
  const [alpha, setAlpha] = useState(60);
  const [mu, setMu] = useState(0.4);
  const m = 15, Lm = 4;
  const P = m * G;
  const Ft = P / (2 * Math.tan(rad(alpha)));
  const fMax = mu * P;
  const slips = Ft > fMax + 1e-9;
  const alphaMin = (Math.atan(1 / (2 * mu)) * 180) / Math.PI;
  const wallX = 90, floorY = 225, Lpx = 200;
  const Ax = wallX + Lpx * Math.cos(rad(alpha)), Ay = floorY;
  const Bx = wallX, By = floorY - Lpx * Math.sin(rad(alpha));
  const Gx = (Ax + Bx) / 2, Gy = (Ay + By) / 2;
  const k = 0.45; // px per newton

  return (
    <Figure id="8.3" badge="Mô phỏng" title="Mô phỏng 8.3 · Thang tựa tường nhẵn"
      caption={`Thang đồng chất dài 4 m, khối lượng 15 kg; tường nhẵn nên phản lực tường F_t nằm ngang. Lấy momen đối với chân thang A: F_t = P/(2tanα). Ma sát nghỉ ở chân thang phải bằng F_t; thang không trượt khi F_t ≤ μₙN = μₙP. Với μₙ = ${number(mu)}, góc nhỏ nhất là α_min ≈ ${number(alphaMin, 1)}°.`}>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-2">
        <Slider label="Góc α giữa thang và sàn" value={alpha} min={30} max={85} step={0.5} unit="°" digits={1} onChange={setAlpha} />
        <Slider label="Hệ số ma sát nghỉ μₙ" value={mu} min={0.1} max={0.8} step={0.05} onChange={setMu} />
      </div>
      <Diagram label={`Thang nghiêng ${number(alpha, 1)} độ, ${slips ? 'bị trượt' : 'đứng yên'}.`} height={250}>
        <rect x={wallX - 18} y="20" width="18" height={floorY - 20} fill="#e2e8f0" />
        <line x1={wallX} y1="20" x2={wallX} y2={floorY} stroke="#475569" strokeWidth="3" />
        <line x1={wallX - 18} y1={floorY} x2="540" y2={floorY} stroke="#475569" strokeWidth="3" />
        {Array.from({ length: 22 }, (_, i) => <line key={i} x1={wallX + i * 20} y1={floorY} x2={wallX - 10 + i * 20} y2={floorY + 10} stroke="#cbd5e1" />)}
        <line x1={Ax} y1={Ay} x2={Bx} y2={By} stroke={slips ? red : '#92400e'} strokeWidth="7" strokeLinecap="round" />
        <circle cx={Gx} cy={Gy} r="4" fill="#0f172a" />
        <text x={Ax + 6} y={Ay - 8} fontSize="13" fontWeight="700">A</text>
        <text x={Bx + 8} y={By - 6} fontSize="13" fontWeight="700">B</text>
        <text x={Gx + 8} y={Gy - 6} fontSize="13" fontWeight="700">G</text>
        <Arrow x={Gx} y={Gy} dx={0} dy={P * k} color={slate} label="P" offset={14} labelDx={10} />
        <Arrow x={Bx} y={By} dx={Ft * k} color={blue} label="F_t" offset={-8} />
        <Arrow x={Ax} y={Ay} dx={0} dy={-P * k} color={green} label="N" offset={-4} labelDx={12} />
        <Arrow x={Ax} y={Ay - 4} dx={-Math.min(Ft, fMax) * k} color={orange} label="Fₘₛₙ" offset={-8} />
        <text x={Ax + 34} y={floorY - 6} fontSize="12" fill="#334155">α</text>
        <text x="540" y="34" textAnchor="end" fontSize="15" fontWeight="700" fill={slips ? red : green}>{slips ? 'Ma sát không đủ — thang trượt!' : 'Thang đứng yên'}</text>
        <text x="540" y="56" textAnchor="end" fontSize="12" fill="#334155">ma sát cần: {number(Ft, 1)} N · tối đa: {number(fMax, 1)} N</text>
      </Diagram>
      <Readout items={[['P = mg', `${number(P, 0)} N`], ['F_t = Fₘₛₙ cần', `${number(Ft, 1)} N`], ['μₙN', `${number(fMax, 1)} N`], ['α_min', `${number(alphaMin, 1)}°`]]} />
      <p className="mt-1 text-[11px] text-slate-500">Chiều dài thang {Lm} m không ảnh hưởng đến điều kiện trượt: L bị triệt tiêu trong phương trình momen.</p>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Hình tĩnh                                                           */
/* ------------------------------------------------------------------ */

export function DoorLeverArm() {
  return (
    <Figure id="8.4" title="Hình 8.4 · Cùng khoảng cách r, khác cánh tay đòn"
      caption="Nhìn từ trên xuống, bản lề O là trục quay. Lực F₁ kéo dọc theo cánh cửa: giá của lực đi qua O nên d₁ = 0, cửa không quay. Lực F₂ vuông góc với cánh cửa tại cùng điểm đặt: d₂ = r, tác dụng làm quay lớn nhất. Lực F₃ xiên góc φ: d₃ = r·sinφ.">
      <Diagram label="Cánh cửa nhìn từ trên với ba lực khác hướng." height={210}>
        <rect x="70" y="96" width="360" height="12" rx="3" fill="#fde68a" stroke="#b45309" strokeWidth="1.5" />
        <circle cx="70" cy="102" r="7" fill="#0f172a" />
        <text x="58" y="88" fontSize="13" fontWeight="700">O</text>
        <text x="250" y="130" textAnchor="middle" fontSize="13" fill={slate}>r = 0,8 m</text>
        <Arrow x={430} y={102} dx={80} color={red} label="F₁ (d = 0)" offset={-10} anchor="end" />
        <Arrow x={430} y={102} dx={0} dy={80} color={green} label="F₂ (d = r)" offset={16} labelDx={-6} anchor="end" />
        <Arrow x={430} y={102} dx={56} dy={56} color={blue} label="F₃ (d = r·sinφ)" offset={18} labelDx={4} anchor="start" />
      </Diagram>
    </Figure>
  );
}

export function CoupleWheel() {
  return (
    <Figure id="8.5" title="Hình 8.5 · Ngẫu lực khi xoay vô-lăng"
      caption="Hai tay tác dụng hai lực song song, ngược chiều, cùng độ lớn F lên hai điểm đối xứng của vô-lăng. Hợp lực bằng 0 nên vô-lăng không tịnh tiến, nhưng hai momen cùng chiều cộng lại: M = F·d với d là khoảng cách giữa hai giá của lực (ở đây bằng đường kính).">
      <Diagram label="Vô-lăng với ngẫu lực." height={220}>
        <circle cx="280" cy="110" r="80" fill="none" stroke="#334155" strokeWidth="10" />
        <line x1="200" y1="110" x2="360" y2="110" stroke="#334155" strokeWidth="6" />
        <circle cx="280" cy="110" r="14" fill="#334155" />
        <Arrow x={200} y={110} dx={0} dy={60} color={blue} label="F" offset={16} labelDx={-12} />
        <Arrow x={360} y={110} dx={0} dy={-60} color={blue} label="F" offset={-4} labelDx={12} />
        <line x1="200" y1="196" x2="360" y2="196" stroke={green} strokeWidth="1.5" />
        <line x1="200" y1="190" x2="200" y2="202" stroke={green} strokeWidth="1.5" />
        <line x1="360" y1="190" x2="360" y2="202" stroke={green} strokeWidth="1.5" />
        <text x="280" y="214" textAnchor="middle" fontSize="13" fontWeight="700" fill={green}>d</text>
        <path d="M 340 40 A 95 95 0 0 0 220 40" fill="none" stroke={purple} strokeWidth="2.5" />
        <Arrow x={224} y={42} dx={-6} dy={4} color={purple} />
      </Diagram>
    </Figure>
  );
}

/** Horizontal light/heavy bar AB hinged at A on a wall, cable BC at angle θ, load at D. */
export function BracketDiagram({ id = '8.6', title = 'Hình 8.6 · Thanh AB, dây BC và thùng hàng (Ví dụ 2)', AD = 1.5, AB = 2, loadLabel = 'P = 392 N', barWeight = false, caption }: {
  id?: string; title?: string; AD?: number; AB?: number; loadLabel?: string; barWeight?: boolean; caption?: string;
}) {
  const theta = rad(30);
  const ax = 70, ay = 180, k = Math.min(200, 150 / (AB * Math.tan(theta))); // keep C inside the frame
  const bx = ax + AB * k;
  const cy = ay - AB * k * Math.tan(theta);
  const dx = ax + AD * k;
  const ux = (ax - bx) / Math.hypot(ax - bx, cy - ay), uy = (cy - ay) / Math.hypot(ax - bx, cy - ay);
  return (
    <Figure id={id} title={title}
      caption={caption ?? 'Thanh nhẹ AB nằm ngang, bản lề A gắn vào tường; dây BC hợp với thanh góc θ = 30°. Lực căng T tại B hướng dọc dây về C. Phản lực bản lề R_A chưa biết hướng nên phân tích thành R_Ax và R_Ay. Lấy momen đối với A để loại R_A.'}>
      <Diagram label="Thanh ngang AB, dây BC, vật treo tại D." height={230}>
        <rect x={ax - 22} y={cy - 16} width="22" height={ay - cy + 50} fill="#e2e8f0" />
        <line x1={ax} y1={cy - 16} x2={ax} y2={ay + 34} stroke="#475569" strokeWidth="3" />
        <line x1={ax} y1={ay} x2={bx} y2={ay} stroke="#92400e" strokeWidth="7" strokeLinecap="round" />
        <line x1={bx} y1={ay} x2={ax} y2={cy} stroke="#475569" strokeWidth="2" />
        <circle cx={ax} cy={ay} r="6" fill="white" stroke="#0f172a" strokeWidth="2" />
        <text x={ax + 8} y={ay + 22} fontSize="13" fontWeight="700">A</text>
        <text x={bx + 6} y={ay + 20} fontSize="13" fontWeight="700">B</text>
        <text x={ax + 8} y={cy - 2} fontSize="13" fontWeight="700">C</text>
        <text x={dx + 6} y={ay - 10} fontSize="13" fontWeight="700">D</text>
        <text x={bx - 56} y={ay - 8} fontSize="12" fill="#334155">θ</text>
        <line x1={dx} y1={ay} x2={dx} y2={ay + 22} stroke="#475569" strokeWidth="1.5" />
        <rect x={dx - 16} y={ay + 22} width="32" height="22" fill="#fde68a" stroke="#b45309" strokeWidth="1.5" />
        <Arrow x={dx} y={ay + 44} dx={0} dy={34} color={slate} label={loadLabel} offset={14} labelDx={10} anchor="start" />
        {barWeight && <Arrow x={(ax + bx) / 2} y={ay} dx={0} dy={34} color={slate} label="P₁" offset={14} labelDx={8} anchor="start" />}
        <Arrow x={bx} y={ay} dx={ux * 80} dy={uy * 80} color={blue} label="T" offset={-6} labelDx={-6} />
        <Arrow x={ax} y={ay} dx={60} color={green} label="R_Ax" offset={-8} labelDx={6} />
        <Arrow x={ax} y={ay} dx={0} dy={-40} color={green} label="R_Ay" offset={-4} labelDx={22} />
      </Diagram>
    </Figure>
  );
}

export function LadderExample() {
  const wallX = 90, floorY = 215, Lpx = 190, a = rad(60);
  const Ax = wallX + Lpx * Math.cos(a), By = floorY - Lpx * Math.sin(a);
  const Gx = (Ax + wallX) / 2, Gy = (floorY + By) / 2;
  return (
    <Figure id="8.7" title="Hình 8.7 · Sơ đồ lực của thang (Ví dụ 1)"
      caption="Thang chịu bốn lực: trọng lực P tại trung điểm G, phản lực F_t của tường nhẵn (nằm ngang, hướng ra khỏi tường), phản lực N của sàn (thẳng đứng) và ma sát nghỉ Fₘₛₙ ở chân thang (hướng vào tường). Cánh tay đòn đối với A: của P là (L/2)cosα, của F_t là L·sinα.">
      <Diagram label="Thang tựa tường với bốn lực." height={240}>
        <line x1={wallX} y1="10" x2={wallX} y2={floorY} stroke="#475569" strokeWidth="3" />
        <line x1={wallX} y1={floorY} x2="520" y2={floorY} stroke="#475569" strokeWidth="3" />
        <line x1={Ax} y1={floorY} x2={wallX} y2={By} stroke="#92400e" strokeWidth="7" strokeLinecap="round" />
        <Arrow x={Gx} y={Gy} dx={0} dy={60} color={slate} label="P" offset={14} labelDx={10} />
        <Arrow x={wallX} y={By} dx={55} color={blue} label="F_t" offset={-8} />
        <Arrow x={Ax} y={floorY} dx={0} dy={-70} color={green} label="N" offset={-4} labelDx={12} />
        <Arrow x={Ax} y={floorY - 4} dx={-48} color={orange} label="Fₘₛₙ" offset={-8} />
        <line x1={Ax} y1={floorY + 14} x2={Gx} y2={floorY + 14} stroke={slate} strokeWidth="1.5" />
        <text x={(Ax + Gx) / 2} y={floorY + 28} textAnchor="middle" fontSize="12" fill={slate}>(L/2)cosα</text>
        <line x1={Ax + 14} y1={floorY} x2={Ax + 14} y2={By} stroke={blue} strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={Ax + 20} y={(floorY + By) / 2} fontSize="12" fill={blue}>L·sinα</text>
        <text x={Ax - 40} y={floorY - 8} fontSize="12">α = 60°</text>
        <text x={Ax + 4} y={floorY - 8} fontSize="13" fontWeight="700">A</text>
        <text x={wallX + 6} y={By - 6} fontSize="13" fontWeight="700">B</text>
      </Diagram>
    </Figure>
  );
}
