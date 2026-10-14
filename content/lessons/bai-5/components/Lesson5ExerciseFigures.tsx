import { Angle, Arrow, Diagram, Figure, orange, green, slate, rad } from './Lesson5Diagram';

export function BridgeExerciseDiagram() {
  const length = 110, dx = length * Math.cos(rad(35)), dy = length * Math.sin(rad(35));
  return <Figure id="Sơ đồ lực câu 41" title="Câu 41 · Sơ đồ lực của mô hình chất điểm" exercise caption="Góc 35° đo từ phương ngang. Ba vectơ dùng cùng tỉ lệ: hai thành phần đứng của lực căng cân bằng P; hai thành phần ngang triệt tiêu. Sơ đồ này không thể hiện nội lực trong dầm.">
    <Diagram label="Hai lực căng hợp phương ngang đúng 35 độ, tổng các thành phần đứng cân bằng trọng lực">
      <path d="M 110 103 H 450" stroke="#cbd5e1" strokeDasharray="5 4" />
      <Angle x={280} y={103} radius={44} from={-180} to={-145} label="35°" />
      <Angle x={280} y={103} radius={44} from={-35} to={0} label="35°" />
      <Arrow x={280} y={103} dx={-dx} dy={-dy} label="T₁" />
      <Arrow x={280} y={103} dx={dx} dy={-dy} label="T₂" color={orange} />
      <Arrow x={280} y={103} dx={0} dy={2 * dy} label="P = Mg" color={green} offset={24} />
      <circle cx="280" cy="103" r="4" fill="#334155" /><text x="292" y="127" fontSize="16">O</text>
    </Diagram>
  </Figure>;
}

export function BeamExerciseDiagram() {
  const ax = 90, cy = 130, cx = 285, bx = 480;
  const top = cy - (cx - ax) * Math.tan(rad(30));
  return <Figure id="Sơ đồ lực câu 45" title="Câu 45 · Thanh, điểm treo và các lực tác dụng" exercise caption="C là trung điểm AB; dây CD hợp thanh đúng 30°. Biển truyền lực PB xuống B; dây kéo C về D. Qx và Qy là hai thành phần của phản lực bản lề, với chiều xác định từ lời giải. Mũi tên chỉ hướng lực.">
    <Diagram label="Thanh nằm ngang có biển ở đầu B, dây CD từ trung điểm C lên tường và phản lực tại bản lề A">
      <path d="M 78 8 V 205" stroke="#94a3b8" strokeWidth="9" />
      {[22,48,74,100,126,152,178].map(y => <path key={y} d={`M 61 ${y + 13} L 77 ${y}`} stroke="#cbd5e1" strokeWidth="2" />)}
      <path d={`M 78 ${top} H ${ax} M 78 ${cy} H ${ax}`} stroke={slate} strokeWidth="3" />
      <path d={`M ${ax} ${cy} H ${bx}`} stroke="#64748b" strokeWidth="7" />
      <path d={`M ${ax} ${top} L ${cx} ${cy}`} stroke={slate} strokeWidth="2" />
      <path d={`M ${bx-8} ${cy} V 149 M ${bx+8} ${cy} V 149`} stroke={slate} strokeWidth="2" />
      <rect x={bx - 42} y="149" width="84" height="38" rx="4" fill="#e0f2fe" stroke="#7dd3fc" />
      <text x={bx} y="173" textAnchor="middle" fill="#0c4a6e" fontSize="14">BIỂN</text>
      <Angle x={cx} y={cy} radius={46} from={-180} to={-150} label="30°" />
      <Arrow x={cx} y={cy} dx={-105 * Math.cos(rad(30))} dy={-105 * Math.sin(rad(30))} label="T" />
      <Arrow x={bx} y={cy} dx={0} dy={96} label="PB" color={green} offset={23} />
      <Arrow x={ax} y={cy} dx={90} dy={0} label="Qx" color={orange} offset={28} />
      <Arrow x={ax} y={cy} dx={0} dy={74} label="Qy" color={orange} labelDx={-26} offset={6} />
      <circle cx={ax} cy={cy} r="6" fill="white" stroke="#334155" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="4" fill="#334155" /><circle cx={bx} cy={cy} r="4" fill="#334155" />
      <text x="97" y="115" fontSize="16">A</text><text x={cx + 9} y="153" fontSize="16">C</text><text x={bx + 10} y="121" fontSize="16">B</text><text x="95" y={top + 4} fontSize="16">D</text>
      <path d="M 90 223 H 480 M 90 218 V 228 M 285 218 V 228 M 480 218 V 228" stroke="#cbd5e1" />
      <text x="188" y="246" textAnchor="middle" fontSize="15" fill={slate}>AC = 1 m</text><text x="382.5" y="246" textAnchor="middle" fontSize="15" fill={slate}>CB = 1 m</text>
    </Diagram>
  </Figure>;
}
