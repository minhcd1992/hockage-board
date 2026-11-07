import { Arrow, Diagram, Figure, blue, green, orange, purple, slate } from '@/components/lesson/FigureKit';

const rad = (deg: number) => (deg * Math.PI) / 180;

export function CurbWheelDiagram() {
  const R = 100, h = 25; // px: R = 0,4 m, h = 0,1 m
  const groundY = 200, cornerX = 330;
  const cx = cornerX - Math.sqrt(R * R - (R - h) * (R - h)), cy = groundY - R;
  return (
    <Figure id="8.8" title="Hình 8.8 · Bánh xe vượt gờ (TLN Câu 37)"
      caption="Khi bánh xe vừa nhấc khỏi mặt đường, nó chỉ còn tiếp xúc với mép gờ O, nên ta lấy momen đối với O. Cánh tay đòn của lực kéo ngang F là R − h; của trọng lực P là √(R² − (R − h)²).">
      <Diagram label="Bánh xe tựa vào mép gờ." height={230}>
        <line x1="20" y1={groundY} x2={cornerX} y2={groundY} stroke="#475569" strokeWidth="3" />
        <rect x={cornerX} y={groundY - h} width="200" height={h + 20} fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={R} fill="#f1f5f9" stroke="#1e293b" strokeWidth="8" />
        <circle cx={cx} cy={cy} r="5" fill="#0f172a" />
        <circle cx={cornerX} cy={groundY - h} r="5" fill={purple} />
        <text x={cornerX + 6} y={groundY - h - 8} fontSize="13" fontWeight="700" fill={purple}>O</text>
        <Arrow x={cx} y={cy} dx={80} color={blue} label="F" offset={-8} />
        <Arrow x={cx} y={cy} dx={0} dy={70} color={slate} label="P" offset={14} labelDx={-12} />
        <line x1={cx} y1={groundY - h} x2={cornerX} y2={groundY - h} stroke={green} strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={(cx + cornerX) / 2} y={groundY - h + 16} textAnchor="middle" fontSize="12" fill={green}>d_P</text>
        <line x1={cornerX + 30} y1={cy} x2={cornerX + 30} y2={groundY - h} stroke={blue} strokeWidth="1.5" />
        <text x={cornerX + 36} y={(cy + groundY - h) / 2 + 4} fontSize="12" fill={blue}>d_F = R − h</text>
      </Diagram>
    </Figure>
  );
}

