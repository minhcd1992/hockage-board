import type { ReactNode } from 'react';

const blue = '#2563eb', orange = '#c2410c', green = '#0f766e', slate = '#64748b';

function Arrow({
  x,
  y,
  dx = 0,
  dy = 0,
  label,
  color = blue,
  offset = -10,
  labelDx = 0,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  dx?: number;
  dy?: number;
  label: string;
  color?: string;
  offset?: number;
  labelDx?: number;
  anchor?: 'start' | 'middle' | 'end';
}) {
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return null;
  const ux = dx / length,
    uy = dy / length,
    ex = x + dx,
    ey = y + dy;
  return (
    <g data-vector={label}>
      <line x1={x} y1={y} x2={ex} y2={ey} stroke={color} strokeWidth="2.5" />
      <path
        d={`M ${ex - ux * 7 - uy * 4} ${ey - uy * 7 + ux * 4} L ${ex} ${ey} L ${ex - ux * 7 + uy * 4} ${ey - uy * 7 - ux * 4}`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
      <text
        x={ex + labelDx}
        y={ey + offset}
        textAnchor={anchor}
        fill={color}
        fontSize="14.5"
        fontWeight="700"
        stroke="white"
        strokeWidth="3.5"
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  );
}

function Figure({
  id,
  title,
  label,
  caption,
  children,
}: {
  id: string;
  title: string;
  label: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure
      data-exercise-figure={id}
      className="mx-auto my-4 w-full max-w-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 shadow-xs sm:p-4"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
        <div className="text-sm font-bold text-slate-800">{title}</div>
        <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
          Sơ đồ phân tích lực
        </span>
      </div>
      <svg
        viewBox="0 0 560 325"
        role="img"
        aria-label={label}
        className="mx-auto block w-full max-w-[520px] rounded-xl border border-slate-200/80 bg-white"
        style={{ fontSize: 14 }}
      >
        {children}
      </svg>
      <figcaption className="mt-2.5 border-t border-slate-200/80 pt-2 text-xs leading-relaxed text-slate-600">
        {caption}
      </figcaption>
    </figure>
  );
}

export function HorseForces() {
  return (
    <Figure
      id="6.42"
      title="Câu 42 · Tách riêng vật chịu lực: Ngựa, Xe và Trái Đất"
      label="Sơ đồ lực trên ngựa, xe và Trái Đất, phân biệt nội lực T với các ngoại lực ngang f và R"
      caption="Mũi tên chỉ phương, chiều của lực trên từng vật được tách riêng. Cặp lực căng T và −T là nội lực của hệ ngựa–xe. Trên Trái Đất chỉ biểu diễn các phản lực tương tác với ngựa và xe: ΣN là tổng lực ép xuống, ΣP là tổng lực hút hấp dẫn hướng lên."
    >
      {/* Card 1: NGỰA */}
      <rect x="14" y="12" width="256" height="162" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="142" y="31" textAnchor="middle" fill="#1e293b" fontWeight="700" fontSize="14">
        1. Vật cách ly: NGỰA (mₙ)
      </text>
      <line x1="40" y1="96" x2="244" y2="96" stroke="#cbd5e1" strokeDasharray="3 3" />
      <rect x="124" y="84" width="36" height="24" rx="6" fill="#dbeafe" stroke={blue} strokeWidth="1.5" />
      <circle cx="142" cy="96" r="4.5" fill="#1e293b" />
      <Arrow x={142} y={96} dx={76} label="f" color={blue} offset={-9} />
      <Arrow x={142} y={96} dx={-54} label="T" color={orange} offset={-9} />
      <Arrow x={142} y={96} dy={-48} label="Nₙ" color={green} offset={8} labelDx={18} />
      <Arrow x={142} y={96} dy={48} label="Pₙ" color={green} offset={-2} labelDx={18} />
      <text x="142" y="164" textAnchor="middle" fill="#475569" fontSize="12.5" fontWeight="600">
        Phương ngang: f − T = mₙa
      </text>

      {/* Card 2: XE */}
      <rect x="290" y="12" width="256" height="162" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="418" y="31" textAnchor="middle" fill="#1e293b" fontWeight="700" fontSize="14">
        2. Vật cách ly: XE (mₓ)
      </text>
      <line x1="316" y1="96" x2="520" y2="96" stroke="#cbd5e1" strokeDasharray="3 3" />
      <rect x="400" y="84" width="36" height="24" rx="6" fill="#ffedd5" stroke={orange} strokeWidth="1.5" />
      <circle cx="418" cy="96" r="4.5" fill="#1e293b" />
      <Arrow x={418} y={96} dx={54} label="T" color={orange} offset={-9} />
      <Arrow x={418} y={96} dx={-46} label="R" color={blue} offset={-9} />
      <Arrow x={418} y={96} dy={-48} label="Nₓ" color={green} offset={8} labelDx={18} />
      <Arrow x={418} y={96} dy={48} label="Pₓ" color={green} offset={-2} labelDx={18} />
      <text x="418" y="164" textAnchor="middle" fill="#475569" fontSize="12.5" fontWeight="600">
        Phương ngang: T − R = mₓa
      </text>

      {/* Card 3: TRÁI ĐẤT */}
      <rect x="14" y="186" width="532" height="126" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="30" y="210" fill="#1e293b" fontWeight="700" fontSize="14">
        3. Các phản lực tác dụng lên TRÁI ĐẤT (Mặt đất)
      </text>
      <text x="30" y="234" fill={slate} fontSize="12.5">
        • Ngựa đẩy đất về sau (−f); xe kéo đất về trước (−R)
      </text>
      <text x="30" y="256" fill={slate} fontSize="12.5">
        • Ngựa &amp; xe nén mặt đất xuống (ΣN); hút Trái Đất lên (ΣP)
      </text>
      <text x="30" y="282" fill="#0f766e" fontWeight="600" fontSize="12.5">
        ⇒ Cả hệ (Ngựa + Xe): f − R = (mₙ + mₓ)a
      </text>

      <line x1="310" y1="250" x2="520" y2="250" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="418" cy="250" r="7" fill="#64748b" stroke="white" strokeWidth="1.5" />
      <Arrow x={418} y={250} dx={-76} label="f" color={blue} offset={-9} />
      <Arrow x={418} y={250} dx={46} label="R" color={blue} offset={-9} />
      <Arrow x={418} y={250} dy={-38} label="ΣP" color={green} offset={8} labelDx={22} />
      <Arrow x={418} y={250} dy={38} label="ΣN" color={green} offset={-2} labelDx={22} />
    </Figure>
  );
}

export function AtwoodForces() {
  const s = 1.15;
  const cy = 166;
  return (
    <Figure
      id="6.43"
      title="Câu 43 · Máy Atwood và sơ đồ tách vật chịu lực"
      label="Hai vật treo hai phía ròng rọc; sơ đồ lực cho m1, m2 và ròng rọc có lực trục đỡ lên"
      caption="Khung trái mô tả bố trí hệ. Ba cột bên phải tách riêng từng vật với các vectơ lực vẽ cùng tỉ lệ: T = 36,75 N; P₁ = 29,4 N; P₂ = 49,0 N; R = 73,5 N. R là lực trục đỡ ròng rọc hướng lên; lực ròng rọc nén trục hướng ngược lại."
    >
      {/* Left panel: Physical layout */}
      <rect x="14" y="12" width="164" height="300" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="96" y="32" textAnchor="middle" fill="#1e293b" fontWeight="700" fontSize="14">
        Bố trí hệ
      </text>
      <path d="M 42 48 H 150 M 96 48 V 78" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
      <circle cx="96" cy="102" r="28" fill="#ffffff" stroke="#475569" strokeWidth="2.5" />
      <circle cx="96" cy="102" r="4.5" fill="#475569" />
      <path d="M 68 188 V 102 A 28 28 0 0 1 124 102 V 228" stroke="#475569" strokeWidth="2" fill="none" />

      {/* Mass 1 */}
      <rect x="48" y="188" width="40" height="34" rx="5" fill="#dbeafe" stroke={blue} strokeWidth="2" />
      <text x="68" y="210" textAnchor="middle" fill="#1e3a8a" fontWeight="700">
        m₁
      </text>
      <text x="68" y="238" textAnchor="middle" fill={blue} fontSize="12" fontWeight="600">
        3,0 kg ↑
      </text>

      {/* Mass 2 */}
      <rect x="104" y="228" width="40" height="44" rx="5" fill="#ffedd5" stroke={orange} strokeWidth="2" />
      <text x="124" y="255" textAnchor="middle" fill="#7c2d12" fontWeight="700">
        m₂
      </text>
      <text x="124" y="288" textAnchor="middle" fill={orange} fontSize="12" fontWeight="600">
        5,0 kg ↓
      </text>

      {/* Right panel: Isolated free-body diagrams */}
      <rect x="190" y="12" width="356" height="300" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
      <line x1="308" y1="24" x2="308" y2="300" stroke="#e2e8f0" />
      <line x1="426" y1="24" x2="426" y2="300" stroke="#e2e8f0" />

      {/* Column headers */}
      <text x="249" y="32" textAnchor="middle" fill="#1e293b" fontWeight="700" fontSize="14">
        Vật 1 (m₁)
      </text>
      <text x="367" y="32" textAnchor="middle" fill="#1e293b" fontWeight="700" fontSize="14">
        Vật 2 (m₂)
      </text>
      <text x="486" y="32" textAnchor="middle" fill="#1e293b" fontWeight="700" fontSize="14">
        Ròng rọc
      </text>

      {/* Isolated bodies & force vectors */}
      <circle cx="249" cy={cy} r="6" fill={blue} />
      <Arrow x={249} y={cy} dy={-36.75 * s} label="T" color={blue} offset={-8} />
      <Arrow x={249} y={cy} dy={29.4 * s} label="P₁" color={orange} offset={20} />

      <circle cx="367" cy={cy} r="6" fill={orange} />
      <Arrow x={367} y={cy} dy={-36.75 * s} label="T" color={blue} offset={-8} />
      <Arrow x={367} y={cy} dy={49 * s} label="P₂" color={orange} offset={20} />

      <circle cx="486" cy={cy} r="18" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
      <circle cx="486" cy={cy} r="3.5" fill="#475569" />
      <Arrow x={486} y={cy} dy={-73.5 * s} label="R" color={green} offset={-8} />
      <Arrow x={468} y={cy} dy={36.75 * s} label="T" color={blue} offset={20} />
      <Arrow x={504} y={cy} dy={36.75 * s} label="T" color={blue} offset={20} />

      {/* Bottom status badges */}
      <rect x="204" y="268" width="90" height="32" rx="6" fill="#ffffff" stroke="#cbd5e1" />
      <text x="249" y="282" textAnchor="middle" fill={blue} fontWeight="700" fontSize="12">
        a ↑ (nhanh dần)
      </text>
      <text x="249" y="295" textAnchor="middle" fill={slate} fontSize="11">
        T − P₁ = m₁a
      </text>

      <rect x="322" y="268" width="90" height="32" rx="6" fill="#ffffff" stroke="#cbd5e1" />
      <text x="367" y="282" textAnchor="middle" fill={orange} fontWeight="700" fontSize="12">
        a ↓ (nhanh dần)
      </text>
      <text x="367" y="295" textAnchor="middle" fill={slate} fontSize="11">
        P₂ − T = m₂a
      </text>

      <rect x="441" y="268" width="90" height="32" rx="6" fill="#ffffff" stroke="#cbd5e1" />
      <text x="486" y="282" textAnchor="middle" fill={green} fontWeight="700" fontSize="12">
        Cố định
      </text>
      <text x="486" y="295" textAnchor="middle" fill={slate} fontSize="11">
        R = 2T = 73,5 N
      </text>
    </Figure>
  );
}
