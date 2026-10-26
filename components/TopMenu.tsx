'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MousePointer2, Hand, Pen, Highlighter, Eraser, Type, Minus, ArrowRight, Square, Circle, ChevronDown, Download, Wand2, Play, Pause, RotateCcw, Scissors, BookOpen, ClipboardList } from 'lucide-react';
import { ToolType } from '../types';
import { FullscreenButton } from './FullscreenButton';
import { useBoardStore } from '../store/useBoardStore';
import { resolveLessonUrl, lessonUrl, lessonTabTitle } from '@/lib/lessons';


export function TopMenu() {
  const { tool, setTool, currentShapeTool, tabs, activeTabId, openLessonTab } = useBoardStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeLesson = activeTab?.type === 'lesson' && activeTab.url ? resolveLessonUrl(activeTab.url) : undefined;
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        (!menuRef.current || !menuRef.current.contains(e.target as Node))
      ) {
        setShowShapeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleExercise = () => {
    if (!activeLesson) return;
    const targetPart = activeLesson.part === 'exercises' ? 'theory' : 'exercises';
    const targetUrl = lessonUrl(activeLesson.lesson, targetPart);
    const title = lessonTabTitle(activeLesson.lesson, targetPart);
    openLessonTab(targetUrl, title);
  };

  const isShapeActive = ['line', 'arrow', 'rect', 'ellipse', 'arc', 'sine', 'bezier', 'angle', 'right-angle', 'equal-segment'].includes(tool);

  const getShapeIcon = (shapeType: ToolType) => {
    switch (shapeType) {
      case 'line': return <Minus size={20} />;
      case 'arrow': return <ArrowRight size={20} />;
      case 'rect': return <Square size={20} />;
      case 'ellipse': return <Circle size={20} />;
      case 'arc': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M 3 12 A 9 9 0 0 1 21 12" /></svg>;
      case 'sine': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M 3 12 Q 7 3 12 12 T 21 12" /></svg>;
      case 'bezier': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M 3 12 Q 12 3 21 12 M 12 3 L 12 3" /></svg>;
      case 'angle': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 21 20 L 4 20 L 16 4" />
          <path d="M 9 20 A 6 6 0 0 1 12 15" />
        </svg>
      );
      case 'right-angle': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 20 20 L 4 20 L 4 4" />
          <path d="M 4 12 L 12 12 L 12 20" />
        </svg>
      );
      case 'equal-segment': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="10" y1="7" x2="10" y2="17" />
          <line x1="14" y1="7" x2="14" y2="17" />
        </svg>
      );
      default: return <Square size={20} />;
    }
  };

  const handleShapeSelect = (shapeType: ToolType) => {
    setTool(shapeType);
    setShowShapeDropdown(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '8px 16px',
      background: 'rgba(255, 255, 255, 0.95)',
      color: 'var(--text-primary)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      gap: '12px',
      zIndex: 20,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>


      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button className={`tool-btn ${tool === 'hand' ? 'active' : ''}`} onClick={() => setTool('hand')} title="Di chuyển trang (Hand/Space)">
          <Hand size={20} />
        </button>
        <button className={`tool-btn ${tool === 'select-object' ? 'active' : ''}`} onClick={() => setTool('select-object')} title="Chọn (V)">
          <MousePointer2 size={20} />
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')} title="Bút vẽ (P)">
          <Pen size={20} />
        </button>
        <button className={`tool-btn ${tool === 'highlighter' ? 'active' : ''}`} onClick={() => setTool('highlighter')} title="Bút nhớ (H)">
          <Highlighter size={20} />
        </button>
        <button className={`tool-btn ${tool === 'laser' ? 'active' : ''}`} onClick={() => setTool('laser')} title="Bút laser (W)">
          <Wand2 size={20} color="var(--danger, #ef4444)" />
        </button>
        <button className={`tool-btn ${tool === 'eraser-object' ? 'active' : ''}`} onClick={() => setTool('eraser-object')} title="Tẩy (E)">
          <Eraser size={20} color="var(--danger, #ef4444)" />
        </button>
        <button className={`tool-btn ${tool === 'text' ? 'active' : ''}`} onClick={() => setTool('text')} title="Chữ (T)">
          <Type size={20} />
        </button>
        <button className={`tool-btn ${tool === 'snip' ? 'active' : ''}`} onClick={() => setTool('snip')} title="Chụp vùng (Snip)">
          <Scissors size={20} />
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <button 
            className={`tool-btn ${isShapeActive ? 'active' : ''}`} 
            onClick={() => setTool(currentShapeTool)}
            style={{ borderRadius: '4px 0 0 4px' }}
            title="Công cụ hình khối"
          >
            {getShapeIcon(currentShapeTool)}
          </button>
          <button 
            className="tool-btn" 
            onClick={() => {
              if (!showShapeDropdown && dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                setDropdownPos({ top: rect.bottom, left: rect.left });
              }
              setShowShapeDropdown(!showShapeDropdown);
            }}
            style={{ borderRadius: '0 4px 4px 0', padding: '0 4px', width: 'auto' }}
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {showShapeDropdown && typeof document !== 'undefined' && createPortal(
          <div ref={menuRef} style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            marginTop: '8px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 100,
            minWidth: '220px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, padding: '2px 4px 4px 4px' }}>HÌNH CƠ BẢN</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                <button className={`tool-btn ${currentShapeTool === 'line' ? 'active' : ''}`} onClick={() => handleShapeSelect('line')} title="Đường thẳng"><Minus size={20} /></button>
                <button className={`tool-btn ${currentShapeTool === 'arrow' ? 'active' : ''}`} onClick={() => handleShapeSelect('arrow')} title="Mũi tên"><ArrowRight size={20} /></button>
                <button className={`tool-btn ${currentShapeTool === 'rect' ? 'active' : ''}`} onClick={() => handleShapeSelect('rect')} title="Hình chữ nhật"><Square size={20} /></button>
                <button className={`tool-btn ${currentShapeTool === 'ellipse' ? 'active' : ''}`} onClick={() => handleShapeSelect('ellipse')} title="Hình Elip/Tròn"><Circle size={20} /></button>
                <button className={`tool-btn ${currentShapeTool === 'arc' ? 'active' : ''}`} onClick={() => handleShapeSelect('arc')} title="Cung tròn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M 3 12 A 9 9 0 0 1 21 12" /></svg>
                </button>
                <button className={`tool-btn ${currentShapeTool === 'sine' ? 'active' : ''}`} onClick={() => handleShapeSelect('sine')} title="Sóng Sin">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M 3 12 Q 7 3 12 12 T 21 12" /></svg>
                </button>
                <button className={`tool-btn ${currentShapeTool === 'bezier' ? 'active' : ''}`} onClick={() => handleShapeSelect('bezier')} title="Đường cong Bezier">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M 3 12 Q 12 3 21 12 M 12 3 L 12 3" /></svg>
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
              <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, padding: '2px 4px 4px 4px' }}>KÝ HIỆU HÌNH HỌC</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                <button className={`tool-btn ${currentShapeTool === 'angle' ? 'active' : ''}`} onClick={() => handleShapeSelect('angle')} title="Ký hiệu góc">
                  {getShapeIcon('angle')}
                </button>
                <button className={`tool-btn ${currentShapeTool === 'right-angle' ? 'active' : ''}`} onClick={() => handleShapeSelect('right-angle')} title="Ký hiệu góc vuông">
                  {getShapeIcon('right-angle')}
                </button>
                <button className={`tool-btn ${currentShapeTool === 'equal-segment' ? 'active' : ''}`} onClick={() => handleShapeSelect('equal-segment')} title="Ký hiệu đoạn bằng nhau">
                  {getShapeIcon('equal-segment')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
      
      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center' }}>
        {activeLesson && (
          <>
            <button 
              className="tool-btn" 
              onClick={handleToggleExercise} 
              title={activeLesson.part === 'exercises' ? 'Quay lại bài giảng' : 'Làm bài tập'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)' }}
            >
              {activeLesson.part === 'exercises' ? <BookOpen size={16} className="text-indigo-600" /> : <ClipboardList size={16} className="text-indigo-600" />}
              <span>{activeLesson.part === 'exercises' ? 'Bài giảng' : 'Bài tập'}</span>
            </button>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }} />
          </>
        )}
        <button className="tool-btn" onClick={() => window.dispatchEvent(new CustomEvent('export-pdf'))} title="Lưu thành PDF">
          <Download size={20} />
        </button>
        <FullscreenButton />
      </div>

    </div>
  );
}
