'use client';
import React, { useState, useEffect } from 'react';

export const GpsDisplacementSim = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    if (isPlaying) {
      const animate = () => {
        setProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 1;
          }
          return prev + 0.01; // roughly 1.5 seconds
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  const handleStart = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  const pathLength = 550; // estimated path length

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 text-sm">Minh họa Quãng đường & Độ dịch chuyển</h3>
        <button 
          onClick={handleStart}
          disabled={isPlaying}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-5 py-2 mr-2 my-1 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          {progress === 1 ? 'Xem lại' : isPlaying ? 'Đang chạy...' : 'Bắt đầu chuyến đi'}
        </button>
      </div>
      <div className="relative w-full aspect-[4/3] sm:aspect-video p-2 sm:p-4 bg-slate-50/50">
        <svg viewBox="0 -20 400 260" className="w-full h-full drop-shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
            </defs>

            {/* Grid Background */}
            <rect x="0" y="-20" width="100%" height="280" fill="url(#grid)" className="opacity-70" />

            {/* Background GPS Path (Faded) */}
            <path
                d="M 50 180 C 80 180, 70 30, 150 70 C 230 110, 240 220, 290 150 C 330 90, 310 60, 350 60"
                fill="none" stroke="#e2e8f0" strokeWidth="4" strokeDasharray="6,4" />

            {/* Animated GPS Path (Distance) */}
            <path
                d="M 50 180 C 80 180, 70 30, 150 70 C 230 110, 240 220, 290 150 C 330 90, 310 60, 350 60"
                fill="none" stroke="#60a5fa" strokeWidth="4" 
                strokeDasharray={pathLength}
                strokeDashoffset={pathLength - (progress * pathLength)}
                strokeLinecap="round"
            />

            {/* Displacement (Bird's eye) - Only shows when progress reaches end */}
            <line x1="50" y1="180" x2="340" y2="64" stroke="#f87171" strokeWidth="3" markerEnd="url(#arrow)" 
                  style={{ opacity: progress > 0.95 ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }} />

            {/* Home */}
            <circle cx="50" cy="180" r="8" fill="#10b981" />
            <circle cx="50" cy="180" r="3" fill="#ffffff" />
            <text x="50" y="205" fontSize="12" fontWeight="bold" fill="#374151" textAnchor="middle">Nhà</text>

            {/* Cafe */}
            <circle cx="350" cy="60" r="8" fill="#f59e0b" />
            <circle cx="350" cy="60" r="3" fill="#ffffff" />
            <text x="350" y="45" fontSize="12" fontWeight="bold" fill="#374151" textAnchor="middle">Quán Cà Phê</text>

            {/* Labels (Fade in at end) */}
            <g style={{ opacity: progress > 0.95 ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}>
                <rect x="150" y="200" width="180" height="24" rx="4" fill="#ffffff" fillOpacity="0.95" stroke="#cbd5e1" strokeWidth="1" />
                <text x="240" y="216" fontSize="12" fontWeight="bold" fill="#3b82f6" textAnchor="middle">Quãng đường (GPS): 4,0 km</text>

                <rect x="110" y="80" width="160" height="24" rx="4" fill="#ffffff" fillOpacity="0.95" stroke="#fca5a5" strokeWidth="1" transform="rotate(-18, 190, 90)" />
                <text x="190" y="96" fontSize="12" fontWeight="bold" fill="#ef4444" textAnchor="middle" transform="rotate(-18, 190, 90)">Độ dịch chuyển: 2,5 km</text>
            </g>
        </svg>
      </div>
    </div>
  );
};
