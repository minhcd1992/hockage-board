'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Math as MathComponent } from '@/components/lesson/Math';

export const PhotogateSim = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<'avg' | 'inst'>('avg');
  const [slowMo, setSlowMo] = useState(false);
  
  const [carX, setCarX] = useState(20);
  const [timerValue, setTimerValue] = useState<number | null>(null);
  
  const requestRef = useRef<number | null>(null);
  const startAnimTime = useRef<number | null>(null);

  const CAR_WIDTH = 60;
  const SHIELD_WIDTH = 40; // Scale 2:1 (20mm -> 40px)
  const GATE_E = 200; // 100mm on the ruler
  const GATE_F = 500; // 250mm on the ruler
  
  // Acceleration in pixels/s^2 (scaled)
  const ACCELERATION = 400;

  const animate = (time: number) => {
    if (startAnimTime.current === null) {
      startAnimTime.current = time;
    }
    const tReal = (time - startAnimTime.current) / 1000;
    const tSim = slowMo ? tReal * 0.25 : tReal;
    
    // x = x0 + 1/2 * a * t^2
    const currentX = 20 + 0.5 * ACCELERATION * tSim * tSim;
    setCarX(currentX);

    // Theoretical time calculations
    // Mode 'inst': time to cross Gate E (d=20mm)
    if (mode === 'inst') {
      const shieldFront = currentX + CAR_WIDTH / 2 + SHIELD_WIDTH / 2;
      const shieldBack = currentX + CAR_WIDTH / 2 - SHIELD_WIDTH / 2;
      if (shieldFront >= GATE_E && shieldBack <= GATE_E) {
        const v_gate = Math.sqrt(2 * ACCELERATION * (GATE_E - 20));
        const dt = (SHIELD_WIDTH/2) / v_gate; // d = 20mm -> 20/v_gate = (40/2)/v_gate
        setTimerValue(dt);
      }
    } 
    // Mode 'avg': time from Gate E to Gate F
    else {
      // We consider the center of the car hitting the gate
      const center = currentX + CAR_WIDTH / 2;
      if (center >= GATE_F) {
        // Time at E: t_E = sqrt(2 * (GATE_E - 20) / a)
        // Time at F: t_F = sqrt(2 * (GATE_F - 20) / a)
        const t_E = Math.sqrt(2 * (GATE_E - 20) / ACCELERATION);
        const t_F = Math.sqrt(2 * (GATE_F - 20) / ACCELERATION);
        setTimerValue(t_F - t_E);
      } else if (center >= GATE_E && center < GATE_F) {
        // While between gates, show 0 or running time? Just show --- until F is crossed
      }
    }

    if (currentX > 600) {
      setIsPlaying(false);
      return;
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  const handleStart = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCarX(20);
    setTimerValue(null);
    startAnimTime.current = null;
    requestRef.current = requestAnimationFrame(animate);
  };

  const handleReset = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setIsPlaying(false);
    setCarX(20);
    setTimerValue(null);
    startAnimTime.current = null;
  };

  useEffect(() => {
    handleReset();
  }, [mode, slowMo]);

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 mb-8 border border-slate-200 shadow-xl bg-white">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center">⏱️ Thí nghiệm Cổng quang điện</h3>
          <p className="text-sm text-slate-500 mt-1">Thực hành đo tốc độ trên máng nghiêng bằng thiết bị điện tử.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
          <select 
            value={mode} 
            onChange={e => setMode(e.target.value as any)}
            disabled={isPlaying}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="avg">Đo Tốc độ trung bình (2 cổng)</option>
            <option value="inst">Đo Tốc độ tức thời (1 cổng)</option>
          </select>
          
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white px-3 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
            <input type="checkbox" checked={slowMo} onChange={() => setSlowMo(!slowMo)} disabled={isPlaying} className="w-4 h-4 accent-blue-600" />
            Tua chậm 0.25x
          </label>

          <button onClick={handleStart} disabled={isPlaying} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-lg font-bold shadow transition ml-2">
            Thả Xe
          </button>
          <button onClick={handleReset} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-lg font-bold shadow transition">
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Track Area */}
        <div className="relative w-full lg:w-2/3 h-[280px] bg-sky-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          {/* Rotated Container representing the track */}
          <div className="absolute top-[100px] left-[-20px] w-[120%] h-8 bg-gradient-to-b from-slate-200 to-slate-400 origin-left rotate-[6deg] border-t border-slate-400 shadow-md">
            
            {/* Ruler on the track */}
            <div className="absolute top-0 w-full h-2 flex items-start border-b border-slate-500">
              {Array.from({length: 30}).map((_, i) => (
                <div key={i} className="h-2 w-[20px] border-l border-slate-600 relative">
                  {i % 5 === 0 && <span className="absolute -top-4 -left-2 text-[10px] font-bold text-slate-700 whitespace-nowrap">{i*10}</span>}
                </div>
              ))}
            </div>
            
            {/* The rail (raised slightly) */}
            <div className="absolute top-2 w-full h-1 bg-slate-500"></div>
            
            {/* Photogate E */}
            <div className="absolute bottom-8" style={{ left: `${GATE_E + 20}px` }}>
              <div className="text-xs font-bold text-slate-600 mb-1 ml-1 text-center bg-white/80 rounded px-1 w-max absolute -top-6 left-0">Cổng E</div>
              <div className="w-10 h-24 border-[5px] border-b-0 border-yellow-500 rounded-t-xl relative bg-yellow-500/10 shadow-lg">
                <div className="absolute top-[60px] left-1 w-7 h-[2px] bg-red-500/50 shadow-[0_0_8px_2px_rgba(239,68,68,0.5)]"></div>
              </div>
            </div>

            {/* Photogate F */}
            {mode === 'avg' && (
              <div className="absolute bottom-8" style={{ left: `${GATE_F + 20}px` }}>
                <div className="text-xs font-bold text-slate-600 mb-1 ml-1 text-center bg-white/80 rounded px-1 w-max absolute -top-6 left-0">Cổng F</div>
                <div className="w-10 h-24 border-[5px] border-b-0 border-yellow-500 rounded-t-xl relative bg-yellow-500/10 shadow-lg">
                  <div className="absolute top-[60px] left-1 w-7 h-[2px] bg-red-500/50 shadow-[0_0_8px_2px_rgba(239,68,68,0.5)]"></div>
                </div>
              </div>
            )}

            {/* Car */}
            <div 
              className="absolute bottom-8 transition-transform z-10 w-[60px]"
              style={{ left: `${carX + 20}px` }}
            >
              {/* Shield (Bản chắn sáng) - 40px width represents 20mm */}
              {mode === 'inst' && (
                <div className="absolute bottom-[24px] left-[10px] w-[40px] h-10 bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg">
                  <span className="text-[10px] text-white font-bold tracking-widest bg-black/50 px-1 rounded">d</span>
                </div>
              )}
              {/* Car body */}
              <div className="absolute bottom-[4px] w-[60px] h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-t-lg border-2 border-blue-800 shadow-md"></div>
              {/* Wheels perfectly touching the rail line */}
              <div className="absolute bottom-0 left-2 w-5 h-5 bg-slate-800 rounded-full border-2 border-slate-400"></div>
              <div className="absolute bottom-0 right-2 w-5 h-5 bg-slate-800 rounded-full border-2 border-slate-400"></div>
            </div>

          </div>
        </div>

        {/* Timer Display */}
        <div className="w-full lg:w-1/3 flex flex-col items-center">
          <div className="bg-slate-800 p-5 rounded-2xl border-4 border-slate-700 shadow-2xl w-full max-w-[280px]">
            <div className="flex justify-between items-center mb-2">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">MC964 Timer</div>
              <div className="text-[10px] text-slate-500 px-2 py-0.5 border border-slate-600 rounded bg-slate-900">
                MODE: {mode === 'avg' ? 'A↔B' : 'A'}
              </div>
            </div>
            
            <div className="bg-black border-4 border-slate-600 p-4 rounded-lg flex justify-end shadow-inner relative">
              <div className="absolute left-2 bottom-2 text-slate-600 text-xs">sec</div>
              <span className={`font-mono text-5xl tracking-widest ${timerValue !== null ? 'text-red-500' : 'text-red-900/50'}`}>
                {timerValue !== null ? timerValue.toFixed(3) : '0.000'}
              </span>
            </div>
            
            <div className="flex gap-4 mt-6 justify-center">
              <div className={`w-4 h-4 rounded-full shadow-[0_0_10px_currentColor] ${mode === 'avg' ? 'bg-green-500 text-green-500' : 'bg-slate-600 text-transparent'}`}></div>
              <div className={`w-4 h-4 rounded-full shadow-[0_0_10px_currentColor] ${mode === 'inst' ? 'bg-blue-500 text-blue-500' : 'bg-slate-600 text-transparent'}`}></div>
              <div className="w-4 h-4 rounded-full bg-slate-600"></div>
            </div>
          </div>
          
          <div className="mt-6 bg-emerald-50 text-emerald-900 p-5 rounded-xl border border-emerald-200 text-sm w-full shadow-sm h-[180px]">
            <p className="font-bold border-b border-emerald-200 pb-2 mb-2">📊 Kết quả Tính toán:</p>
            {mode === 'avg' ? (
              <ul className="list-none space-y-2">
                <li><MathComponent inline>{"s = EF = 250 - 100 = 150\\text{ mm}"}</MathComponent></li>
                <li>
                  <MathComponent inline>
                    {`\\Delta t = ${timerValue !== null ? timerValue.toFixed(3) : '...'}\\text{ s}`}
                  </MathComponent>
                </li>
                <li className="font-bold text-blue-800 bg-blue-100/50 p-2 rounded min-h-[44px] flex items-center">
                  {timerValue !== null ? (
                    <MathComponent inline>{`v_{tb} = \\frac{s}{\\Delta t} = \\frac{0,15}{${timerValue.toFixed(3)}} \\approx ${(0.15/timerValue).toFixed(2)}\\text{ m/s}`}</MathComponent>
                  ) : (
                    <span className="text-blue-800/50">Chờ xe qua 2 cổng...</span>
                  )}
                </li>
              </ul>
            ) : (
              <ul className="list-none space-y-2">
                <li><MathComponent inline>{"d = 20\\text{ mm} = 0,02\\text{ m}"}</MathComponent></li>
                <li>
                  <MathComponent inline>
                    {`\\Delta t = ${timerValue !== null ? timerValue.toFixed(3) : '...'}\\text{ s}`}
                  </MathComponent>
                </li>
                <li className="font-bold text-red-800 bg-red-100/50 p-2 rounded min-h-[44px] flex items-center">
                  {timerValue !== null ? (
                    <MathComponent inline>{`v = \\frac{d}{\\Delta t} = \\frac{0,02}{${timerValue.toFixed(3)}} \\approx ${(0.02/timerValue).toFixed(2)}\\text{ m/s}`}</MathComponent>
                  ) : (
                    <span className="text-red-800/50">Chờ xe qua cổng chắn...</span>
                  )}
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
