'use client';
import React, { useState, useEffect } from 'react';

export const FerrisWheelSim = () => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setAngle((prev) => (prev + 0.01) % (2 * Math.PI));
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const cx = 150;
  const cy = 140;
  const r = 80;

  // 6 spokes
  const spokes = Array.from({ length: 6 }).map((_, i) => {
    const a = angle + (i * Math.PI) / 3;
    const x = Number((cx + r * Math.cos(a)).toFixed(3));
    const y = Number((cy + r * Math.sin(a)).toFixed(3));
    // Calculate a point halfway along the spoke for rotation trace
    const halfX = Number((cx + (r / 2) * Math.cos(a)).toFixed(3));
    const halfY = Number((cy + (r / 2) * Math.sin(a)).toFixed(3));
    return { x, y, halfX, halfY };
  });

  return (
    <div className="w-full flex justify-center p-4">
      <svg viewBox="0 0 300 320" className="w-full max-w-[300px] h-auto bg-sky-50 rounded-xl shadow-sm border border-sky-100">
        {/* Base */}
        <path d="M 100 300 L 150 140 L 200 300" fill="none" stroke="#64748b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="80" y1="300" x2="220" y2="300" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        
        {/* Trajectories for Translation (Baskets) */}
        <circle cx={cx - 10} cy={cy + 15} r={r} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" strokeDasharray="4,4" />
        <circle cx={cx + 10} cy={cy + 15} r={r} fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" strokeDasharray="4,4" />

        {/* Trajectories for Rotation (Spokes) */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={r / 2} fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="2" />

        {/* Main wheel rim */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#cbd5e1" strokeWidth="6" />
        <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke="#94a3b8" strokeWidth="2" />

        {/* Spokes */}
        {spokes.map((p, i) => (
          <g key={`spoke-${i}`}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={i === 0 ? "#334155" : "#cbd5e1"} strokeWidth={i === 0 ? "3" : "4"} />
            {i === 0 && (
              <>
                <circle cx={p.halfX} cy={p.halfY} r="4" fill="#ef4444" />
                <circle cx={p.x} cy={p.y} r="4" fill="#ef4444" />
              </>
            )}
          </g>
        ))}
        
        {/* Center hub */}
        <circle cx={cx} cy={cy} r="12" fill="#3b82f6" />
        <circle cx={cx} cy={cy} r="6" fill="#1e40af" />

        {/* Baskets */}
        {spokes.map((p, i) => (
          <g key={`basket-${i}`} transform={`translate(${p.x}, ${p.y})`}>
            {/* Hinge */}
            <line x1="0" y1="0" x2="0" y2="15" stroke="#64748b" strokeWidth="2" />
            <circle cx="0" cy="0" r="3" fill="#64748b" />
            {/* Basket body */}
            <path d="M -15 15 L 15 15 L 10 30 L -10 30 Z" fill={i === 0 ? "#eab308" : "#ef4444"} stroke={i === 0 ? "#ca8a04" : "#b91c1c"} strokeWidth="2" strokeLinejoin="round" />
            {/* Passenger */}
            <circle cx="0" cy="12" r="4" fill={i === 0 ? "#1e293b" : "#fca5a5"} />
            {/* Tracking points for Translation on the first basket */}
            {i === 0 && (
              <>
                <circle cx="-10" cy="15" r="4" fill="#3b82f6" />
                <circle cx="10" cy="15" r="4" fill="#10b981" />
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export const CarPointSim = () => (
  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded mb-2 w-full text-center">
      TH 1: ĐƯỢC coi là chất điểm
    </span>
    <svg viewBox="0 0 300 80" className="w-full max-w-[250px] h-auto">
        <path d="M 20 40 Q 150 0, 280 40" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />
        <circle cx="20" cy="40" r="4" fill="#ef4444" />
        <text x="20" y="58" fontSize="11" fontWeight="bold" fill="#334155" textAnchor="middle">Hà Nội</text>
        <circle cx="280" cy="40" r="4" fill="#3b82f6" />
        <text x="280" y="58" fontSize="11" fontWeight="bold" fill="#334155" textAnchor="middle">Hải Phòng</text>
        <text x="150" y="15" fontSize="11" fill="#64748b" textAnchor="middle">Khoảng cách: 100 km</text>
        <circle cx="150" cy="20" r="3" fill="#1e293b" />
        <text x="150" y="32" fontSize="10" fill="#1e293b" textAnchor="middle" fontWeight="bold">Ô tô (Điểm)</text>
    </svg>
  </div>
);

export const CarGarageSim = () => (
  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded mb-2 w-full text-center">
      TH 2: KHÔNG LÀ chất điểm
    </span>
    <svg viewBox="0 0 300 80" className="w-full max-w-[250px] h-auto">
        <path d="M 60 70 L 60 10 L 240 10 L 240 70" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8,4" />
        <text x="150" y="25" fontSize="11" fill="#64748b" textAnchor="middle">Gara (Rộng 5m)</text>
        <rect x="70" y="30" width="160" height="30" rx="4" fill="#3b82f6" />
        <circle cx="100" cy="65" r="8" fill="#1e293b" />
        <circle cx="200" cy="65" r="8" fill="#1e293b" />
        <text x="150" y="48" fontSize="10" fill="#ffffff" fontWeight="bold" textAnchor="middle">Ô tô (Dài 4.5m)</text>
    </svg>
  </div>
);

export const Coordinate1D = () => (
  <svg viewBox="-20 0 480 130" className="w-full h-auto bg-slate-50 rounded-lg border border-slate-200 p-2">
      <line x1="20" y1="90" x2="370" y2="90" stroke="#64748b" strokeWidth="2" />
      <polygon points="370,85 380,90 370,95" fill="#64748b" />
      <text x="390" y="95" fontSize="14" fontWeight="bold" fill="#64748b" textAnchor="start">x (m)</text>
      <path d="M 280 40 Q 320 40 360 40" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" />
      <polygon points="360,35 370,40 360,45" fill="#ef4444" />
      <text x="320" y="30" fontSize="12" fill="#ef4444" textAnchor="middle" fontWeight="bold">Chiều dương (+)</text>
      <circle cx="200" cy="90" r="5" fill="#3b82f6" />
      <text x="200" y="120" fontSize="14" fontWeight="bold" fill="#3b82f6" textAnchor="middle">O (0)</text>
      <g stroke="#64748b" strokeWidth="1.5" fontSize="12" fill="#475569" textAnchor="middle">
          {[1, 2, 3, 4, 5].map((i) => (
            <React.Fragment key={`pos-${i}`}>
              <line x1={200 + i * 30} y1="85" x2={200 + i * 30} y2="95" />
              <text x={200 + i * 30} y="112" strokeWidth="0">{i}</text>
            </React.Fragment>
          ))}
          {[1, 2, 3, 4, 5].map((i) => (
            <React.Fragment key={`neg-${i}`}>
              <line x1={200 - i * 30} y1="85" x2={200 - i * 30} y2="95" />
              <text x={200 - i * 30} y="112" strokeWidth="0">{-i}</text>
            </React.Fragment>
          ))}
      </g>
  </svg>
);

export const Coordinate2D = () => (
  <svg viewBox="-60 -20 320 240" className="w-full max-w-[260px] h-auto mx-auto bg-slate-50 rounded-lg border border-slate-200 p-2">
      <path d="M 0 50 L 200 50 M 0 100 L 200 100 M 0 150 L 200 150 M 50 0 L 50 200 M 100 0 L 100 200 M 150 0 L 150 200" stroke="#e2e8f0" strokeWidth="1" fill="none" />
      <line x1="100" y1="20" x2="100" y2="180" stroke="#94a3b8" strokeWidth="2" />
      <polygon points="96,25 100,15 104,25" fill="#94a3b8" />
      <polygon points="96,175 100,185 104,175" fill="#94a3b8" />
      <line x1="20" y1="100" x2="180" y2="100" stroke="#94a3b8" strokeWidth="2" />
      <polygon points="25,96 15,100 25,104" fill="#94a3b8" />
      <polygon points="175,96 185,100 175,104" fill="#94a3b8" />
      <circle cx="100" cy="100" r="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="100,84 104,96 116,100 104,104 100,116 96,104 84,100 96,96" fill="#ef4444" opacity="0.9" />
      <circle cx="100" cy="100" r="3" fill="#ffffff" />
      <text x="105" y="112" fontSize="12" fontWeight="bold" fill="#1e293b" textAnchor="start">O</text>
      <text x="100" y="8" fontSize="12" fontWeight="bold" fill="#ef4444" textAnchor="middle">Bắc (N)</text>
      <text x="100" y="198" fontSize="12" fontWeight="bold" fill="#3b82f6" textAnchor="middle">Nam (S)</text>
      <text x="195" y="104" fontSize="12" fontWeight="bold" fill="#f59e0b" textAnchor="start">Đông (E)</text>
      <text x="5" y="104" fontSize="12" fontWeight="bold" fill="#f59e0b" textAnchor="end">Tây (W)</text>
  </svg>
);
