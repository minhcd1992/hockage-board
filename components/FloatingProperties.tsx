"use client";

import React, { useState } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { LabWidget } from '../objects/LabWidget';
import { Play, Pause, RotateCcw, ChevronUp, ChevronDown, Settings } from 'lucide-react';

export const FloatingProperties = () => {
  const state = useBoardStore();
  const engineRef = state.activeEngineRef;
  const [, forceRender] = React.useReducer((s) => s + 1, 0);
  const [isMinimized, setIsMinimized] = useState(false);

  const isEditingObject = state.editingObjectId !== null;
  let obj: any = null;
  if (isEditingObject && engineRef?.current) {
    obj = engineRef.current.scene.objects.find((o: any) => o.id === state.editingObjectId);
  }

  // Right now, this panel is specifically for LabWidget.
  // We can expand it later to handle stroke width, colors for shapes, etc.
  if (!obj || obj.type !== 'lab-widget') return null;

  const labWidget = obj as LabWidget;
  const labEngine = labWidget.engine;

  const updateLabObject = (objId: string, updates: any) => {
    labEngine.updateConfig(objId, updates);
    if (engineRef?.current) {
      engineRef.current.renderer.renderMain();
      forceRender();
    }
  };

  const handlePlayPause = () => {
    if (labEngine.state === 'playing') {
      labEngine.pause();
    } else {
      labEngine.play();
    }
    forceRender();
  };

  const handleReset = () => {
    labEngine.reset();
    if (engineRef?.current) {
      engineRef.current.renderer.renderMain();
      forceRender();
    }
  };

  // Floating panel style
  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    right: '20px',
    top: '70px',
    width: '320px',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid #444',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    color: '#eee',
    zIndex: 1000,
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'height 0.3s ease',
    height: isMinimized ? '44px' : 'auto'
  };

  const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: isMinimized ? 'none' : '1px solid #444',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold',
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    cursor: 'pointer'
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle} onClick={() => setIsMinimized(!isMinimized)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={18} color="#60a5fa" />
          <span>Thông số Thí nghiệm</span>
        </div>
        <div>
          {isMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>

      {!isMinimized && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '60vh' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '-8px' }}>
            Bài: {labEngine.config.title}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePlayPause}
              style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: labEngine.state === 'playing' ? '#f59e0b' : '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {labEngine.state === 'playing' ? <Pause size={18} /> : <Play size={18} />}
              {labEngine.state === 'playing' ? 'Tạm dừng' : 'Chạy'}
            </button>
            <button
              onClick={handleReset}
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              title="Khôi phục trạng thái ban đầu"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {labEngine.config.objects.map(labObj => {
            // Filter controls for this object
            const objControls = (labEngine.config.controls || []).filter(c => c.startsWith(`${labObj.id}.`));
            
            if (objControls.length > 0 || labObj.type === 'pendulum') {
              return (
                <div key={labObj.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', marginTop: '8px' }}>
                    {labObj.name || labObj.id}
                  </div>
                  
                  {/* Legacy Pendulum specific (could be moved to controls config but let's keep for backward compat) */}
                  {labObj.type === 'pendulum' && !objControls.length && (
                    <>
                      <div style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>Chiều dài dây (px)</span>
                          <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{labObj.length}</span>
                        </div>
                        <input 
                          type="range" min="100" max="400" step="10" 
                          value={labObj.length || 200}
                          onChange={(e) => updateLabObject(labObj.id, { length: parseFloat(e.target.value) })}
                          style={{ width: '100%', accentColor: '#3b82f6' }}
                        />
                      </div>
                      <div style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>Khối lượng (kg)</span>
                          <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{labObj.mass}</span>
                        </div>
                        <input 
                          type="range" min="0.1" max="5" step="0.1" 
                          value={labObj.mass || 1}
                          onChange={(e) => updateLabObject(labObj.id, { mass: parseFloat(e.target.value) })}
                          style={{ width: '100%', accentColor: '#3b82f6' }}
                        />
                      </div>
                      <div style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>Góc thả (độ)</span>
                          <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{labObj.angle}</span>
                        </div>
                        <input 
                          type="range" min="-90" max="90" step="1" 
                          value={labObj.angle || 0}
                          onChange={(e) => updateLabObject(labObj.id, { angle: parseFloat(e.target.value) })}
                          style={{ width: '100%', accentColor: '#3b82f6' }}
                        />
                      </div>
                    </>
                  )}

                  {/* Dynamic Controls */}
                  {objControls.map(c => {
                    const path = c.substring(labObj.id.length + 1); // e.g., 'kinematics.initialVelocity.x' or 'initialPosition.y'
                    
                    // Helper to get value
                    const getVal = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);
                    const val = getVal(labObj, path) ?? 0;
                    
                    let label = path;
                    let min = -200, max = 200, step = 1;
                    
                    if (path.includes('velocity') || path.includes('Velocity')) {
                       label = 'Vận tốc ' + (path.endsWith('x') ? 'X' : 'Y');
                       min = -200; max = 200; step = 5;
                    } else if (path.includes('acceleration') || path.includes('Acceleration')) {
                       label = 'Gia tốc ' + (path.endsWith('x') ? 'X' : 'Y');
                       min = -50; max = 50; step = 1;
                    } else if (path.includes('position') || path.includes('Position')) {
                       label = 'Vị trí ' + (path.endsWith('x') ? 'X' : 'Y');
                       min = 0; max = 1000; step = 10;
                    }

                    return (
                      <div key={c} style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>{label}</span>
                          <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{val}</span>
                        </div>
                        <input 
                          type="range" min={min} max={max} step={step} 
                          value={val}
                          onChange={(e) => {
                            const num = parseFloat(e.target.value);
                            // Deep clone and update
                            const engine = labEngine;
                            const oIndex = engine.config.objects.findIndex((o: any) => o.id === labObj.id);
                            if (oIndex !== -1) {
                              const keys = path.split('.');
                              let target: any = engine.config.objects[oIndex];
                              for (let i = 0; i < keys.length - 1; i++) {
                                if (!target[keys[i]]) target[keys[i]] = {};
                                target = target[keys[i]];
                              }
                              target[keys[keys.length - 1]] = num;
                              
                              if (engine.state === 'paused') {
                                engine.setupScene();
                                if (engineRef?.current) {
                                  engineRef.current.renderer.renderMain();
                                }
                              }
                              forceRender(); // trigger re-render
                            }
                          }}
                          style={{ width: '100%', accentColor: '#3b82f6' }}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};
