import { Arrow, Diagram, Figure, blue, green, orange, purple, slate } from '@/components/lesson/FigureKit';

export function ExplosionTopDiagram() {
  const pts = Array.from({ length: 41 }, (_, i) => { const x = i / 40; return `${40 + x * 260},${200 - 160 * (1 - (2 * x - 1) ** 2)}`; }).join(' ');
  return (
    <Figure id="11.5" title="Hình 11.5 · Đạn nổ ở đỉnh quỹ đạo (Câu 43)"
      caption="Ở đỉnh quỹ đạo, vận tốc của viên đạn nằm ngang. Lực nổ là nội lực rất lớn trong thời gian rất ngắn nên động lượng của hệ ngay trước và ngay sau khi nổ bằng nhau. Mảnh 1 có vận tốc bằng 0 ngay sau nổ nên toàn bộ động lượng ngang được mảnh 2 mang đi.">
      <Diagram label="Quỹ đạo đạn, điểm nổ ở đỉnh." height={230}>
        <line x1="20" y1="200" x2="540" y2="200" stroke="#94a3b8" strokeWidth="2" />
        <polyline points={pts} fill="none" stroke={slate} strokeWidth="2" strokeDasharray="6 4" />
        <circle cx="170" cy="40" r="7" fill="#0f172a" />
        <Arrow x={170} y={40} dx={60} color={blue} label="v (trước nổ)" offset={-8} />
        <circle cx="172" cy="70" r="6" fill={orange} />
        <Arrow x={172} y={76} dx={0} dy={40} color={orange} label="mảnh 1 (v₁ = 0, rơi tự do)" offset={16} anchor="start" labelDx={8} />
        <circle cx="250" cy="40" r="6" fill={green} />
        <Arrow x={256} y={40} dx={130} color={green} label="mảnh 2" offset={-8} />
        <text x="420" y="110" fontSize="13" fill={purple}>p⃗_trước = p⃗₁ + p⃗₂</text>
      </Diagram>
    </Figure>
  );
}

export function BallisticPendulumDiagram() {
  const px = 330, py = 20, L = 150, a = (60 * Math.PI) / 180;
  const bx = px - L * Math.sin(a), by = py + L * Math.cos(a);
  return (
    <Figure id="11.6" title="Hình 11.6 · Con lắc thử đạn (Câu 45)"
      caption="Giai đoạn 1 (rất ngắn): đạn cắm vào khối gỗ, va chạm mềm, động lượng bảo toàn nhưng cơ năng không bảo toàn. Giai đoạn 2: hệ gỗ + đạn đi lên, chỉ trọng lực sinh công nên cơ năng bảo toàn.">
      <Diagram label="Khối gỗ treo dây, viên đạn bay tới, hệ lệch lên góc 60 độ." height={220}>
        <line x1={px - 60} y1={py} x2={px + 60} y2={py} stroke="#475569" strokeWidth="3" />
        <line x1={px} y1={py} x2={px} y2={py + L} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
        <rect x={px - 22} y={py + L} width="44" height="30" rx="3" fill="#fde68a" stroke="#b45309" strokeWidth="2" opacity="0.5" />
        <line x1={px} y1={py} x2={bx} y2={by} stroke="#475569" strokeWidth="2" />
        <rect x={bx - 22} y={by} width="44" height="30" rx="3" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
        <circle cx="120" cy={py + L + 15} r="4" fill="#0f172a" />
        <Arrow x={128} y={py + L + 15} dx={140} color={blue} label="v₀" offset={-8} />
        <line x1={bx + 50} y1={by + 15} x2={bx + 50} y2={py + L + 15} stroke={purple} strokeWidth="1.5" />
        <text x={bx + 56} y={(by + py + L + 30) / 2} fontSize="13" fill={purple}>h</text>
        <text x={px - 30} y={py + 44} fontSize="12" fill="#334155">60°</text>
      </Diagram>
    </Figure>
  );
}
