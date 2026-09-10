'use client';
import React, { useState, useEffect } from 'react';

export const AntExperimentSim = () => {
  const [antAngle, setAntAngle] = useState(Math.PI);
  const [targetAngle, setTargetAngle] = useState(Math.PI);
  const [isAnimating, setIsAnimating] = useState(false);

  const cx = 200;
  const cy = 150;
  const rx = 140;
  const ry = 60;

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setAntAngle((prev) => {
        if (prev < targetAngle) {
          const nextAngle = prev + 0.02;
          if (nextAngle >= targetAngle) {
            setIsAnimating(false);
            return targetAngle;
          }
          return nextAngle;
        }
        setIsAnimating(false);
        return targetAngle;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAnimating) {
      animate();
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAnimating, targetAngle]);

  const handleHalf = () => {
    if (isAnimating) return;
    setAntAngle(Math.PI);
    setTargetAngle(Math.PI * 2);
    setIsAnimating(true);
  };

  const handleFull = () => {
    if (isAnimating) return;
    setAntAngle(Math.PI);
    setTargetAngle(Math.PI * 3);
    setIsAnimating(true);
  };

  // Generate trace path
  const tracePoints = [];
  if (antAngle > Math.PI) {
    for (let a = Math.PI; a <= antAngle; a += 0.05) {
      tracePoints.push(`${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`);
    }
    tracePoints.push(`${cx + rx * Math.cos(antAngle)},${cy + ry * Math.sin(antAngle)}`);
  }
  const traceD = tracePoints.length > 0 ? `M ${tracePoints[0]} ` + tracePoints.slice(1).map(p => `L ${p}`).join(' ') : '';

  const ax = cx + rx * Math.cos(antAngle);
  const ay = cy + ry * Math.sin(antAngle);
  const rotationDeg = (antAngle + Math.PI / 2) * (180 / Math.PI);

  const startP = { x: cx + rx * Math.cos(Math.PI), y: cy + ry * Math.sin(Math.PI) };
  const currentP = { x: ax, y: ay };
  const dist = Math.hypot(currentP.x - startP.x, currentP.y - startP.y);
  
  const showDisplacement = !isAnimating && antAngle > Math.PI;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 font-semibold text-amber-800">
        Mô phỏng: Chú kiến bò quanh miệng bát
      </div>
      <div className="p-4 flex flex-col lg:flex-row gap-6 items-center">
        <div className="w-full lg:w-1/2 relative bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
          <svg viewBox="0 0 400 300" className="w-full h-auto">
            {/* Bowl bottom */}
            <ellipse cx={cx} cy={cy + 40} rx={rx - 30} ry={ry - 10} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            
            {/* Bowl rim */}
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="4" />

            {/* Trace Path */}
            {traceD && (
              <path d={traceD} fill="none" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="4" />
            )}

            {/* Displacement Vector */}
            {showDisplacement && dist > 5 && antAngle < Math.PI * 3 && (
              <g>
                <line x1={startP.x} y1={startP.y} x2={currentP.x} y2={currentP.y} stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5" />
                <text x={cx - 40} y={cy + 10} fill="#1e40af" fontWeight="bold">Độ dịch chuyển d</text>
              </g>
            )}
            {showDisplacement && antAngle >= Math.PI * 3 && (
              <text x={cx - 80} y={cy + 10} fill="#1e40af" fontWeight="bold" fontSize="16">d = 0 (Về điểm xuất phát)</text>
            )}

            {/* Ant */}
            <g transform={`translate(${ax}, ${ay}) rotate(${rotationDeg})`}>
              {/* Head */}
              <circle cx="0" cy="-6" r="3" fill="#0f172a" />
              {/* Thorax */}
              <ellipse cx="0" cy="0" rx="4" ry="5" fill="#0f172a" />
              {/* Abdomen */}
              <ellipse cx="0" cy="8" rx="5" ry="7" fill="#0f172a" />
              {/* Legs */}
              <path d="M -3 -4 L -8 -6 M 3 -4 L 8 -6 M -3 0 L -8 -2 M 3 0 L 8 -2 M -3 4 L -8 2 M 3 4 L 8 2" stroke="#0f172a" strokeWidth="1.5" fill="none" />
            </g>

            {/* Point Markers */}
            <circle cx={startP.x} cy={startP.y} r="6" fill="#3b82f6" />
            <circle cx={cx + rx * Math.cos(0)} cy={cy + ry * Math.sin(0)} r="6" fill="#3b82f6" />
            <text x={startP.x - 3} y={startP.y + 3} fill="white" fontSize="10" fontWeight="bold">A</text>
            <text x={cx + rx * Math.cos(0) - 3} y={cy + ry * Math.sin(0) + 3} fill="white" fontSize="10" fontWeight="bold">B</text>
          </svg>
        </div>
        
        <div className="w-full lg:w-1/2 flex flex-col gap-4 text-sm">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
            <h4 className="font-bold text-blue-800 mb-2">Trường hợp 1 (Nửa vòng):</h4>
            <ul className="list-disc pl-5 mb-0 space-y-1 text-slate-700">
              <li><strong>Quãng đường:</strong> s = π·R ≈ 31,4 cm.</li>
              <li><strong>Độ dịch chuyển:</strong> d = 2R = 20 cm.</li>
            </ul>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <h4 className="font-bold text-red-800 mb-2">Trường hợp 2 (Một vòng khép kín):</h4>
            <ul className="list-disc pl-5 mb-0 space-y-1 text-slate-700">
              <li><strong>Quãng đường tích lũy:</strong> s = 2π·R ≈ 62,8 cm.</li>
              <li><strong>Độ dịch chuyển:</strong> d = 0 cm.</li>
            </ul>
          </div>

          <div className="flex-1 flex flex-col justify-end mt-4">
            <p className="text-slate-600 italic mb-3 font-medium">Nhấn vào nút dưới đây để quan sát:</p>
            <div className="flex gap-3">
              <button 
                onClick={handleHalf}
                disabled={isAnimating}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm active:scale-95"
              >
                Nửa vòng
              </button>
              <button 
                onClick={handleFull}
                disabled={isAnimating}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm active:scale-95"
              >
                Một vòng (Khứ hồi)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
