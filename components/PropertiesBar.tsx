'use client';

import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { Shape } from '../objects/Shape';
import { Stroke } from '../objects/Stroke';
import { Text } from '../objects/Text';
import { ArrowHeadType } from '../types';
import { PaintBucket, Grid, Magnet, Sun, Moon } from 'lucide-react';

export function PropertiesBar() {
  const state = useBoardStore();
  const engineRef = state.activeEngineRef;
  const presetColors = ['#ffffff', '#000000', '#ff0000', '#ffcc00', '#00ff00', '#00ccff', '#ff00ff', '#ff8800'];
  const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

  // Identify context
  let isEditingObject = false;
  
  const [, forceRender] = React.useReducer((s) => s + 1, 0);

  // Create safe update function for active object
  const updateActiveObject = (updates: any) => {
    if (!engineRef || !engineRef.current || !state.editingObjectId) return;
    const obj = engineRef.current.scene.objects.find((o: any) => o.id === state.editingObjectId);
    if (obj) {
      Object.assign(obj, updates);
      engineRef.current.scene.saveState();
      engineRef.current.renderer.renderMain();
      forceRender();
    }
  };

  // Determine which properties to show based on either the editing object, or the current tool
  let showColor = false;
  let showSize = false;
  let showStrokeStyle = false;
  let showFill = false;
  let showArrows = false;
  let showSineParams = false;
  let showTextParams = false;
  let showPhysics = false;
  
  let activeColor = state.strokeColor;
  let activeSize = state.strokeSize;
  let activeStrokeStyle = state.strokeStyleType;
  let activeIsFilled = state.isFilled;
  let activeFontFamily = state.fontFamily;
  let activeFontSize = state.fontSize;
  let isPhysicsObject = false;
  let isStatic = false;
  let physicsMass = 1;
  let physicsVelocityX = 0;
  let physicsVelocityY = 0;
  let physicsAccelerationX = 0;
  let physicsAccelerationY = 0;
  
  let arrowStart: ArrowHeadType = 'none';
  let arrowEnd: ArrowHeadType = 'arrow';
  let middleArrow = false;
  let sineW = state.sineWavelength;
  let sineA = state.sineAmplitude;

  let obj = null;
  let activeIsFilled_ = false;
  
  if (state.editingObjectId && engineRef && engineRef.current) {
    obj = engineRef.current.scene.objects.find((o: any) => o.id === state.editingObjectId);
  }

  if (obj) {
    isEditingObject = true;
    activeColor = obj.color;
    
    if (obj.type === 'stroke') {
      showColor = true;
      showSize = true;
      activeSize = obj.size;
    } else if (obj.type === 'shape' || obj.shapeType) {
      showColor = true;
      showSize = true;
      showStrokeStyle = true;
      showFill = true;
      activeSize = obj.size;
      activeStrokeStyle = obj.strokeStyleType || 'solid';
      activeIsFilled = obj.isFilled || false;
      
      if (obj.shapeType === 'arrow') {
        showArrows = true;
        arrowStart = obj.arrowStart || 'none';
        arrowEnd = obj.arrowEnd || 'arrow';
        middleArrow = obj.middleArrow || false;
      } else if (obj.shapeType === 'sine') {
        showSineParams = true;
        sineW = obj.sineWavelength || 50;
        sineA = obj.sineAmplitude || 20;
      }
    } else if (obj.type === 'text' || 'fontFamily' in obj) {
      showColor = true;
      showTextParams = true;
      activeFontFamily = obj.fontFamily;
      activeFontSize = obj.fontSize;
    }
  } else {
    // Show based on selected tool
    const t = state.tool;
    if (t === 'pen' || t === 'highlighter' || t === 'line' || t === 'arrow' || t === 'rect' || t === 'ellipse' || t === 'arc' || t === 'sine' || t === 'bezier') {
      showColor = true;
      showSize = true;
      if (t !== 'pen' && t !== 'highlighter') {
        showStrokeStyle = true;
        showFill = true;
      }
      if (t === 'sine') showSineParams = true;
    } else if (t === 'text') {
      showColor = true;
      showTextParams = true;
    }
  }

  // Value updaters
  const handleColorChange = (c: string) => {
    if (isEditingObject) updateActiveObject({ color: c });
    else state.setStrokeColor(c);
  };
  const handleSizeChange = (s: number) => {
    if (isEditingObject) updateActiveObject({ size: s });
    else state.setStrokeSize(s);
  };
  const handleStrokeStyleChange = (style: any) => {
    if (isEditingObject) updateActiveObject({ strokeStyleType: style });
    else state.setStrokeStyleType(style);
  };
  const handleFillChange = (fill: boolean) => {
    if (isEditingObject) updateActiveObject({ isFilled: fill });
    else state.setIsFilled(fill);
  };
  const handleSineChange = (w: number, a: number) => {
    if (isEditingObject) updateActiveObject({ sineWavelength: w, sineAmplitude: a });
    else {
      state.setSineWavelength(w);
      state.setSineAmplitude(a);
    }
  };
  const handleTextChange = (font: string, size: number) => {
    if (isEditingObject) updateActiveObject({ fontFamily: font, fontSize: size });
    else {
      state.setFontFamily(font);
      state.setFontSize(size);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6px 16px',
      background: 'rgba(255, 255, 255, 0.95)',
      color: 'var(--text-primary)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      gap: '16px',
      zIndex: 19,
      fontSize: '13px',
      flexWrap: 'wrap'
    }}>
      {/* Grid Controls (Always visible or maybe right aligned) */}
      <div style={{ display: 'flex', gap: '4px', marginRight: 'auto' }}>
        <button className={`tool-btn ${state.gridEnabled ? 'active' : ''}`} onClick={state.toggleGrid} title="Bật/tắt lưới" style={{ padding: '4px', width: 'auto', height: 'auto' }}>
          <Grid size={16} /> <span style={{ marginLeft: '4px' }}>Grid</span>
        </button>
        <button className={`tool-btn ${state.snapToGrid ? 'active' : ''}`} onClick={state.toggleSnapToGrid} title="Bắt điểm vào lưới" style={{ padding: '4px', width: 'auto', height: 'auto' }}>
          <Magnet size={16} /> <span style={{ marginLeft: '4px' }}>Snap</span>
        </button>
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
        <button 
          className="tool-btn" 
          onClick={() => state.setTheme(state.theme === 'green' ? 'white' : 'green')} 
          title="Đổi màu nền bảng" 
          style={{ padding: '4px', width: 'auto', height: 'auto', color: state.theme === 'white' ? '#000' : 'inherit' }}
        >
          {state.theme === 'white' ? <Moon size={16} /> : <Sun size={16} />}
          <span style={{ marginLeft: '4px' }}>{state.theme === 'white' ? 'Nền xanh' : 'Nền trắng'}</span>
        </button>
      </div>

      {isEditingObject && (
        <div style={{ color: '#00ccff', fontWeight: 'bold' }}>
          Đang sửa thuộc tính đối tượng...
        </div>
      )}

      {showColor && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#aaa' }}>Màu:</span>
          {presetColors.map(c => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              style={{
                width: '16px', height: '16px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                backgroundColor: c, outline: activeColor === c ? '2px solid white' : 'none', outlineOffset: '1px'
              }}
            />
          ))}
          <input type="color" value={activeColor} onChange={(e) => handleColorChange(e.target.value)} style={{ width: '20px', height: '20px', padding: 0, border: 'none', marginLeft: '4px', cursor: 'pointer' }} />
        </div>
      )}

      {showSize && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#aaa' }}>Cỡ nét:</span>
          <div style={{ display: 'flex', alignItems: 'center', background: '#333', borderRadius: '4px', overflow: 'hidden', border: '1px solid #555' }}>
            <button 
              onClick={() => handleSizeChange(Math.max(0.1, activeSize - (activeSize <= 1 ? 0.1 : 1)))} 
              style={{ padding: '2px 8px', background: '#444', border: 'none', color: '#fff', cursor: 'pointer', borderRight: '1px solid #555' }}
            >
              -
            </button>
            <input 
              type="number" 
              min="0.1" 
              max="50" 
              step="0.1" 
              value={Number(activeSize.toFixed(1))} 
              onChange={(e) => {
                 const val = parseFloat(e.target.value);
                 if (!isNaN(val)) handleSizeChange(Math.max(0.1, val));
              }}
              style={{ width: '48px', background: 'transparent', color: '#fff', border: 'none', textAlign: 'center', outline: 'none' }} 
            />
            <button 
              onClick={() => handleSizeChange(Math.min(50, activeSize + (activeSize < 1 ? 0.1 : 1)))} 
              style={{ padding: '2px 8px', background: '#444', border: 'none', color: '#fff', cursor: 'pointer', borderLeft: '1px solid #555' }}
            >
              +
            </button>
          </div>
        </div>
      )}

      {showStrokeStyle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
           <span style={{ color: '#aaa' }}>Kiểu nét:</span>
           <select value={activeStrokeStyle} onChange={(e) => handleStrokeStyleChange(e.target.value)} style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '2px 4px' }}>
             <option value="solid">Liền</option>
             <option value="dashed">Đứt</option>
             <option value="dotted">Chấm</option>
           </select>
        </div>
      )}

      {showFill && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className={`tool-btn ${activeIsFilled ? 'active' : ''}`} onClick={() => handleFillChange(!activeIsFilled)} title="Tô màu nền" style={{ padding: '4px', height: 'auto' }}>
             <PaintBucket size={16} /> <span style={{ marginLeft: '4px', whiteSpace: 'nowrap' }}>Tô nền</span>
          </button>
        </div>
      )}
      
      {showArrows && isEditingObject && (
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#aaa' }}>Đầu mũi tên:</span>
            <select value={arrowStart} onChange={(e) => updateActiveObject({ arrowStart: e.target.value })} style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '2px 4px' }}>
              <option value="none">Không</option><option value="arrow">Thuận</option><option value="inverted">Ngược</option>
            </select>
            <span style={{ color: '#aaa' }}>Cuối mũi tên:</span>
            <select value={arrowEnd} onChange={(e) => updateActiveObject({ arrowEnd: e.target.value })} style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '2px 4px' }}>
              <option value="none">Không</option><option value="arrow">Thuận</option><option value="inverted">Ngược</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#aaa' }}>
              <input type="checkbox" checked={middleArrow} onChange={(e) => updateActiveObject({ middleArrow: e.target.checked })} /> Mũi tên giữa
            </label>
         </div>
      )}

      {showSineParams && (
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <span style={{ color: '#aaa' }}>Chu kỳ:</span>
           <input type="range" min="10" max="200" step="5" value={sineW} onChange={(e) => handleSineChange(Number(e.target.value), sineA)} style={{ width: '60px' }} />
           <span style={{ color: '#aaa' }}>Biên độ:</span>
           <input type="range" min="5" max="100" step="5" value={sineA} onChange={(e) => handleSineChange(sineW, Number(e.target.value))} style={{ width: '60px' }} />
         </div>
      )}

      {showTextParams && (
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <span style={{ color: '#aaa' }}>Font:</span>
           <select value={activeFontFamily} onChange={(e) => handleTextChange(e.target.value, activeFontSize)} style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '2px 4px' }}>
             {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
           </select>
           <span style={{ color: '#aaa' }}>Cỡ chữ:</span>
           <input type="range" min="10" max="100" value={activeFontSize} onChange={(e) => handleTextChange(activeFontFamily, Number(e.target.value))} style={{ width: '80px' }} />
           <span>{activeFontSize}px</span>
         </div>
      )}

      {showPhysics && isEditingObject && (
        <>
          <div style={{ width: '1px', height: '24px', background: '#555' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px' }}>
              (Thuộc tính Vật lý đã được chuyển sang bảng điều khiển bên phải)
            </span>
          </div>
        </>
      )}
    </div>
  );
}
