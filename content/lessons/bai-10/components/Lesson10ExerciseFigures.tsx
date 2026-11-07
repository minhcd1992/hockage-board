import { Arrow, Diagram, Figure, blue, green, slate } from '@/components/lesson/FigureKit';

export function LoopDiagram() {
  const groundY = 200, R = 70, cx = 380, cy = groundY - R;
  return (
    <Figure id="10.5" title="Hình 10.5 · Tàu lượn qua vòng lặp (Câu 41)"
      caption="Tại đỉnh C của vòng lặp, toa tàu ở phía trong đường ray, đầu lộn ngược. Cả trọng lực P và phản lực N của đường ray đều hướng xuống, về tâm vòng. Toa tàu không rời đường ray khi N ≥ 0.">
      <Diagram label="Đường ray từ đỉnh A xuống B rồi vào vòng lặp tròn." height={230}>
        <line x1="20" y1={groundY} x2="540" y2={groundY} stroke="#94a3b8" />
        <path d={`M 40 30 C 120 30, 150 ${groundY}, 250 ${groundY} L ${cx} ${groundY}`} fill="none" stroke="#475569" strokeWidth="3" />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#475569" strokeWidth="3" />
        <text x="50" y="24" fontSize="13" fontWeight="700">A (50 m)</text>
        <text x="250" y={groundY + 16} fontSize="13" fontWeight="700">B</text>
        <circle cx={cx} cy={cy - R} r="6" fill={blue} />
        <text x={cx + 10} y={cy - R - 8} fontSize="13" fontWeight="700">C (2R = 30 m)</text>
        <Arrow x={cx} y={cy - R + 4} dx={0} dy={40} color={slate} label="P" offset={14} labelDx={12} />
        <Arrow x={cx - 14} y={cy - R + 4} dx={0} dy={30} color={green} label="N" offset={14} labelDx={-12} />
        <line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke="#94a3b8" strokeDasharray="4 3" />
        <text x={cx + R / 2} y={cy - 6} textAnchor="middle" fontSize="12">R</text>
      </Diagram>
    </Figure>
  );
}
