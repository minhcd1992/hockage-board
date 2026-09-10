'use client';
import React, { useState, useEffect } from 'react';

export const WestLakeSim = () => {
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
          return prev + 0.005; // loop time
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full max-w-[320px] mx-auto mt-2">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 text-xs uppercase tracking-wider mt-0.5">Hồ Tây</h3>
        <button 
          onClick={handleStart}
          disabled={isPlaying}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm ml-2"
        >
          {isPlaying ? 'Đang đi...' : progress === 1 ? 'Đi lại' : 'Bắt đầu đi bộ'}
        </button>
      </div>
      <div className="relative w-full aspect-[4/3] p-4 bg-blue-50/20 flex items-center justify-center">
        <svg viewBox="0 0 200 160" className="w-full h-full drop-shadow-md" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* West Lake Shape */}
            <path
                id="lakePath"
                d="M100 20 C160 20, 180 60, 160 120 C140 150, 60 140, 40 110 C20 80, 40 20, 100 20 Z"
                fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="2" 
            />

            {/* Animated Path (Quãng đường) */}
            <path
                d="M100 20 C160 20, 180 60, 160 120 C140 150, 60 140, 40 110 C20 80, 40 20, 100 20 Z"
                fill="none" stroke="#f97316" strokeWidth="4" 
                strokeDasharray={420}
                strokeDashoffset={420 - (progress * 420)}
                strokeLinecap="round"
            />

            {/* Start/End Point */}
            <circle cx="100" cy="20" r="6" fill="#10b981" />
            <circle cx="100" cy="20" r="2" fill="#ffffff" />
            <text x="100" y="8" fontSize="12" fontWeight="bold" fill="#374151" textAnchor="middle">A & B</text>

            {/* Result text */}
            <g style={{ opacity: progress === 1 ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}>
              <rect x="25" y="64" width="150" height="42" rx="6" fill="#ffffff" fillOpacity="0.95" stroke="#fca5a5" strokeWidth="1" />
              <text x="100" y="80" fontSize="12" fontWeight="bold" fill="#f97316" textAnchor="middle">Quãng đường: 15 km</text>
              <text x="100" y="98" fontSize="12" fontWeight="bold" fill="#ef4444" textAnchor="middle">Độ dịch chuyển: 0 km</text>
            </g>
        </svg>
      </div>
    </div>
  );
};
