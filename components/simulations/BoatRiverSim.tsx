'use client';
import React, { useState, useEffect, useRef } from 'react';

export const BoatRiverSim = () => {
  const [vWater, setVWater] = useState(3); // v2,3
  const vBoat = 4; // v1,2 (fixed straight up)
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [pos, setPos] = useState({ x: 150, y: 250 });
  const [trace, setTrace] = useState<{x: number, y: number}[]>([{x: 150, y: 250}]);
  
  const requestRef = useRef<number | null>(null);
  const startAnimTime = useRef<number | null>(null);

  const RIVER_WIDTH = 200; // pixels
  const RIVER_BOTTOM = 250;
  const RIVER_TOP = 50;
  const START_X = 150;

  // Real world constants
  const w_real = 240; // m
  const v12_real = 4; // m/s
  const t_real = w_real / v12_real; // 60s
  
  // Simulation duration
  const SIM_DURATION = 3000;

  const animate = (time: number) => {
    if (startAnimTime.current === null) {
      startAnimTime.current = time;
    }
    const t_sim = (time - startAnimTime.current) / SIM_DURATION;
    
    if (t_sim >= 1) {
      const finalX = START_X + (vWater / vBoat) * RIVER_WIDTH;
      setPos({ y: RIVER_TOP, x: finalX });
      setTrace(prev => [...prev, {x: finalX, y: RIVER_TOP}]);
      setIsPlaying(false);
      return;
    }

    const currentX = START_X + t_sim * (vWater / vBoat) * RIVER_WIDTH;
    const currentY = RIVER_BOTTOM - t_sim * RIVER_WIDTH;
    setPos({ y: currentY, x: currentX });
    
    // Update trace every few frames to save performance
    if (Math.random() > 0.5) {
      setTrace(prev => [...prev, {x: currentX, y: currentY}]);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  const handleStart = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPos({ x: START_X, y: RIVER_BOTTOM });
    setTrace([{x: START_X, y: RIVER_BOTTOM}]);
    startAnimTime.current = null;
    requestRef.current = requestAnimationFrame(animate);
  };

  const handleReset = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setIsPlaying(false);
    setPos({ x: START_X, y: RIVER_BOTTOM });
    setTrace([{x: START_X, y: RIVER_BOTTOM}]);
    startAnimTime.current = null;
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const v13 = Math.sqrt(vBoat*vBoat + vWater*vWater).toFixed(2);
  const drift = (vWater * t_real).toFixed(0);

  return (
    <div className="glass-panel rounded-2xl p-6 mb-8 border border-slate-200 shadow-xl bg-white">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-800 mb-2">🚤 Mô phỏng Canô qua sông</h3>
          <p className="text-sm text-slate-500 mb-4">Mũi canô luôn hướng vuông góc với bờ. Dòng nước chảy cuốn canô dạt về phía hạ lưu.</p>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">Vận tốc dòng nước (v₂₃) = <span className="text-blue-600">{vWater} m/s</span></label>
            <input type="range" min="0" max="8" step="1" value={vWater} onChange={e => {setVWater(Number(e.target.value)); handleReset();}} className="w-full accent-blue-600" />
            
            <div className="text-sm mt-2 text-slate-600">Vận tốc canô so với nước (v₁₂): <strong>{vBoat} m/s</strong> (Mũi thuyền thẳng)</div>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={handleStart} disabled={isPlaying} className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-bold shadow transition flex-1">
              ▶ Khởi hành
            </button>
            <button onClick={handleReset} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold shadow transition">
              Reset
            </button>
          </div>

          {pos.y === RIVER_TOP && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-sm text-green-900 animate-fade-in shadow-inner">
              <p className="font-bold mb-2">Kết quả chuyến đi:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Vận tốc tổng hợp (v₁₃): <strong className="text-red-600">{v13} m/s</strong></li>
                <li>Thời gian qua sông: <strong>{t_real} s</strong></li>
                <li>Độ dạt hạ lưu (BC): <strong className="text-red-600">{drift} m</strong></li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex-[2] relative bg-emerald-50 rounded-xl overflow-hidden border border-slate-300 h-[300px] shadow-inner">
          <svg width="100%" height="100%" className="absolute inset-0 z-0">
            {/* Water Flow Animation */}
            <pattern id="water" width="100" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 20 Q 25 10 50 20 T 100 20" fill="none" stroke="#93c5fd" strokeWidth="2" />
            </pattern>
            <rect x="0" y="50" width="100%" height="200" fill="url(#water)" className="animate-water-flow" />
            
            {/* Target Line */}
            <line x1={START_X} y1="50" x2={START_X} y2="250" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" />
            
            {/* Boat Trace */}
            {trace.length > 1 && (
              <polyline 
                points={trace.map(p => `${p.x},${p.y}`).join(' ')} 
                fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="6 4" 
              />
            )}
          </svg>

          {/* Banks */}
          <div className="absolute top-0 w-full h-[50px] bg-gradient-to-b from-emerald-200 to-emerald-100 border-b-4 border-emerald-600 flex items-end px-4 pb-1 z-10 shadow">
            <span className="font-bold text-emerald-800 text-sm bg-white/50 px-2 rounded">Bờ B (Bờ đối diện)</span>
          </div>
          <div className="absolute bottom-0 w-full h-[50px] bg-gradient-to-t from-emerald-200 to-emerald-100 border-t-4 border-emerald-600 px-4 pt-1 z-10 shadow">
            <span className="font-bold text-emerald-800 text-sm bg-white/50 px-2 rounded">Bờ A (Bờ xuất phát)</span>
          </div>

          <div className="absolute font-bold text-slate-600 bg-white/80 px-1 rounded z-10" style={{ left: `${START_X - 10}px`, bottom: `55px` }}>A</div>
          <div className="absolute font-bold text-slate-600 bg-white/80 px-1 rounded z-10" style={{ left: `${START_X - 10}px`, top: `30px` }}>B</div>
          
          {vWater > 0 && (
            <div className="absolute font-bold text-red-600 bg-white/80 px-1 rounded z-10" style={{ left: `${START_X + (vWater/vBoat)*200 - 10}px`, top: `30px` }}>C</div>
          )}

          {/* Boat & Vectors */}
          <div 
            className="absolute w-6 h-12 bg-white rounded-full border-2 border-slate-800 shadow-lg flex justify-center pt-1 z-20"
            style={{ 
              left: `${pos.x - 12}px`, 
              top: `${pos.y - 24}px`
            }}
          >
            <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
            
            {/* Dynamic Vectors attached to boat */}
            <svg className="absolute overflow-visible" style={{ left: '10px', top: '10px' }} width="1" height="1">
              <defs>
                <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#10b981" />
                </marker>
                <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" />
                </marker>
                <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
                </marker>
              </defs>
              
              {/* v12 (Canô vs Nước) */}
              <line x1="0" y1="0" x2="0" y2="-60" stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowGreen)" />
              <text x="-30" y="-30" fill="#10b981" fontSize="12" fontWeight="bold">v₁₂</text>

              {/* v23 (Nước vs Bờ) */}
              {vWater > 0 && (
                <>
                  <line x1="0" y1="-60" x2={vWater * 15} y2="-60" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrowBlue)" strokeDasharray="3 3"/>
                  <line x1="0" y1="0" x2={vWater * 15} y2="0" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrowBlue)" />
                  <text x={vWater * 15 / 2 - 10} y="15" fill="#3b82f6" fontSize="12" fontWeight="bold">v₂₃</text>
                </>
              )}

              {/* v13 (Tổng hợp: Canô vs Bờ) */}
              {vWater > 0 && (
                <>
                  <line x1="0" y1="0" x2={vWater * 15} y2="-60" stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrowRed)" />
                  <text x={vWater * 15 / 2 + 5} y="-35" fill="#ef4444" fontSize="12" fontWeight="bold">v₁₃</text>
                </>
              )}
            </svg>
          </div>
          
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow {
          from { background-position: 0 0; }
          to { background-position: 100px 0; }
        }
        .animate-water-flow {
          animation: flow 2s linear infinite;
        }
      `}} />
    </div>
  );
};
