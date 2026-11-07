import { Arrow, Diagram, Figure, blue, purple, slate } from '@/components/lesson/FigureKit';

export function ConicalPendulumDiagram() {
  const ox = 280, oy = 30, L = 170, a = (60 * Math.PI) / 180;
  const bx = ox + L * Math.sin(a), by = oy + L * Math.cos(a);
  return (
    <Figure id="13.4" title="Hình 13.4 · Con lắc nón (Câu 25)"
      caption="Viên bi chỉ chịu hai lực: trọng lực P⃗ và lực căng T⃗. Thành phần thẳng đứng T cos α cân bằng P; thành phần nằm ngang T sin α hướng vào tâm quỹ đạo và đóng vai trò lực hướng tâm. Bán kính quỹ đạo là R = L sin α, không phải L.">
      <Diagram label="Con lắc nón: dây lệch 60 độ so với phương thẳng đứng, bi quay tròn trong mặt phẳng ngang." height={240}>
        <line x1={ox - 50} y1={oy} x2={ox + 50} y2={oy} stroke="#475569" strokeWidth="3" />
        <line x1={ox} y1={oy} x2={ox} y2={by + 30} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
        <ellipse cx={ox} cy={by} rx={L * Math.sin(a)} ry="22" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 4" />
        <line x1={ox} y1={oy} x2={bx} y2={by} stroke="#475569" strokeWidth="2" />
        <text x={ox + 10} y={oy + 42} fontSize="13" fill="#334155">α</text>
        <text x={ox + 60} y={by + 18} fontSize="13" fill={purple}>R = L sin α</text>
        <circle cx={bx} cy={by} r="8" fill="#0f172a" />
        <Arrow x={bx} y={by} dx={-100 * Math.sin(a)} dy={-100 * Math.cos(a)} color={blue} label="T⃗" offset={-6} />
        <Arrow x={bx} y={by} dx={0} dy={100 * Math.cos(a)} color={slate} label="P⃗" offset={14} labelDx={12} />
        <Arrow x={bx} y={by} dx={-100 * Math.sin(a)} dy={0} color={purple} label="F⃗ht" offset={18} dashed />
      </Diagram>
    </Figure>
  );
}

export function LoopDiagram() {
  const cx = 360, cy = 135, r = 80;
  return (
    <Figure id="13.5" title="Hình 13.5 · Vòng lộn của tàu lượn (Câu 28, Câu 43)"
      caption="Ở điểm thấp nhất B, phản lực hướng lên (vào tâm) nên N_B = mg + mv²/R. Ở điểm cao nhất C, cả trọng lực và phản lực đều hướng xuống (vào tâm) nên N_C = mv²/R − mg; xe không rời ray khi N_C ≥ 0, tức v_C ≥ √(gR).">
      <Diagram label="Đường ray trượt từ điểm A ở độ cao h xuống vòng lộn bán kính R với điểm thấp nhất B và điểm cao nhất C." height={250}>
        <path d={`M 30 40 C 130 40, 200 ${cy + r}, ${cx} ${cy + r}`} fill="none" stroke="#475569" strokeWidth="3" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#475569" strokeWidth="3" />
        <line x1={cx} y1={cy + r} x2="540" y2={cy + r} stroke="#475569" strokeWidth="3" />
        <line x1="20" y1={cy + r + 12} x2="540" y2={cy + r + 12} stroke="#cbd5e1" strokeWidth="1.5" />
        <circle cx="36" cy="34" r="7" fill="#0f172a" />
        <text x="50" y="28" fontSize="13" fill="#334155">A</text>
        <line x1="22" y1="40" x2="22" y2={cy + r} stroke={purple} strokeWidth="1.5" />
        <text x="6" y={(40 + cy + r) / 2} fontSize="13" fill={purple}>h</text>
        <circle cx={cx} cy={cy} r="3" fill="#334155" />
        <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={slate} strokeDasharray="4 3" />
        <text x={cx + 34} y={cy - 6} fontSize="13" fill={slate}>R</text>
        <circle cx={cx} cy={cy + r - 8} r="7" fill="#0f172a" />
        <text x={cx - 24} y={cy + r - 12} fontSize="13" fill="#334155">B</text>
        <Arrow x={cx + 14} y={cy + r - 8} dx={0} dy={-48} color={blue} label="N⃗_B" offset={-4} labelDx={16} />
        <circle cx={cx} cy={cy - r + 8} r="7" fill="#0f172a" />
        <text x={cx - 24} y={cy - r + 4} fontSize="13" fill="#334155">C</text>
        <Arrow x={cx + 14} y={cy - r + 8} dx={0} dy={28} color={blue} label="N⃗_C" offset={14} labelDx={20} />
        <Arrow x={cx - 14} y={cy - r + 8} dx={0} dy={36} color={slate} label="P⃗" offset={14} labelDx={-14} />
      </Diagram>
    </Figure>
  );
}
