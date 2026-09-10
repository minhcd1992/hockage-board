'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

export const RelativeVelocitySim = () => {
  const [v23, setV23] = useState(10); // Xe so với đất
  const [v12, setV12] = useState(5);  // Người so với xe
  const [isRunning, setIsRunning] = useState(true);

  const v23Ref = useRef(v23);
  const v12Ref = useRef(v12);
  const isRunningRef = useRef(isRunning);

  const globalTimeRef = useRef(0);
  const lastTimeRef = useRef<number>(performance.now());
  const personLocalXRef = useRef(0);
  const reqRef = useRef<number>(0);

  const canvasGroundRef = useRef<HTMLCanvasElement>(null);
  const canvasTruckRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { v23Ref.current = v23; }, [v23]);
  useEffect(() => { v12Ref.current = v12; }, [v12]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  useEffect(() => {
    const SCALE = 4;
    const TRUCK_W = 450;
    const TRUCK_H = 25;
    const PERSON_W = 16;
    const PERSON_H = 36;
    const GROUND_Y = 200;

    const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, length: number, color: string, label: string) => {
      if (length === 0) return;
      const toX = fromX + length * 3;
      const headLength = 8;
      const dir = length > 0 ? 1 : -1;
      
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, fromY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX, fromY);
      ctx.lineTo(toX - dir * headLength, fromY - headLength/1.5);
      ctx.lineTo(toX - dir * headLength, fromY + headLength/1.5);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = 'bold 15px Inter, sans-serif'; // Bigger font
      ctx.textAlign = 'center';
      
      // Draw a background box for the label to make it pop
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(fromX + (length * 3) / 2 - textWidth / 2 - 4, fromY - 24, textWidth + 8, 18);
      
      ctx.fillStyle = color;
      ctx.fillText(label, fromX + (length * 3) / 2, fromY - 10);
    };

    const drawScenery = (ctx: CanvasRenderingContext2D, offsetX: number, width: number, height: number, isMoving: boolean) => {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, width, GROUND_Y);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, GROUND_Y, width, height - GROUND_Y);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, GROUND_Y, width, 12);

      const treeSpacing = 150;
      const effOffset = offsetX % treeSpacing;
      
      for (let i = -treeSpacing; i < width + treeSpacing; i += treeSpacing) {
        const x = i + effOffset;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 5, GROUND_Y - 40, 10, 40);
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(x, GROUND_Y - 50, 20, 0, Math.PI * 2);
        ctx.fill();
        
        if (isMoving && v23Ref.current !== 0) {
          drawArrow(ctx, x, GROUND_Y + 30, -v23Ref.current, '#059669', `-v23 (${-v23Ref.current})`);
        }
      }
    };

    const drawTruck = (ctx: CanvasRenderingContext2D, x: number) => {
      const truckY = GROUND_Y - TRUCK_H - 10;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x - TRUCK_W/2, truckY, TRUCK_W, TRUCK_H);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(x - TRUCK_W/2 + 5, truckY + 5, TRUCK_W - 10, 8);
      
      for (let wx = -TRUCK_W/2 + 40; wx <= TRUCK_W/2 - 40; wx += 90) {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x + wx, GROUND_Y - 10, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(x + wx, GROUND_Y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawPerson = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - PERSON_W/2, y, PERSON_W, PERSON_H);
      ctx.beginPath();
      ctx.arc(x, y - 8, 10, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawObserver = (ctx: CanvasRenderingContext2D, x: number, y: number, type: 'ground' | 'truck') => {
      ctx.fillStyle = type === 'ground' ? '#047857' : '#1d4ed8';
      ctx.fillRect(x-4, y, 8, 20);
      ctx.beginPath();
      ctx.arc(x, y - 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x + 2, y - 7, 2, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = type === 'ground' ? '#047857' : '#1d4ed8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(type === 'ground' ? "Bạn" : "Bạn (Camera)", x, y + 32);
    };

    const renderGroundPerspective = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      drawScenery(ctx, 0, width, height, false);
      drawObserver(ctx, 50, GROUND_Y - 20, 'ground');
      
      let absTruckX = (globalTimeRef.current * v23Ref.current * SCALE) % (width + TRUCK_W);
      if (absTruckX < 0) absTruckX += width + TRUCK_W;
      absTruckX -= TRUCK_W/2;

      let absPersonX = absTruckX + personLocalXRef.current;
      let truckY = GROUND_Y - TRUCK_H - 10;
      let personY = truckY - PERSON_H;

      drawTruck(ctx, absTruckX);
      drawPerson(ctx, absPersonX, personY);

      drawArrow(ctx, absTruckX, truckY + TRUCK_H/2, v23Ref.current, '#2563eb', `v23 = ${v23Ref.current}`);
      let v13 = v12Ref.current + v23Ref.current;
      drawArrow(ctx, absPersonX, personY - 20, v13, '#9333ea', `v13 = ${v13}`);
    };

    const renderTruckPerspective = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      const centerTruckX = width / 2;
      let groundOffset = -(globalTimeRef.current * v23Ref.current * SCALE);
      
      drawScenery(ctx, groundOffset, width, height, true);
      drawTruck(ctx, centerTruckX);
      drawObserver(ctx, centerTruckX - 60, GROUND_Y - TRUCK_H - 30, 'truck');

      let personY = GROUND_Y - TRUCK_H - 10 - PERSON_H;
      let absPersonX = centerTruckX + personLocalXRef.current;
      
      drawPerson(ctx, absPersonX, personY);
      drawArrow(ctx, absPersonX, personY - 20, v12Ref.current, '#dc2626', `v12 = ${v12Ref.current}`);
    };

    const loop = (timestamp: number) => {
      if (isRunningRef.current) {
        const dt = (timestamp - lastTimeRef.current) / 1000;
        if (dt < 0.1) {
          globalTimeRef.current += dt;
          personLocalXRef.current += (v12Ref.current * SCALE) * dt;
          
          const maxRelMove = TRUCK_W / 2 - PERSON_W / 2 - 15;
          if (personLocalXRef.current > maxRelMove) {
            personLocalXRef.current = maxRelMove;
            setV12(prev => -Math.abs(prev));
          } else if (personLocalXRef.current < -maxRelMove) {
            personLocalXRef.current = -maxRelMove;
            setV12(prev => Math.abs(prev));
          }
        }
      }
      
      lastTimeRef.current = timestamp;

      if (canvasGroundRef.current && canvasTruckRef.current) {
        // Enforce fixed internal resolution for perfect aspect ratio
        if (canvasGroundRef.current.width !== 800) canvasGroundRef.current.width = 800;
        if (canvasGroundRef.current.height !== 250) canvasGroundRef.current.height = 250;
        if (canvasTruckRef.current.width !== 800) canvasTruckRef.current.width = 800;
        if (canvasTruckRef.current.height !== 250) canvasTruckRef.current.height = 250;

        const ctxG = canvasGroundRef.current.getContext('2d');
        const ctxT = canvasTruckRef.current.getContext('2d');
        if (ctxG && ctxT) {
          renderGroundPerspective(ctxG, 800, 250);
          renderTruckPerspective(ctxT, 800, 250);
        }
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    reqRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(reqRef.current);
    };
  }, []);

  const v13 = v12 + v23;

  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-4 md:p-6 mb-8 border border-slate-200 font-sans">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-800 text-center mb-4">
          Mô Phỏng Công Thức Cộng Vận Tốc (Hai Hệ Quy Chiếu)
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
            <span className="font-medium text-slate-700">Vật (Người đi bộ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-500 inline-block"></span>
            <span className="font-medium text-slate-700">Hệ QC Chuyển động (Xe)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500 inline-block"></span>
            <span className="font-medium text-slate-700">Hệ QC Đứng yên (Mặt đất)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* View 1 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col border-2 border-emerald-200">
          <div className="bg-emerald-50 p-3 border-b border-emerald-100 flex justify-between items-center">
            <h4 className="font-bold text-emerald-800">1. Góc nhìn từ Mặt Đất</h4>
            <span className="text-xs font-semibold bg-emerald-200 text-emerald-800 px-2 py-1 rounded">Bạn đang đứng dưới đất</span>
          </div>
          <div className="p-3 text-sm text-slate-600 h-24">
            • Cây cối <b>đứng yên</b>.<br/>
            • Xe di chuyển với vận tốc <b className="text-blue-600">v₂₃</b>.<br/>
            • Bạn thấy người trên xe di chuyển với vận tốc tổng hợp: <b className="text-purple-600">v₁₃ = v₁₂ + v₂₃</b>
          </div>
          <div className="relative w-full h-auto aspect-[800/250] bg-sky-50">
            <canvas ref={canvasGroundRef} className="w-full h-full block"></canvas>
          </div>
        </div>

        {/* View 2 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col border-2 border-blue-200">
          <div className="bg-blue-50 p-3 border-b border-blue-100 flex justify-between items-center">
            <h4 className="font-bold text-blue-800">2. Góc nhìn từ trên Xe</h4>
            <span className="text-xs font-semibold bg-blue-200 text-blue-800 px-2 py-1 rounded">Bạn đang ngồi trên xe</span>
          </div>
          <div className="p-3 text-sm text-slate-600 h-24">
            • Xe <b>đứng yên</b> (vì bạn ngồi trên xe).<br/>
            • Người đi bộ di chuyển với vận tốc <b className="text-red-500">v₁₂</b>.<br/>
            • Mặt đất & cây cối bị đẩy lùi về phía sau với vận tốc <b className="text-emerald-600">-v₂₃</b>
          </div>
          <div className="relative w-full h-auto aspect-[800/250] bg-sky-50">
            <canvas ref={canvasTruckRef} className="w-full h-full block"></canvas>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl shadow-inner border border-slate-200 p-6 relative">
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-full shadow-lg transition-colors flex items-center font-medium"
          >
            {isRunning ? (
              <><Pause className="w-5 h-5 mr-2" /> Tạm dừng</>
            ) : (
              <><Play className="w-5 h-5 mr-2" /> Tiếp tục</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4">
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-blue-600 flex items-center text-base md:text-lg">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block mr-2"></span>
                Vận tốc Xe so với Đất (v₂₃)
              </label>
              <span className="font-mono font-bold text-xl bg-blue-100 text-blue-800 px-3 py-1 rounded shadow-inner">{v23} m/s</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">-30</span>
              <input type="range" min="-30" max="30" step="1" value={v23} onChange={e => setV23(Number(e.target.value))} className="w-full accent-blue-600" />
              <span className="text-slate-400 font-medium">+30</span>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-red-500 flex items-center text-base md:text-lg">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block mr-2"></span>
                Vận tốc Người so với Xe (v₁₂)
              </label>
              <span className="font-mono font-bold text-xl bg-red-100 text-red-800 px-3 py-1 rounded shadow-inner">{v12} m/s</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">-15</span>
              <input type="range" min="-15" max="15" step="1" value={v12} onChange={e => setV12(Number(e.target.value))} className="w-full accent-red-600" />
              <span className="text-slate-400 font-medium">+15</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-purple-50 p-4 md:p-6 rounded-xl border border-purple-200 flex flex-col items-center justify-center shadow-sm">
          <div className="text-sm md:text-base text-purple-600 font-semibold mb-2">KẾT LUẬN: Vận tốc thực tế của Người so với Mặt Đất (v₁₃)</div>
          <div className="text-2xl md:text-4xl font-bold text-slate-800 flex items-center flex-wrap justify-center gap-2">
            v₁₃ = 
            <span className="text-red-500">{v12}</span> + <span className="text-blue-500">{v23}</span> = 
            <span className="text-purple-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-purple-200">{v13}</span> m/s
          </div>
        </div>
      </div>
    </div>
  );
};
