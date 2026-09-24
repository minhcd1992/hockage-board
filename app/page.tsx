'use client';

import React, { useEffect } from 'react';
import { CanvasBoard } from '../components/CanvasBoard';
import { TopMenu } from '../components/TopMenu';
import { TabsBar } from '../components/TabsBar';
import { PropertiesBar } from '../components/PropertiesBar';
import { useBoardStore } from '../store/useBoardStore';
import { resolveLessonUrl, lessonTabTitle } from '@/lib/lessons';

export default function BoardPage() {
  const { tabs, activeTabId, addTab, setActiveTab } = useBoardStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const openLesson = urlParams.get('openLesson');
      const resolved = openLesson ? resolveLessonUrl(openLesson) : undefined;
      if (openLesson && resolved) {
        const existingTab = tabs.find(t => t.url === openLesson);
        if (existingTab) {
          setActiveTab(existingTab.id);
        } else {
          const id = 'lesson-' + Date.now();
          const title = lessonTabTitle(resolved.lesson, resolved.part);
          addTab({ id, type: 'lesson', title, url: openLesson });
          setActiveTab(id);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [tabs, addTab, setActiveTab]);

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
