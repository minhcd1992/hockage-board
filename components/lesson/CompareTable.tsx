import React from 'react';
import { Math } from '@/components/lesson/Math';

export const CompareTable = () => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-8 bg-white">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-slate-100 text-slate-800">
            <th className="p-4 border-b-2 border-slate-300 w-1/4 align-top">Đặc điểm so sánh</th>
            <th className="p-4 border-b-2 border-blue-300 w-3/8 text-blue-800 bg-blue-50/50 align-top">Quãng đường (<Math inline>{"s"}</Math>)</th>
            <th className="p-4 border-b-2 border-teal-300 w-3/8 text-teal-800 bg-teal-50/50 align-top">Độ dịch chuyển (<Math inline>{"\\vec{d}"}</Math>)</th>
          </tr>
        </thead>
        <tbody className="text-slate-700 align-top">
          {/* Row 1 */}
          <tr className="border-b border-slate-200 hover:bg-slate-50 transition">
            <td className="p-4 font-semibold text-slate-800">Bản chất vật lý</td>
            <td className="p-4 border-l border-slate-200 bg-blue-50/20">
              Đại lượng <strong>vô hướng</strong> (scalar).
              <div className="mt-3 flex items-center text-sm text-slate-600 bg-white p-2 rounded border border-blue-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center font-bold text-blue-700 mr-3">5 km</div>
                Chỉ cần 1 con số để xác định.
              </div>
            </td>
            <td className="p-4 border-l border-slate-200 bg-teal-50/20">
              Đại lượng <strong>vectơ</strong> (vector).
              <div className="mt-3 flex items-center text-sm text-slate-600 bg-white p-2 rounded border border-teal-100 shadow-sm">
                <svg className="w-16 h-10 mr-3" viewBox="0 0 60 40">
                  <defs>
                    <marker id="arrowTeal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#0d9488" />
                    </marker>
                  </defs>
                  <rect width="60" height="40" rx="4" fill="#ccfbf1" />
                  <path d="M 10 20 L 45 20" stroke="#0d9488" strokeWidth="2" markerEnd="url(#arrowTeal)" />
                  <text x="30" y="13" textAnchor="middle" fontWeight="bold" fill="#0d9488" fontSize="10">5 km</text>
                  <text x="30" y="32" textAnchor="middle" fontWeight="bold" fill="#0d9488" fontSize="10">Hướng Đông</text>
                </svg>
                Cần cả độ lớn và hướng.
              </div>
            </td>
          </tr>

          {/* Row 2 */}
          <tr className="border-b border-slate-200 hover:bg-slate-50 transition">
            <td className="p-4 font-semibold text-slate-800">Xác định bằng</td>
            <td className="p-4 border-l border-slate-200 bg-blue-50/20">
              Tổng chiều dài toàn bộ quỹ đạo thực tế.
              <div className="mt-3 bg-white p-2 rounded border border-blue-100 text-center shadow-sm">
                <svg className="w-full h-16 max-w-[150px] mx-auto" viewBox="0 0 120 50">
                  <path d="M 30 30 C 50 -5, 70 45, 90 15" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="4,3" />
                  <circle cx="30" cy="30" r="4" fill="#64748b" />
                  <circle cx="90" cy="15" r="4" fill="#64748b" />
                  <text x="30" y="46" fontSize="10" fontWeight="bold" fill="#64748b" textAnchor="middle">Điểm đầu</text>
                  <text x="90" y="32" fontSize="10" fontWeight="bold" fill="#64748b" textAnchor="middle">Điểm cuối</text>
                </svg>
              </div>
            </td>
            <td className="p-4 border-l border-slate-200 bg-teal-50/20">
              Đoạn thẳng nối trực tiếp điểm đầu và điểm cuối.
              <div className="mt-3 bg-white p-2 rounded border border-teal-100 text-center shadow-sm">
                <svg className="w-full h-16 max-w-[150px] mx-auto" viewBox="0 0 120 50">
                  <path d="M 30 30 C 50 -5, 70 45, 90 15" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeDasharray="4,3" />
                  <path d="M 30 30 L 85 16.5" stroke="#0d9488" strokeWidth="3" markerEnd="url(#arrowTeal)" />
                  <circle cx="30" cy="30" r="4" fill="#64748b" />
                  <circle cx="90" cy="15" r="4" fill="#64748b" />
                </svg>
              </div>
            </td>
          </tr>

          {/* Row 3 */}
          <tr className="border-b border-slate-200 hover:bg-slate-50 transition">
            <td className="p-4 font-semibold text-slate-800">Giá trị toán học</td>
            <td className="p-4 border-l border-slate-200 bg-blue-50/20">
              Luôn dương (<Math inline>{"s > 0"}</Math>). Tích lũy tăng dần.
              <div className="mt-3 p-3 bg-blue-100 rounded text-center text-blue-800 font-mono font-bold text-sm shadow-inner">
                s = |+3m| + |-2m| = 5m
              </div>
            </td>
            <td className="p-4 border-l border-slate-200 bg-teal-50/20">
              Có thể dương (+), âm (-) hoặc bằng 0 tùy chiều chuyển động.
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="py-2 bg-green-100 rounded text-center text-green-800 font-mono font-bold text-sm">d {">"} 0</div>
                <div className="py-2 bg-red-100 rounded text-center text-red-800 font-mono font-bold text-sm">d {"<"} 0</div>
                <div className="py-2 bg-slate-200 rounded text-center text-slate-800 font-mono font-bold text-sm">d = 0</div>
              </div>
            </td>
          </tr>

          {/* Row 4 */}
          <tr className="hover:bg-indigo-50 transition">
            <td className="p-4 font-semibold text-indigo-800">Mối quan hệ hình học</td>
            <td colSpan={2} className="p-4 border-l border-slate-200 bg-indigo-50/30">
              <div className="text-center mb-4">
                <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-bold text-xl border border-indigo-200 shadow-sm">
                  <Math inline>{"s \\ge |\\vec{d}|"}</Math>
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-indigo-200 rounded-lg p-3 bg-white shadow-sm flex items-center space-x-3">
                  <div className="w-16">
                    <svg viewBox="0 0 60 20" className="w-full h-auto">
                      <line x1="5" y1="10" x2="50" y2="10" stroke="#3b82f6" strokeWidth="4" strokeDasharray="2,2" />
                      <line x1="5" y1="10" x2="50" y2="10" stroke="#0d9488" strokeWidth="2" markerEnd="url(#arrowTeal)" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-indigo-700 text-sm">Khi <Math inline>{"s = |\\vec{d}|"}</Math></p>
                    <p className="text-xs text-slate-600">Vật đi thẳng & không đổi chiều.</p>
                  </div>
                </div>
                <div className="border border-indigo-200 rounded-lg p-3 bg-white shadow-sm flex items-center space-x-3">
                  <div className="w-16">
                    <svg viewBox="0 0 60 30" className="w-full h-auto">
                      <path d="M 5 20 Q 30 -10, 55 20" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="2,2" />
                      <line x1="5" y1="20" x2="50" y2="20" stroke="#0d9488" strokeWidth="2" markerEnd="url(#arrowTeal)" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-indigo-700 text-sm">Khi <Math inline>{"s > |\\vec{d}|"}</Math></p>
                    <p className="text-xs text-slate-600">Vật đi cong hoặc có quay đầu.</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
