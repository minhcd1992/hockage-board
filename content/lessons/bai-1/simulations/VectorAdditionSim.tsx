'use client';
import React, { useState, useRef, useEffect } from 'react';

export const VectorAdditionSim = () => {
  const [points, setPoints] = useState({
    A: { x: 50, y: 150 },
    B: { x: 150, y: 50 },
    C: { x: 280, y: 120 }
  });
  
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggedPoint(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggedPoint && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = 400 / rect.width;
      const scaleY = 300 / rect.height;
      const x = Math.max(0, Math.min(400, (e.clientX - rect.left) * scaleX));
      const y = Math.max(0, Math.min(300, (e.clientY - rect.top) * scaleY));
      setPoints(prev => ({ ...prev, [draggedPoint]: { x, y } }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setDraggedPoint(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 font-semibold text-indigo-800">
        Mô phỏng: Phép cộng tổng hợp độ dịch chuyển (Quy tắc tam giác)
      </div>
      <div className="p-4 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden touch-none">
          <svg 
            ref={svgRef}
            viewBox="0 0 400 300" 
            className="w-full h-auto cursor-crosshair"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <defs>
              <marker id="arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
              </marker>
              <marker id="arrowGreen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <marker id="arrowRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
            <rect width="400" height="300" fill="url(#grid)" />

            {/* Vectors */}
            {/* A -> B */}
            <line x1={points.A.x} y1={points.A.y} x2={points.B.x} y2={points.B.y} stroke="#3b82f6" strokeWidth="4" markerEnd="url(#arrowBlue)" />
            {/* B -> C */}
            <line x1={points.B.x} y1={points.B.y} x2={points.C.x} y2={points.C.y} stroke="#10b981" strokeWidth="4" markerEnd="url(#arrowGreen)" />
            {/* A -> C (Resultant) */}
            <line x1={points.A.x} y1={points.A.y} x2={points.C.x} y2={points.C.y} stroke="#ef4444" strokeWidth="4" strokeDasharray="6,4" markerEnd="url(#arrowRed)" />

            {/* Labels */}
            <text x={(points.A.x + points.B.x)/2 - 10} y={(points.A.y + points.B.y)/2 - 10} fill="#3b82f6" fontWeight="bold">d₁</text>
            <text x={(points.B.x + points.C.x)/2 + 10} y={(points.B.y + points.C.y)/2 - 10} fill="#10b981" fontWeight="bold">d₂</text>
            <text x={(points.A.x + points.C.x)/2 + 10} y={(points.A.y + points.C.y)/2 + 20} fill="#ef4444" fontWeight="bold">d (Tổng)</text>

            {/* Draggable Points */}
            {Object.entries(points).map(([key, p]) => (
              <g key={key} transform={`translate(${p.x}, ${p.y})`} 
                 onPointerDown={(e) => handlePointerDown(e, key)}
                 className="cursor-grab active:cursor-grabbing">
                <circle r="12" fill="transparent" />
                <circle r="6" fill="#1e293b" />
                <text x="-15" y="-10" fill="#1e293b" fontWeight="bold" fontSize="16">{key}</text>
              </g>
            ))}
          </svg>
        </div>
        
        <div className="flex-1 bg-indigo-50/50 p-5 rounded-lg text-sm border border-indigo-100 shadow-inner">
          <h4 className="font-bold mb-3 text-indigo-900">Hướng dẫn Tương tác:</h4>
          <p className="mb-4 text-indigo-800 leading-relaxed">
            Kéo thả các điểm <span className="font-bold bg-indigo-100 px-1 rounded">A, B, C</span> trên màn hình để thay đổi chiều dài và hướng của các vectơ thành phần. Quan sát sự thay đổi của vectơ độ dịch chuyển tổng hợp màu đỏ.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm flex items-center">
              <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
              <span className="font-bold text-slate-700">Dịch chuyển 1</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-green-200 shadow-sm flex items-center">
              <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
              <span className="font-bold text-slate-700">Dịch chuyển 2</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-red-200 shadow-sm col-span-2 flex items-center">
              <div className="w-4 h-4 rounded bg-red-500 mr-2 border-2 border-dashed border-white"></div>
              <span className="font-bold text-slate-700">Độ dịch chuyển tổng hợp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
