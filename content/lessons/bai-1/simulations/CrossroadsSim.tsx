import React from 'react';

export const CrossroadsSim = () => {
  return (
    <div className="w-full flex justify-center p-4">
      <svg viewBox="0 0 200 200" className="w-full max-w-[250px] h-auto bg-white rounded-xl shadow-sm border border-slate-200" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Roads */}
          <rect x="80" y="0" width="40" height="200" fill="#f1f5f9" />
          <rect x="0" y="80" width="200" height="40" fill="#f1f5f9" />
          
          {/* Road dashes */}
          <line x1="100" y1="0" x2="100" y2="80" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="100" y1="120" x2="100" y2="200" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="0" y1="100" x2="80" y2="100" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="120" y1="100" x2="200" y2="100" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />

          {/* Center O */}
          <circle cx="100" cy="100" r="5" fill="#ef4444" />
          <text x="110" y="94" fontSize="14" fontWeight="bold" fill="#ef4444">O</text>

          {/* Car at O */}
          <rect x="92" y="92" width="16" height="16" rx="3" fill="#1e293b" />
          {/* Headlights */}
          <circle cx="95" cy="94" r="1.5" fill="#fef08a" />
          <circle cx="105" cy="94" r="1.5" fill="#fef08a" />

          {/* Directions */}
          <text x="100" y="20" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#64748b">Bắc</text>
          <text x="100" y="190" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#64748b">Nam</text>
          <text x="20" y="104" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#64748b">Tây</text>
          <text x="180" y="104" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#64748b">Đông</text>

          {/* Question marks representing uncertainty */}
          <g className="animate-pulse">
            <text x="100" y="55" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#3b82f6">?</text>
            <text x="100" y="155" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#3b82f6">?</text>
            <text x="50" y="107" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#3b82f6">?</text>
            <text x="150" y="107" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#3b82f6">?</text>
          </g>
      </svg>
    </div>
  );
};
