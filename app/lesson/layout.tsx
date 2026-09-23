'use client';

import React from 'react';
import { PenTool } from 'lucide-react';

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  const handleOpenBoard = () => {
    window.location.href = '/?openLesson=' + encodeURIComponent(window.location.pathname);
  };

  const [isInIframe, setIsInIframe] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInIframe(window.self !== window.top);
    }
  }, []);

  return (
    <div className={`${isInIframe ? 'min-h-screen h-auto overflow-visible' : 'h-screen overflow-y-auto'} w-full bg-slate-50 text-slate-800 text-base leading-[1.6]`}>
      <main className="w-full px-4 sm:px-8 md:px-16 lg:px-32 xl:px-48 py-8 md:py-12">
        {children}
      </main>
      
      {!isInIframe && (
        <button 
          onClick={handleOpenBoard}
          className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-[0_4px_20px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:scale-110 transition-all flex items-center justify-center"
          title="Dùng công cụ Bảng vẽ"
        >
          <PenTool size={24} />
        </button>
      )}
    </div>
  );
}
