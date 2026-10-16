'use client';

import React, { useEffect } from 'react';
import { CanvasBoard } from '../components/CanvasBoard';
import { TopMenu } from '../components/TopMenu';
import { TabsBar } from '../components/TabsBar';
import { PropertiesBar } from '../components/PropertiesBar';
import { useBoardStore } from '../store/useBoardStore';
import { resolveLessonUrl, lessonUrl, lessonTabTitle } from '@/lib/lessons';

export default function BoardPage() {
  const { tabs, activeTabId, openLessonTab } = useBoardStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const openLesson = urlParams.get('openLesson');
      const resolved = openLesson ? resolveLessonUrl(openLesson) : undefined;
      if (openLesson && resolved) {
        const cleanUrl = lessonUrl(resolved.lesson, resolved.part);
        const title = lessonTabTitle(resolved.lesson, resolved.part);
        openLessonTab(cleanUrl, title);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [openLessonTab]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'board-lesson-navigate' && typeof event.data.url === 'string') {
        const resolved = resolveLessonUrl(event.data.url);
        if (resolved) {
          const cleanUrl = lessonUrl(resolved.lesson, resolved.part);
          const title = lessonTabTitle(resolved.lesson, resolved.part);
          useBoardStore.getState().openLessonTab(cleanUrl, title);
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* UI Layer */}
      <div className="ui-toolbar" style={{ zIndex: 30, display: 'flex', flexDirection: 'column', paddingBottom: '0px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.95)' }}>
        <TopMenu />
        <TabsBar />
        <PropertiesBar />
      </div>

      {/* Canvas Layers */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {tabs.map(tab => (
           <div 
             key={tab.id} 
             style={{ 
               position: 'absolute', 
               top: 0, 
               left: 0, 
               right: 0, 
               bottom: 0,
               visibility: tab.id === activeTabId ? 'visible' : 'hidden',
               opacity: tab.id === activeTabId ? 1 : 0,
               pointerEvents: tab.id === activeTabId ? 'auto' : 'none'
             }}
           >
             <CanvasBoard 
               file={tab.file}
               fileType={tab.type}
               url={tab.url}
               isActive={tab.id === activeTabId} 
             />
           </div>
        ))}
      </div>
    </div>
  );
}