export function PulleyInclineDiagram() {
  const b = rad(30);
  const topX = 400, topY = 60, baseY = 210;
  const baseX = topX - (baseY - topY) / Math.tan(b);
  const ux = Math.cos(b), uy = -Math.sin(b); // up the slope
  const bx = topX - 150 * ux, by = topY - 150 * uy; // block centre on slope
  return (
    <Figure id="8.9" title="Hình 8.9 · Hai vật nối dây qua ròng rọc có khối lượng (Câu 43)"
      caption="Vật m₁ trên mặt nghiêng góc β = 30°, vật m₂ treo thẳng đứng. Vì ròng rọc có khối lượng, lực căng hai bên khác nhau: T₁ kéo m₁, T₂ kéo m₂. Hiệu T₂ − T₁ tạo momen làm ròng rọc quay nhanh dần.">
      <Diagram label="Vật trên mặt nghiêng nối với vật treo qua ròng rọc." height={240}>
        <polygon points={`${baseX},${baseY} ${topX},${topY} ${topX},${baseY}`} fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
        <circle cx={topX + 14} cy={topY - 14} r="20" fill="#e2e8f0" stroke="#334155" strokeWidth="3" />
        <circle cx={topX + 14} cy={topY - 14} r="3" fill="#0f172a" />
        <g transform={`rotate(-30 ${bx} ${by})`}>
          <rect x={bx - 24} y={by - 34} width="48" height="34" rx="4" fill="#bfdbfe" stroke={blue} strokeWidth="2" />
          <text x={bx} y={by - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill={blue}>m₁</text>
        </g>
        <line x1={bx + 24 * ux + 17 * Math.sin(b)} y1={by + 24 * uy - 17 * Math.cos(b)} x2={topX + 14 - 20 * Math.sin(b)} y2={topY - 14 - 20 * Math.cos(b)} stroke="#475569" strokeWidth="1.5" />
        <line x1={topX + 34} y1={topY - 14} x2={topX + 34} y2={topY + 90} stroke="#475569" strokeWidth="1.5" />
        <rect x={topX + 18} y={topY + 90} width="32" height="36" rx="4" fill="#fed7aa" stroke={orange} strokeWidth="2" />
        <text x={topX + 34} y={topY + 113} textAnchor="middle" fontSize="13" fontWeight="700" fill={orange}>m₂</text>
        <Arrow x={topX + 34} y={topY + 126} dx={0} dy={42} color={slate} label="P₂" offset={14} labelDx={14} />
        <Arrow x={topX + 34} y={topY + 90} dx={0} dy={-36} color={green} label="T₂" offset={0} labelDx={16} />
        <Arrow x={bx + 26 * ux} y={by + 26 * uy - 14} dx={ux * 50} dy={uy * 50} color={green} label="T₁" offset={-6} />
        <Arrow x={bx - 26 * ux} y={by - 26 * uy - 4} dx={-ux * 40} dy={-uy * 40} color={orange} label="Fₘₛₜ" offset={16} />
        <text x={baseX + 48} y={baseY - 8} fontSize="13">β = 30°</text>
      </Diagram>
    </Figure>
  );
}

export function BrakingLoadDiagram() {
  const groundY = 200, frontX = 420, rearX = 140, gX = frontX - 0.47 * (frontX - rearX), gY = 120;
  return (
    <Figure id="8.10" title="Hình 8.10 · Lực tác dụng lên ô tô khi phanh gấp (Câu 44)"
      caption="Xe chạy sang phải và đang phanh. Ma sát của mặt đường lên các bánh hướng về phía sau, đặt ở mặt đường, thấp hơn trọng tâm G một khoảng h. Momen của các lực ma sát đối với G làm xe có xu hướng chúc đầu; phản lực bánh trước N_tr phải tăng, bánh sau N_s giảm để xe không quay.">
      <Diagram label="Ô tô phanh với phản lực trước, sau và lực ma sát." height={240}>
        <line x1="20" y1={groundY} x2="540" y2={groundY} stroke="#94a3b8" strokeWidth="3" />
        <path d={`M ${rearX - 50} 170 L ${rearX - 40} 120 Q ${rearX} 80 ${rearX + 80} 80 L ${frontX - 40} 80 Q ${frontX + 20} 90 ${frontX + 50} 130 L ${frontX + 55} 170 Z`} fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="2" />
        <circle cx={rearX} cy="176" r="24" fill="#1e293b" /><circle cx={frontX} cy="176" r="24" fill="#1e293b" />
        <circle cx={gX} cy={gY} r="5" fill="#0f172a" />
        <text x={gX + 8} y={gY - 6} fontSize="13" fontWeight="700">G</text>
        <Arrow x={gX} y={gY} dx={0} dy={60} color={slate} label="P" offset={14} labelDx={10} />
        <Arrow x={frontX} y={groundY} dx={0} dy={-70} color={green} label="N_tr" offset={-4} labelDx={20} />
        <Arrow x={rearX} y={groundY} dx={0} dy={-44} color={green} label="N_s" offset={-4} labelDx={-18} />
        <Arrow x={frontX} y={groundY + 4} dx={-50} color={orange} label="F_tr" offset={20} />
        <Arrow x={rearX} y={groundY + 4} dx={-34} color={orange} label="F_s" offset={20} />
        <line x1={gX - 60} y1={gY} x2={gX - 60} y2={groundY} stroke={purple} strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={gX - 66} y={(gY + groundY) / 2} textAnchor="end" fontSize="12" fill={purple}>h</text>
        <text x="520" y="40" textAnchor="end" fontSize="13" fill="#334155">v → , gia tốc ←</text>
      </Diagram>
    </Figure>
  );
}

export function BoxInclineDiagram() {
  const a = rad(20);
  const ox = 120, oy = 210, len = 380;
  const ux = Math.cos(a), uy = -Math.sin(a);
  const nx = -Math.sin(a), ny = -Math.cos(a); // normal pointing up-left (out of slope)
  const W = 60, H = 120; // px, ratio W/H = 0,5
  const footX = ox + 190 * ux, footY = oy + 190 * uy; // lower front corner on slope
  const corner = (s: number, t: number) => ({ x: footX + s * ux + t * nx, y: footY + s * uy + t * ny });
  const p = [corner(0, 0), corner(W, 0), corner(W, H), corner(0, H)];
  const g = corner(W / 2, H / 2);
  return (
    <Figure id="8.11" title="Hình 8.11 · Khối hộp trên mặt phẳng nghiêng (Câu 45)"
      caption="Hộp bắt đầu lật quanh mép dưới A khi giá của trọng lực đi qua mép A, tức tanα = W/H. Hộp bắt đầu trượt khi tanα = μₙ. Điều kiện nào đạt trước khi tăng dần α thì hiện tượng đó xảy ra trước.">
      <Diagram label="Hộp chữ nhật trên mặt nghiêng, giá trọng lực." height={240}>
        <polygon points={`${ox},${oy} ${ox + len * ux},${oy + len * uy} ${ox + len * ux},${oy}`} fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
        <polygon points={p.map(q => `${q.x},${q.y}`).join(' ')} fill="#fde68a" stroke="#b45309" strokeWidth="2" />
        <circle cx={g.x} cy={g.y} r="4" fill="#0f172a" />
        <text x={g.x + 6} y={g.y - 6} fontSize="13" fontWeight="700">G</text>
        <line x1={g.x} y1={g.y} x2={g.x} y2={oy + 10} stroke={slate} strokeDasharray="5 4" />
        <Arrow x={g.x} y={g.y} dx={0} dy={50} color={slate} label="P" offset={14} labelDx={10} />
        <circle cx={p[0].x} cy={p[0].y} r="4" fill={purple} />
        <text x={p[0].x - 14} y={p[0].y + 18} fontSize="13" fontWeight="700" fill={purple}>A</text>
        <text x={(p[2].x + p[3].x) / 2} y={(p[2].y + p[3].y) / 2 - 8} textAnchor="middle" fontSize="12" fill={blue}>W</text>
        <text x={(p[1].x + p[2].x) / 2 + 10} y={(p[1].y + p[2].y) / 2} fontSize="12" fill={blue}>H</text>
        <text x={ox + 60} y={oy - 6} fontSize="13">α</text>
        <text x="540" y="230" textAnchor="end" fontSize="12" fill={green}>Giá của P còn nằm trong mặt đáy → chưa lật</text>
      </Diagram>
    </Figure>
  );
}
