'use client';

import React from 'react';
import { CanvasBoard } from '../components/CanvasBoard';
import { TopMenu } from '../components/TopMenu';
import { TabsBar } from '../components/TabsBar';
import { PropertiesBar } from '../components/PropertiesBar';
import { FloatingProperties } from '../components/FloatingProperties';
import { useBoardStore } from '../store/useBoardStore';

export default function BoardPage() {
  const { tabs, activeTabId } = useBoardStore();

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* UI Layer */}
      <div className="ui-toolbar" style={{ zIndex: 30, display: 'flex', flexDirection: 'column', paddingBottom: '0px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.95)' }}>
        <TopMenu />
        <TabsBar />
        <PropertiesBar />
      </div>

      <FloatingProperties />

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
               pdfFile={tab.file} 
               isActive={tab.id === activeTabId} 
             />
           </div>
        ))}
      </div>
    </div>
  );
}
