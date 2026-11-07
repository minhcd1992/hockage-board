import { Arrow, Diagram, Figure, blue, green, orange, purple, slate } from '@/components/lesson/FigureKit';
import { coil } from './springPath';

export function MixedSpringDiagram() {
  return (
    <Figure id="14.5" title="Hình 14.5 · Hệ ba lò xo ghép hỗn hợp (Câu 44)"
      caption="Lò xo 1 và 2 ghép song song tạo thành một cụm, cụm này nối tiếp với lò xo 3. Lò xo 3 chịu toàn bộ trọng lượng P; hai lò xo 1 và 2 có cùng độ dãn và cùng chia nhau P.">
      <Diagram label="Hai lò xo song song treo một thanh ngang, dưới thanh là lò xo thứ ba mang vật nặng." height={260}>
        <rect x="200" y="10" width="160" height="10" fill="#94a3b8" />
        <path d={coil(240, 20, 105, 10, 9)} fill="none" stroke={blue} strokeWidth="2" />
        <path d={coil(320, 20, 105, 10, 9)} fill="none" stroke={blue} strokeWidth="2" />
        <rect x="225" y="105" width="110" height="7" fill="#475569" />
        <path d={coil(280, 112, 195, 10, 9)} fill="none" stroke={orange} strokeWidth="2" />
        <rect x="258" y="195" width="44" height="30" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
        <text x="280" y="215" textAnchor="middle" fontSize="12" fontWeight="700">1 kg</text>
        <text x="222" y="65" textAnchor="end" fontSize="13" fill={blue}>k₁ = 100</text>
        <text x="338" y="65" fontSize="13" fill={blue}>k₂ = 100</text>
        <text x="298" y="158" fontSize="13" fill={orange}>k₃ = 200 (N/m)</text>
        <Arrow x={320} y={210} dx={0} dy={40} color={slate} label="P⃗" offset={0} labelDx={14} />
      </Diagram>
    </Figure>
  );
}

export function InclineSpringsDiagram() {
  return (
    <Figure id="14.6" title="Hình 14.6 · Vật nối giữa hai lò xo trên mặt phẳng nghiêng (Câu 45)"
      caption="Lò xo 1 giữ vật từ phía đỉnh dốc; lò xo 2 nối vật với đầu dưới được kéo bằng lực F. Vì lò xo nhẹ, lực đàn hồi của lò xo 2 tác dụng lên vật bằng F. Theo phương dọc mặt dốc: F_đh1 = mg sin α + F.">
      <Diagram label="Mặt phẳng nghiêng 30 độ, vật nặng nối hai lò xo, đầu dưới bị kéo bằng lực F dọc dốc." height={250}>
        <polygon points="80,20 444,230 80,230" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
        <text x="398" y="224" fontSize="13" fill="#334155">α = 30°</text>
        <g transform="translate(80 20) rotate(30)">
          <rect x="0" y="-26" width="10" height="26" fill="#475569" />
          <path d={`M 10 -13 ${Array.from({ length: 12 }, (_, i) => `L ${18 + i * 11} ${-13 + (i % 2 ? -8 : 8)}`).join(' ')} L 150 -13`} fill="none" stroke={blue} strokeWidth="2" />
          <rect x="150" y="-28" width="44" height="28" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <text x="172" y="-9" textAnchor="middle" fontSize="12" fontWeight="700">m</text>
          <path d={`M 194 -13 ${Array.from({ length: 10 }, (_, i) => `L ${202 + i * 11} ${-13 + (i % 2 ? -8 : 8)}`).join(' ')} L 320 -13`} fill="none" stroke={orange} strokeWidth="2" />
          <Arrow x={320} y={-13} dx={56} color={green} label="F = 5 N" offset={-10} />
          <text x="80" y="-30" textAnchor="middle" fontSize="13" fill={blue}>lò xo 1</text>
          <text x="257" y="-30" textAnchor="middle" fontSize="13" fill={orange}>lò xo 2</text>
        </g>
        <text x="500" y="40" textAnchor="end" fontSize="12" fill={purple}>đầu trên cố định ở đỉnh dốc</text>
      </Diagram>
    </Figure>
  );
}
