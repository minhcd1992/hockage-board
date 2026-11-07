import { Arrow, Diagram, Figure, blue, green, orange, purple, slate } from '@/components/lesson/FigureKit';

const rad = (deg: number) => (deg * Math.PI) / 180;

export function InclineSlideDiagram() {
  const t = rad(30);
  const ax = 120, ay = 50, len = 340;
  const bx = ax + len * Math.cos(t), by = ay + len * Math.sin(t);
  const ux = Math.cos(t), uy = Math.sin(t); // down the slope
  const nx = Math.sin(t), ny = -Math.cos(t); // out of the slope (up-right... normal away from surface)
  const mx = ax + 0.42 * len * ux, my = ay + 0.42 * len * uy;
  const c = { x: mx - 16 * nx * -1, y: my - 16 * ny * -1 };
  return (
    <Figure id="9.6" title="Hình 9.6 · Vật trượt từ đỉnh A xuống chân B (Câu 42)"
      caption="Trọng lực P có thành phần dọc dốc hướng xuống, cùng chiều dịch chuyển, nên công dương. Ma sát trượt ngược chiều dịch chuyển, công âm. Phản lực N vuông góc với dịch chuyển nên không sinh công.">
      <Diagram label="Vật trên mặt phẳng nghiêng 30 độ." height={230}>
        <polygon points={`${ax},${ay} ${bx},${by} ${ax},${by}`} fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
        <text x={ax - 14} y={ay + 4} fontSize="13" fontWeight="700">A</text>
        <text x={bx + 6} y={by + 4} fontSize="13" fontWeight="700">B</text>
        <text x={bx - 56} y={by - 8} fontSize="12">θ = 30°</text>
        <g transform={`rotate(30 ${c.x} ${c.y})`}>
          <rect x={c.x - 22} y={c.y - 16} width="44" height="32" rx="4" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
        </g>
        <Arrow x={c.x} y={c.y} dx={0} dy={70} color={slate} label="P" offset={14} labelDx={-12} />
        <Arrow x={c.x} y={c.y} dx={nx * 60} dy={ny * 60} color={green} label="N" offset={-4} labelDx={10} />
        <Arrow x={c.x} y={c.y} dx={-ux * 55} dy={-uy * 55} color={orange} label="Fₘₛₜ" offset={-6} />
        <Arrow x={c.x + nx * 30 + ux * 30} y={c.y + ny * 30 + uy * 30} dx={ux * 70} dy={uy * 70} color={purple} label="d" offset={-6} labelDx={10} />
      </Diagram>
    </Figure>
  );
}

export function ThrowWorkDiagram() {
  const top = 40, ground = 210, x0 = 90;
  const pts = Array.from({ length: 31 }, (_, i) => {
    const tt = (3 * i) / 30; // s
    return `${x0 + 15 * tt * 9},${top + 5 * tt * tt * (ground - top) / 45}`;
  }).join(' ');
  const endX = x0 + 45 * 9;
  return (
    <Figure id="9.7" title="Hình 9.7 · Viên bi ném ngang từ đỉnh tháp (Câu 45)"
      caption="Công của trọng lực chỉ phụ thuộc độ cao giảm đi (W = mgh), không phụ thuộc dạng quỹ đạo. Ngay trước khi chạm đất, chỉ thành phần vận tốc thẳng đứng v_y cùng phương với trọng lực, nên công suất tức thời của trọng lực là P = mg·v_y.">
      <Diagram label="Quỹ đạo parabol của viên bi ném ngang." height={240}>
        <rect x="40" y={top} width="50" height={ground - top} fill="#e2e8f0" stroke="#475569" />
        <line x1="20" y1={ground} x2="540" y2={ground} stroke="#475569" strokeWidth="3" />
        <polyline points={pts} fill="none" stroke={blue} strokeWidth="2.5" strokeDasharray="6 4" />
        <circle cx={x0} cy={top} r="6" fill="#0f172a" />
        <Arrow x={x0} y={top} dx={60} color={blue} label="v₀" offset={-8} />
        <line x1="70" y1={top} x2="70" y2={ground} stroke={purple} strokeWidth="1.5" />
        <text x="62" y={(top + ground) / 2} textAnchor="end" fontSize="13" fill={purple}>h</text>
        <circle cx={Math.min(endX, 520)} cy={ground} r="6" fill="#0f172a" />
        <Arrow x={Math.min(endX, 520) - 40} y={ground - 70} dx={0} dy={50} color={orange} label="v_y" offset={0} labelDx={-14} />
        <Arrow x={Math.min(endX, 520) - 40} y={ground - 70} dx={22} dy={0} color={green} label="vₓ" offset={-6} />
        <Arrow x={Math.min(endX, 520) - 90} y={ground - 110} dx={0} dy={40} color={slate} label="P" offset={14} labelDx={10} />
      </Diagram>
    </Figure>
  );
}
