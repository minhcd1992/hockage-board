import { Arrow, Diagram, Figure } from './Lesson7Figures';

const blue = '#2563eb', orange = '#c2410c', green = '#0f766e', slate = '#64748b';

export function ThreeBlocksDiagram() {
  const blocks = [
    { x: 40, w: 70, label: 'm₁ = 1 kg' },
    { x: 200, w: 90, label: 'm₂ = 2 kg' },
    { x: 380, w: 110, label: 'm₃ = 3 kg' },
  ];
  return (
    <Figure id="7.8" title="Hình 7.8 · Hệ ba vật nối dây trên mặt bàn (Câu 41)"
      caption="Lực kéo F đặt vào m₃. Mỗi vật chịu ma sát trượt ngược chiều chuyển động. Dây 1 kéo m₁ sang phải và kéo m₂ sang trái với cùng độ lớn T₁; dây 2 tương tự với T₂. Trọng lực và phản lực theo phương đứng của mỗi vật không vẽ để hình gọn.">
      <Diagram label="Ba vật m1, m2, m3 nối dây, lực kéo F vào m3." height={170}>
        <line x1="10" y1="130" x2="550" y2="130" stroke="#94a3b8" strokeWidth="3" />
        {blocks.map(b => (
          <g key={b.label}>
            <rect x={b.x} y="80" width={b.w} height="50" rx="4" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
            <text x={b.x + b.w / 2} y="110" textAnchor="middle" fontSize="13" fontWeight="700" fill="#92400e">{b.label}</text>
            <Arrow x={b.x + 6} y={126} dx={-30} color={orange} label="Fₘₛ" offset={-6} width={2} />
          </g>
        ))}
        <line x1="110" y1="100" x2="200" y2="100" stroke="#475569" strokeWidth="2" />
        <line x1="290" y1="100" x2="380" y2="100" stroke="#475569" strokeWidth="2" />
        <Arrow x={110} y={92} dx={36} color={blue} label="T₁" offset={-6} width={2} />
        <Arrow x={200} y={92} dx={-36} color={blue} label="T₁" offset={-6} width={2} />
        <Arrow x={290} y={92} dx={36} color={green} label="T₂" offset={-6} width={2} />
        <Arrow x={380} y={92} dx={-36} color={green} label="T₂" offset={-6} width={2} />
        <Arrow x={490} y={105} dx={55} color={slate} label="F" offset={-8} />
      </Diagram>
    </Figure>
  );
}

export function BankedCurveDiagram() {
  const theta = (22 * Math.PI) / 180;
  const cx = 280, cy = 150;
  const ux = Math.cos(theta), uy = -Math.sin(theta); // along the road surface, rising to the right (outside)
  const nx = Math.sin(theta), ny = -Math.cos(theta); // normal, pointing up and inward
  return (
    <Figure id="7.9" title="Hình 7.9 · Ô tô trên đoạn cua nghiêng (Câu 43, mặt cắt ngang)"
      caption="Tâm cua ở bên trái. Mặt đường nghiêng góc θ, mép ngoài cao hơn mép trong. Phản lực N vuông góc mặt đường; khi xe chạy ở tốc độ lớn nhất, ma sát nghỉ Fₘₛₙ hướng dọc mặt đường xuống phía trong. Hợp lực của các lực nằm ngang, hướng vào tâm cua.">
      <Diagram label="Mặt cắt ngang đường cua nghiêng với các lực P, N và ma sát." height={240}>
        <line x1={cx - 230 * ux} y1={cy - 230 * uy + 30} x2={cx + 230 * ux} y2={cy + 230 * uy + 30} stroke="#94a3b8" strokeWidth="4" />
        <rect x={cx - 40} y={cy - 4} width="80" height="30" rx="5" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="2" transform={`rotate(${-22} ${cx} ${cy + 26})`} />
        <Arrow x={cx} y={cy + 6} dx={0} dy={80} color={slate} label="P" offset={4} labelDx={12} anchor="start" />
        <Arrow x={cx} y={cy + 6} dx={nx * -90} dy={ny * 90} color={green} label="N" offset={-4} anchor="end" labelDx={-4} />
        <Arrow x={cx} y={cy + 26} dx={-ux * 70} dy={-uy * 70} color={orange} label="Fₘₛₙ" offset={18} anchor="end" />
        <Arrow x={110} y={40} dx={-70} color={blue} label="về tâm cua" offset={-8} anchor="start" labelDx={-4} />
        <text x={cx + 150} y={cy + 78} fontSize="13" fill="#334155">θ</text>
        <line x1={cx + 60} y1={cy + 90} x2={cx + 230} y2={cy + 90} stroke="#cbd5e1" strokeDasharray="4 4" />
      </Diagram>
    </Figure>
  );
}
