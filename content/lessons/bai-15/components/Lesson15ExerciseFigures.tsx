import { Arrow, Diagram, Figure, orange, purple, red } from '@/components/lesson/FigureKit';

export function FrustumDiagram() {
  const by = 210, top = 50, R1 = 120, R2 = 60, cx = 280;
  return (
    <Figure id="15.6" title="Hình 15.6 · Bình nón cụt thu hẹp miệng (Câu 43)"
      caption="Áp lực do nước gây ra lên đáy bằng ρgh·S, bằng trọng lượng một cột nước hình trụ có đáy S và cao h (cả phần nét đứt). Phần chênh lệch so với trọng lượng nước thật trong bình do thành bình nghiêng ép xuống khối nước (mũi tên cam).">
      <Diagram label="Bình nón cụt đáy rộng, miệng hẹp, chứa đầy nước; nét đứt là hình trụ cùng đáy." height={250}>
        <rect x={cx - R1} y={top} width={2 * R1} height={by - top} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 4" />
        <polygon points={`${cx - R1},${by} ${cx + R1},${by} ${cx + R2},${top} ${cx - R2},${top}`} fill="#bfdbfe" stroke="#475569" strokeWidth="2.5" />
        {[-80, -40, 0, 40, 80].map(dx => <Arrow key={dx} x={cx + dx} y={by - 34} dx={0} dy={28} color={red} width={2} />)}
        <Arrow x={cx - (R1 + R2) / 2 - 6} y={(by + top) / 2 - 24} dx={14} dy={24} color={orange} width={2} />
        <Arrow x={cx + (R1 + R2) / 2 + 6} y={(by + top) / 2 - 24} dx={-14} dy={24} color={orange} width={2} />
        <line x1={cx + R1 + 20} y1={top} x2={cx + R1 + 20} y2={by} stroke={purple} strokeWidth="1.5" />
        <text x={cx + R1 + 26} y={(top + by) / 2} fontSize="13" fill={purple}>h = 40 cm</text>
        <text x={cx} y={top - 8} textAnchor="middle" fontSize="12" fill="#334155">R₂ = 10 cm</text>
        <text x={cx} y={by + 18} textAnchor="middle" fontSize="12" fill="#334155">R₁ = 20 cm</text>
      </Diagram>
    </Figure>
  );
}
