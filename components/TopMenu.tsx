'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MousePointer2, Hand, Pen, Highlighter, Eraser, Type, Minus, ArrowRight, Square, Circle, ChevronDown, Download, Wand2, Play, Pause, RotateCcw } from 'lucide-react';
import { ToolType } from '../types';
import { useBoardStore } from '../store/useBoardStore';

import { pendulumExperiment } from '../lab/experiments/pendulum';
import { LabWidget } from '../objects/LabWidget';
import { LabLibraryModal } from './LabLibraryModal';

export function TopMenu() {
  const { tool, setTool, currentShapeTool, setCurrentShapeTool, tabs, activeTabId, activeEngineRef } = useBoardStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
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

  const isShapeActive = ['line', 'arrow', 'rect', 'ellipse', 'arc', 'sine', 'bezier'].includes(tool);

  const getShapeIcon = (shapeType: ToolType) => {
    switch (shapeType) {
      case 'line': return <Minus size={20} />;
      case 'arrow': return <ArrowRight size={20} />;
      case 'rect': return <Square size={20} />;
      case 'ellipse': return <Circle size={20} />;
      case 'arc': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M 3 12 A 9 9 0 0 1 21 12" /></svg>;
      case 'sine': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M 3 12 Q 7 3 12 12 T 21 12" /></svg>;
      case 'bezier': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M 3 12 Q 12 3 21 12 M 12 3 L 12 3" /></svg>;
      default: return <Square size={20} />;
    }
  };

  const handleShapeSelect = (shapeType: ToolType) => {
    setCurrentShapeTool(shapeType);
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
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '4px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            zIndex: 100
          }}>
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
          </div>,
          document.body
        )}
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
      <div style={{ display: 'flex', flexShrink: 0 }}>
        <button 
          className="tool-btn" 
          onClick={() => {
            setShowLabModal(true);
          }} 
          title="Thư viện Bài Thí nghiệm (Lab)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
      
      <div style={{ display: 'flex', flexShrink: 0 }}>
        <button className="tool-btn" onClick={() => window.dispatchEvent(new CustomEvent('export-pdf'))} title="Lưu thành PDF">
          <Download size={20} />
        </button>
      </div>

      {showLabModal && (
        <LabLibraryModal 
          onClose={() => setShowLabModal(false)}
          onSelect={(config) => {
            if (activeEngineRef?.current) {
              const widget = new LabWidget(config, 100, 100, 1000, 650);
              activeEngineRef.current.scene.addObject(widget);
              setTool('select-object');
              // Automatically select the newly created widget to show properties
              useBoardStore.getState().setEditingObjectId(widget.id);
              widget.selected = true;
              activeEngineRef.current.renderer.renderMain();
            }
            setShowLabModal(false);
          }}
        />
      )}
    </div>
  );
}
