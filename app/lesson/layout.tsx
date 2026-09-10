import React from 'react';

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 text-base leading-[1.6]">
      <main className="w-full px-4 sm:px-8 md:px-16 lg:px-32 xl:px-48 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
