'use client';
import React, { useState, useEffect, useRef } from 'react';

export const SpeedometerSim = () => {
  const [speed, setSpeed] = useState(80);
  const [radarSpeed, setRadarSpeed] = useState(88.5);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuating speed for speedometer
      setSpeed(80 + Math.random() * 4 - 2);
      // Fluctuating speed for radar
      setRadarSpeed(88.5 + Math.random() * 2 - 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const angle = (speed / 160) * 180 - 90; // Map 0-160 km/h to -90 to +90 degrees

  return (
    <div className="flex flex-col md:flex-row gap-6 justify-center items-center my-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
      {/* Speedometer */}
      <div className="relative w-48 h-48 bg-slate-800 rounded-full flex items-center justify-center border-8 border-slate-700 shadow-xl overflow-hidden">
        <div className="absolute top-4 text-slate-400 text-xs font-bold tracking-widest">km/h</div>
        
        {/* Ticks */}
        {Array.from({ length: 9 }).map((_, i) => {
          const tickAngle = (i * 20 / 160) * 180 - 90;
          return (
            <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${tickAngle}deg)` }}>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-slate-300"></div>
              <div className="absolute top-6 left-1/2 -translate-x-1/2 text-slate-300 text-xs font-bold" style={{ transform: `rotate(${-tickAngle}deg)` }}>
                {i * 20}
              </div>
            </div>
          );
        })}
        
        {/* Needle */}
        <div 
          className="absolute bottom-1/2 left-1/2 w-1 h-20 bg-red-500 origin-bottom rounded-t-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        ></div>
        
        <div className="absolute w-6 h-6 bg-slate-900 rounded-full border-2 border-slate-600"></div>
        
        {/* Odometer */}
        <div className="absolute bottom-8 bg-slate-900 text-cyan-400 font-mono text-sm px-2 py-0.5 rounded border border-slate-700">
          12540
        </div>
        <div className="absolute bottom-2 text-slate-400 text-[10px]">ODO</div>
      </div>
      
      <div className="text-3xl font-black text-slate-300 px-4">VS</div>
      
      {/* Radar Gun */}
      <div className="flex flex-col items-center">
        <div className="w-40 h-28 bg-yellow-500 rounded-xl border-4 border-yellow-600 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-yellow-600"></div>
          <div className="text-xs font-bold text-yellow-900 mb-1">RADAR GUN</div>
          <div className="bg-black text-red-500 font-mono text-4xl p-2 rounded border-2 border-slate-800 shadow-inner tracking-widest min-w-[120px] text-center">
            {radarSpeed.toFixed(1)}
          </div>
        </div>
        <div className="w-8 h-16 bg-slate-800 rounded-b-md shadow-lg border-x-4 border-b-4 border-slate-900"></div>
      </div>
    </div>
  );
};

export const CurvedPathSim = () => {
  return (
    <div className="flex flex-col items-center my-6">
      <svg width="400" height="250" className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
        <defs>
          <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
          </marker>
          <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
          </marker>
        </defs>
        
        {/* Axes */}
        <line x1="20" y1="230" x2="380" y2="230" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrowBlue)" />
        <line x1="20" y1="230" x2="20" y2="20" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrowBlue)" />
        <text x="375" y="245" fontSize="12" fill="#64748b" fontWeight="bold">x</text>
        <text x="5" y="25" fontSize="12" fill="#64748b" fontWeight="bold">y</text>
        <text x="5" y="245" fontSize="12" fill="#64748b" fontWeight="bold">O</text>
        
        {/* Trajectory */}
        <path d="M 80 180 Q 150 50 300 120" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6 6" />
        
        {/* Displacement Vector d */}
        <line x1="80" y1="180" x2="300" y2="120" stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowBlue)" />
        
        {/* Average Velocity Vector v_tb (scaled up slightly for visibility, same direction) */}
        <line x1="80" y1="180" x2="190" y2="150" stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrowRed)" />
        
        {/* Points */}
        <circle cx="80" cy="180" r="5" fill="#1e293b" />
        <circle cx="300" cy="120" r="5" fill="#1e293b" />
        
        {/* Labels */}
        <text x="50" y="195" fontSize="14" fill="#1e293b" fontWeight="bold">M₁</text>
        <text x="310" y="135" fontSize="14" fill="#1e293b" fontWeight="bold">M₂</text>
        <text x="200" y="165" fontSize="14" fill="#10b981" fontWeight="bold">d</text>
        <text x="120" y="150" fontSize="14" fill="#ef4444" fontWeight="bold">v_tb</text>
        <text x="200" y="90" fontSize="14" fill="#94a3b8" fontWeight="bold">Quỹ đạo</text>
      </svg>
      <p className="text-sm text-slate-500 mt-2 italic">Mô hình: Vectơ vận tốc trung bình luôn cùng phương, cùng chiều với độ dịch chuyển.</p>
    </div>
  );
};

export const SatelliteSim = () => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      setAngle(prev => (prev + (dt / 1000) * 45) % 360); // 45 degrees per second
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const R = 80;
  const cx = 200;
  const cy = 150;
  const rad = (angle * Math.PI) / 180;
  const satX = cx + R * Math.cos(rad);
  const satY = cy + R * Math.sin(rad);
  
  // Tangent vector
  const vx = -Math.sin(rad) * 40;
  const vy = Math.cos(rad) * 40;

  return (
    <div className="flex flex-col items-center my-6">
      <svg width="400" height="300" className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800">
        <defs>
          <marker id="arrowSat" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
          </marker>
        </defs>
        
        {/* Orbit */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Earth */}
        <circle cx={cx} cy={cy} r="30" fill="#0ea5e9" />
        <circle cx={cx - 10} cy={cy - 10} r="10" fill="#22c55e" />
        <circle cx={cx + 10} cy={cy + 5} r="8" fill="#22c55e" />
        
        {/* Satellite */}
        <rect x={satX - 6} y={satY - 6} width="12" height="12" fill="#cbd5e1" rx="2" />
        <line x1={satX - 15} y1={satY} x2={satX + 15} y2={satY} stroke="#94a3b8" strokeWidth="2" />
        
        {/* Velocity Vector */}
        <line x1={satX} y1={satY} x2={satX + vx} y2={satY + vy} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowSat)" />
        <text x={satX + vx + 10} y={satY + vy + 10} fontSize="14" fill="#ef4444" fontWeight="bold">v</text>
        
        <text x="10" y="25" fontSize="14" fill="#f8fafc" fontWeight="bold">|v| = 7.8 km/s (Không đổi)</text>
        <text x="10" y="45" fontSize="14" fill="#ef4444" fontWeight="bold">Hướng của v: Thay đổi liên tục</text>
      </svg>
    </div>
  );
};

export const RealWorldSim = () => {
  return (
    <div className="flex flex-col md:flex-row gap-6 my-8">
      {/* Tình huống 1: Xe máy vào cua */}
      <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
        <h4 className="font-bold text-slate-700 mb-4 text-center">Tình huống 1: Xe ôm cua đều</h4>
        <svg width="200" height="150" viewBox="0 0 200 150">
          <path d="M 20 130 C 50 130, 100 80, 150 20" fill="none" stroke="#94a3b8" strokeWidth="40" strokeLinecap="round" />
          <path d="M 20 130 C 50 130, 100 80, 150 20" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 10" />
          
          <g transform="translate(80, 80) rotate(-45)">
            <rect x="-10" y="-15" width="20" height="30" fill="#ef4444" rx="4" />
            <circle cx="0" cy="-10" r="6" fill="#1e293b" />
            <line x1="0" y1="0" x2="0" y2="-40" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrowBlue)" />
          </g>
          <text x="100" y="50" fill="#3b82f6" fontSize="12" fontWeight="bold">v = 40 km/h</text>
        </svg>
        <p className="text-sm text-slate-500 text-center mt-4">Tốc độ không đổi 40km/h, nhưng hướng liên tục thay đổi → Vận tốc thay đổi.</p>
      </div>

      {/* Tình huống 2: 2 Ô tô rẽ */}
      <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
        <h4 className="font-bold text-slate-700 mb-4 text-center">Tình huống 2: Khác hướng đi</h4>
        <svg width="200" height="150" viewBox="0 0 200 150">
          {/* Đường */}
          <path d="M 100 150 L 100 80 L 30 20 M 100 80 L 170 20" fill="none" stroke="#94a3b8" strokeWidth="30" strokeLinejoin="round" />
          <path d="M 100 150 L 100 80 L 30 20 M 100 80 L 170 20" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 10" />
          
          {/* Xe 1 */}
          <g transform="translate(60, 45) rotate(-40)">
            <rect x="-8" y="-15" width="16" height="30" fill="#3b82f6" rx="2" />
            <line x1="0" y1="0" x2="0" y2="-30" stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowBlue)" />
          </g>
          <text x="15" y="40" fill="#10b981" fontSize="12" fontWeight="bold">60 km/h</text>

          {/* Xe 2 */}
          <g transform="translate(140, 45) rotate(40)">
            <rect x="-8" y="-15" width="16" height="30" fill="#eab308" rx="2" />
            <line x1="0" y1="0" x2="0" y2="-30" stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowBlue)" />
          </g>
          <text x="145" y="40" fill="#10b981" fontSize="12" fontWeight="bold">60 km/h</text>
        </svg>
        <p className="text-sm text-slate-500 text-center mt-4">Cùng tốc độ 60km/h xuất phát từ 1 ngã ba, nhưng vị trí cuối cách xa nhau.</p>
      </div>
    </div>
  );
};

export const LimitVelocitySim = () => {
  const [qx, setQx] = useState(240); // from 240 down to 80
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const f = (x: number) => Math.pow(x - 150, 2) / 100 + 50;
  
  const px = 80;
  const py = f(px);

  // Clamp qx between px and 240
  const clampedQx = Math.max(px, Math.min(240, qx));
  const qy = f(clampedQx);
  
  // dt mapping for display
  const dt = (clampedQx - px) / 40;

  let dx = clampedQx - px;
  let dy = qy - py;
  
  if (dt <= 0.05) { // Threshold for tangent
    dx = 40;
    dy = (2 * (px - 150) / 100) * dx;
  }

  const len = Math.sqrt(dx*dx + dy*dy);
  const ndx = dx / len;
  const ndy = dy / len;

  const lineStartX = px - ndx * 150;
  const lineStartY = py - ndy * 150;
  const lineEndX = px + ndx * 250;
  const lineEndY = py + ndy * 250;

  let dPath = `M 0 ${f(0)}`;
  for (let x = 10; x <= 300; x += 10) {
    dPath += ` L ${x} ${f(x)}`;
  }

  const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = (e as any).clientX;
    pt.y = (e as any).clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    setQx(cursorPt.x);
  };

  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    const handleMove = (e: PointerEvent) => handlePointerMove(e);
    
    if (isDragging) {
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointermove', handleMove);
    }
    return () => {
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointermove', handleMove);
    };
  }, [isDragging]);

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner my-6 flex flex-col md:flex-row gap-6 items-center select-none">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Mô phỏng Giới hạn: Tiếp tuyến và Vận tốc tức thời</h3>
        <p className="text-sm text-slate-600 mb-4">
          Hãy <strong>nắm và kéo điểm Q</strong> trượt dọc theo đồ thị về phía điểm P. <br/>
          Khi điểm Q ngày càng gần điểm P (<span className="font-serif italic">Δt → 0</span>), Cát tuyến màu xanh lam sẽ xoay và dần tiệm cận với Tiếp tuyến màu xanh lá tại P.
        </p>
        
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm inline-block">
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Khoảng thời gian: <span className="font-serif italic text-blue-600 font-bold text-lg">Δt = {dt > 0.05 ? dt.toFixed(2) : '0'}</span> s
          </label>
        </div>
      </div>

      <div className="w-[300px] h-[250px] relative bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm touch-none">
        <svg ref={svgRef} width="300" height="250" viewBox="0 0 300 250" className="w-full h-full block">
          <defs>
            <marker id="arrowRedSim" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
            </marker>
          </defs>
          
          <g stroke="#f1f5f9" strokeWidth="1">
            {Array.from({length: 15}).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={0} y1={i*20} x2={300} y2={i*20} />
                <line x1={i*20} y1={0} x2={i*20} y2={250} />
              </React.Fragment>
            ))}
          </g>

          <path d={dPath} fill="none" stroke="#94a3b8" strokeWidth="4" />
          
          <line 
            x1={lineStartX} y1={lineStartY} 
            x2={lineEndX} y2={lineEndY} 
            stroke={dt <= 0.05 ? '#22c55e' : '#3b82f6'} 
            strokeWidth="2" 
            strokeDasharray={dt <= 0.05 ? "" : "6 6"} 
          />

          <line 
            x1={px} y1={py} 
            x2={px + ndx * 80} y2={py + ndy * 80} 
            stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowRedSim)" 
          />

          <circle cx={px} cy={py} r="5" fill="#1e293b" />
          <text x={px - 15} y={py + 20} fontSize="14" fontWeight="bold" fill="#1e293b">P</text>

          {dt > 0.05 && (
            <g 
              onPointerDown={() => setIsDragging(true)}
              className="cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
            >
              {/* Invisible larger hit area for easier dragging */}
              <circle cx={clampedQx} cy={qy} r="25" fill="transparent" />
              <circle cx={clampedQx} cy={qy} r="8" fill="#3b82f6" />
              <text x={clampedQx + 12} y={qy + 5} fontSize="14" fontWeight="bold" fill="#3b82f6">Q</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

