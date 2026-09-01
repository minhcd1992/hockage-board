'use client';

import React, { useEffect, useRef } from 'react';
import { Camera } from '../engine/Camera';
import { CanvasRenderer } from '../engine/CanvasRenderer';
import { RenderLoop } from '../engine/RenderLoop';
import { Scene } from '../engine/Scene';
import { PointerManager } from '../input/PointerManager';
import { Stroke } from '../objects/Stroke';
import { Shape } from '../objects/Shape';
import { LabWidget } from '../objects/LabWidget';
import { ImageObject } from '../objects/ImageObject';
import { Text } from '../objects/Text';
import { Point, BoardObject } from '../types';
import { useBoardStore } from '../store/useBoardStore';

import { ChevronUp, ChevronDown, ZoomIn, ZoomOut, Maximize, Eye, EyeOff } from 'lucide-react';

import { loadPDFToScene } from '../lib/pdfLoader';

export function CanvasBoard({ pdfFile, isActive }: { pdfFile?: File, isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionLayerRef = useRef<HTMLDivElement>(null);

  const [textInput, setTextInput] = React.useState<{ x: number, y: number, text: string, width?: number } | null>(null);
  const [isNavVisible, setIsNavVisible] = React.useState(false);
  const textInputRef = useRef<{ x: number, y: number, text: string, width?: number } | null>(null);
  const [zoomInputValue, setZoomInputValue] = React.useState('');
  
  useEffect(() => {
    textInputRef.current = textInput;
  }, [textInput]);

  const tool = useBoardStore(s => s.tool);
  const strokeColor = useBoardStore(s => s.strokeColor);
  const strokeSize = useBoardStore(s => s.strokeSize);
  const panY = useBoardStore(s => s.panY);
  const zoom = useBoardStore(s => s.zoom);
  const fontFamily = useBoardStore(s => s.fontFamily);
  const fontSize = useBoardStore(s => s.fontSize);

  useEffect(() => {
    setZoomInputValue(Math.round(zoom * 100).toString());
  }, [zoom]);

  // Engine refs
  const engineRef = useRef<{
    renderer: CanvasRenderer;
    scene: Scene;
    camera: Camera;
    loop: RenderLoop;
    pointer: PointerManager;
    currentStroke: Stroke | null;
    currentShape: Shape | null;
    selectionRect: { start: Point; end: Point } | null;
    snipRect: { start: Point; end: Point } | null;
  } | null>(null);
  
  const isActiveRef = useRef(isActive);
  const laserPointsRef = useRef<{x: number, y: number, time: number}[]>([]);
  const laserFrameRef = useRef<number | null>(null);

  // Global Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActiveRef.current) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const engine = engineRef.current;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (engine && engine.scene.getSelectedObjects().length > 0) {
          engine.scene.deleteSelected();
          engine.renderer.renderMain();
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          if (e.shiftKey) {
            if (engineRef.current?.scene.redo()) {
              engineRef.current?.renderer.renderMain();
            }
          } else {
            if (engineRef.current?.scene.undo()) {
              engineRef.current?.renderer.renderMain();
            }
          }
          return;
        }
        
        // c, x, v are now handled by DOM copy, cut, paste events
        if (key === 'y') {
          if (engine?.scene.redo()) engine.renderer.renderMain();
          return;
        }
      }

      const storeState = useBoardStore.getState();
      const key = e.key.toLowerCase();
      
      if (e.ctrlKey && key.match(/^f[1-8]$/)) {
        e.preventDefault();
        const fNumber = parseInt(key.substring(1));
        const presetColors = ['#ffffff', '#000000', '#ff0000', '#ffcc00', '#00ff00', '#00ccff', '#ff00ff', '#ff8800'];
        const color = presetColors[fNumber - 1];
        if (storeState.editingObjectId && engineRef.current) {
          const obj = engineRef.current.scene.objects.find((o: any) => o.id === storeState.editingObjectId);
          if (obj) {
            (obj as any).color = color;
            engineRef.current.scene.saveState();
            engineRef.current.renderer.renderMain();
            window.dispatchEvent(new Event('requestBoardRender')); // force PropertiesBar update
          }
        } else {
          storeState.setStrokeColor(color);
        }
        return;
      }
      if (e.ctrlKey && key === 'a') {
        e.preventDefault();
        storeState.setTool('select-object');
        if (engineRef.current) {
          const engine = engineRef.current;
          let objectsToSelect = engine.scene.objects.filter((o: any) => !o.locked && o.type !== 'pdf');

          const pdfPages = engine.scene.objects.filter((o: any) => o.pageIndex !== undefined).sort((a: any, b: any) => a.pageIndex - b.pageIndex);
          const windowHeight = containerRef.current?.clientHeight || window.innerHeight || 800;

          if (pdfPages.length > 0) {
            const cameraY = engine.camera.y;
            const centerY = (-cameraY + windowHeight / 2) / engine.camera.zoom;
            
            let targetPage = pdfPages[0] as any;
            let minDistance = Infinity;
            for (const p of pdfPages) {
              const pageObj = p as any;
              const pCenter = pageObj.y + pageObj.height / 2;
              const dist = Math.abs(centerY - pCenter);
              if (dist < minDistance) {
                minDistance = dist;
                targetPage = pageObj;
              }
            }
            
            const pageBounds = targetPage.getBoundingBox();
            
            objectsToSelect = objectsToSelect.filter((o: any) => {
              const objBounds = o.getBoundingBox();
              return !(objBounds.x > pageBounds.x + pageBounds.w || 
                       objBounds.x + objBounds.w < pageBounds.x || 
                       objBounds.y > pageBounds.y + pageBounds.h || 
                       objBounds.y + objBounds.h < pageBounds.y);
            });
          } else {
            // Whiteboard Mode
            const scaledStep = windowHeight * engine.camera.zoom;
            const activePageIndex = Math.max(0, Math.round(-engine.camera.y / scaledStep));
            
            const pageWorldY = activePageIndex * windowHeight;
            const pageWorldH = windowHeight - (windowHeight * 0.02); // subtract gap
            
            objectsToSelect = objectsToSelect.filter((o: any) => {
              const objBounds = o.getBoundingBox();
              return !(objBounds.y > pageWorldY + pageWorldH || 
                       objBounds.y + objBounds.h < pageWorldY);
            });
          }

          engine.scene.clearSelection();
          objectsToSelect.forEach((o: any) => o.selected = true);
          engine.renderer.renderMain();
          window.dispatchEvent(new Event('requestBoardRender'));
        }
        return;
      }

      
      if (e.ctrlKey || e.metaKey) return;

      let newTool = storeState.tool;
      if (key === ' ') newTool = 'hand';
      if (key === 'p') newTool = 'pen';
      if (key === 'v') newTool = 'select-object';
      if (key === 'h') newTool = 'highlighter';
      if (key === 'w') newTool = 'laser';
      if (key === 'e') newTool = 'eraser-object';
      if (key === 't') newTool = 'text';
      if (key === 'l') { newTool = 'line'; storeState.setCurrentShapeTool('line'); }
      if (key === 'a') { newTool = 'arrow'; storeState.setCurrentShapeTool('arrow'); }
      if (key === 'r') { newTool = 'rect'; storeState.setCurrentShapeTool('rect'); }
      if (key === 'o') { newTool = 'ellipse'; storeState.setCurrentShapeTool('ellipse'); }
      if (key === 'c') { newTool = 'arc'; storeState.setCurrentShapeTool('arc'); }
      if (key === 'n') { newTool = 'sine'; storeState.setCurrentShapeTool('sine'); }
      if (key === 'b') { newTool = 'bezier'; storeState.setCurrentShapeTool('bezier'); }
      
      if (key === '1' || key === '2' || key === '3') {
        const newSize = key === '1' ? 0.5 : key === '2' ? 1.0 : 2.0;
        storeState.setStrokeSize(newSize);
        if (storeState.editingObjectId && engineRef.current) {
          const obj = engineRef.current.scene.objects.find((o: any) => o.id === storeState.editingObjectId);
          if (obj && typeof (obj as any).size !== 'undefined') {
            (obj as any).size = newSize;
            engineRef.current.renderer.renderMain();
            window.dispatchEvent(new Event('requestBoardRender'));
          }
        }
      }
      
      if (key === 'm') {
        const newMode = storeState.viewMode === 'continuous' ? 'single-page' : 'continuous';
        storeState.setViewMode(newMode);
        if (newMode === 'single-page' && engineRef.current) {
          const canvasH = containerRef.current?.clientHeight || window.innerHeight;
          const scaledPageHeight = canvasH * storeState.zoom;
          const currentPage = scaledPageHeight ? Math.round(-storeState.panY / scaledPageHeight) + 1 : 1;
          const newPanY = -(currentPage - 1) * scaledPageHeight;
          storeState.setPan(storeState.panX, newPanY);
          engineRef.current.camera.y = newPanY;
          engineRef.current.renderer.renderMain();
          engineRef.current.renderer.renderBackground(storeState.gridEnabled, storeState.theme, !!pdfFile);
        }
      }
      
      if (key === 's') storeState.toggleSnapToGrid();
      if (newTool !== storeState.tool) storeState.setTool(newTool);
    };
    
    const handleCopy = (e: ClipboardEvent) => {
      if (isActiveRef.current && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        const engine = engineRef.current;
        if (engine && engine.scene.getSelectedObjects().length > 0) {
          engine.scene.copy();
          e.clipboardData?.setData('text/plain', 'hockage-board-objects');
          e.preventDefault();
        }
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      if (isActiveRef.current && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        const engine = engineRef.current;
        if (engine && engine.scene.getSelectedObjects().length > 0) {
          engine.scene.cut();
          engine.renderer.renderMain();
          e.clipboardData?.setData('text/plain', 'hockage-board-objects');
          e.preventDefault();
        }
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (!isActiveRef.current || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (!e.clipboardData) return;
      
      const text = e.clipboardData.getData('text/plain');
      if (text === 'hockage-board-objects') {
        const engine = engineRef.current;
        if (engine) {
          let mx, my;
          if (engine.pointer.lastPointerPos) {
            const worldPos = engine.camera.screenToWorld(engine.pointer.lastPointerPos.x, engine.pointer.lastPointerPos.y);
            mx = worldPos.x;
            my = worldPos.y;
          }
          engine.scene.paste(mx, my);
          engine.renderer.renderMain();
        }
        return;
      }

      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target && typeof event.target.result === 'string') {
                const engine = engineRef.current;
                if (!engine) return;
                
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                const worldCenter = engine.camera.screenToWorld(centerX, centerY);
                
                let placeX = worldCenter.x;
                let placeY = worldCenter.y;
                if (engine.pointer.lastPointerPos) {
                  const worldPos = engine.camera.screenToWorld(engine.pointer.lastPointerPos.x, engine.pointer.lastPointerPos.y);
                  placeX = worldPos.x;
                  placeY = worldPos.y;
                }

                const img = new Image();
                img.onload = () => {
                  let w = img.width;
                  let h = img.height;
                  if (w > 500 || h > 500) {
                     const ratio = Math.min(500 / w, 500 / h);
                     w *= ratio;
                     h *= ratio;
                  }
                  
                  const imageObj = new ImageObject(
                    event.target!.result as string, 
                    placeX - w/2, 
                    placeY - h/2, 
                    w, 
                    h
                  );
                  imageObj.updateCenter();
                  engine.scene.clearSelection();
                  imageObj.selected = true;
                  engine.scene.addObject(imageObj);
                  useBoardStore.getState().setTool('select-object');
                  useBoardStore.getState().setEditingObjectId(imageObj.id);
                  engine.renderer.renderMain();
                };
                img.src = event.target.result;
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
    };
  }, []); // Global shortcuts

  // Scrollbar handlers
  const updateScrollbar = () => {
    const scrollbarThumb = document.getElementById(`v-scrollbar-thumb-${pdfFile ? 'pdf' : 'whiteboard'}`);
    const scrollbar = document.getElementById(`v-scrollbar-${pdfFile ? 'pdf' : 'whiteboard'}`);
    if (!scrollbarThumb || !scrollbar) return;
    
    const state = useBoardStore.getState();
    const viewH = window.innerHeight;
    
    let totalH = 1000;
    const engine = engineRef.current;
    if (engine && engine.scene.objects.length > 0) {
      let maxBottom = 0;
      for (const obj of engine.scene.objects) {
        if ('y' in obj && 'height' in obj) {
          const anyObj = obj as any;
          const bottom = anyObj.y + anyObj.height;
          if (bottom > maxBottom) maxBottom = bottom;
        }
      }
      totalH = maxBottom * state.zoom;
    }
    
    if (totalH <= viewH + 20) {
      scrollbar.style.display = 'none';
      return;
    }
    
    scrollbar.style.display = 'block';
    const thumbH = Math.max((viewH / totalH) * viewH, 40);
    scrollbarThumb.style.height = `${thumbH}px`;
    
    let percent = -state.panY / (totalH - viewH);
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    
    scrollbarThumb.style.top = `${percent * (viewH - thumbH)}px`;
  };

  const handleScrollbarDragStart = (e: React.PointerEvent) => {
    const scrollbarThumb = e.currentTarget as HTMLDivElement;
    scrollbarThumb.classList.add('active');
    const startY = e.clientY;
    const startPanY = useBoardStore.getState().panY;
    const viewH = window.innerHeight;
    
    const onMove = (moveEvent: PointerEvent) => {
      let totalH = 1000;
      const engine = engineRef.current;
      const state = useBoardStore.getState();
      if (engine && engine.scene.objects.length > 0) {
        let maxBottom = 0;
        for (const obj of engine.scene.objects) {
          if ('y' in obj && 'height' in obj) {
            const anyObj = obj as any;
            const bottom = anyObj.y + anyObj.height;
            if (bottom > maxBottom) maxBottom = bottom;
          }
        }
        totalH = maxBottom * state.zoom;
      }
      
      const thumbH = parseFloat(scrollbarThumb.style.height);
      const movePercent = (moveEvent.clientY - startY) / (viewH - thumbH);
      
      let newPanY = startPanY - (movePercent * (totalH - viewH));
      if (newPanY > 0) newPanY = 0;
      
      useBoardStore.getState().setPan(state.panX, newPanY);
    };
    
    const onUp = () => {
      scrollbarThumb.classList.remove('active');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  useEffect(() => {
    if (
      !bgCanvasRef.current ||
      !mainCanvasRef.current ||
      !draftCanvasRef.current ||
      !interactionLayerRef.current
    ) return;

    const { panX, panY, zoom } = useBoardStore.getState();

    // Initialize Engine
    const scene = new Scene();
    const camera = new Camera(panX, panY, zoom);
    const renderer = new CanvasRenderer(
      bgCanvasRef.current,
      mainCanvasRef.current,
      draftCanvasRef.current,
      scene,
      camera
    );
    const loop = new RenderLoop();
    const pointer = new PointerManager(interactionLayerRef.current);
    
    const startLaserLoop = () => {
      const renderLaser = () => {
        if (!isActiveRef.current || !engineRef.current) {
          laserFrameRef.current = null;
          return;
        }
        const now = Date.now();
        // Keep points up to 800ms old
        laserPointsRef.current = laserPointsRef.current.filter(p => now - p.time < 800);
        
        if (engineRef.current && engineRef.current.renderer) {
          engineRef.current.renderer.renderDraft((ctx: CanvasRenderingContext2D) => {
             if (laserPointsRef.current.length < 2) return;
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             const zoom = engineRef.current!.camera.zoom;
             
             const drawPath = () => {
               ctx.beginPath();
               ctx.moveTo(laserPointsRef.current[0].x, laserPointsRef.current[0].y);
               for (let i = 1; i < laserPointsRef.current.length - 1; i++) {
                 const p0 = laserPointsRef.current[i];
                 const p1 = laserPointsRef.current[i + 1];
                 const midX = (p0.x + p1.x) / 2;
                 const midY = (p0.y + p1.y) / 2;
                 ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
               }
               const lastP = laserPointsRef.current[laserPointsRef.current.length - 1];
               ctx.lineTo(lastP.x, lastP.y);
             };

             // Glow pass
             ctx.lineWidth = 12 / zoom;
             ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
             drawPath();
             ctx.stroke();

             // Core pass
             ctx.lineWidth = 4 / zoom;
             ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
             ctx.shadowColor = 'rgba(239, 68, 68, 1)';
             ctx.shadowBlur = 10 / zoom;
             drawPath();
             ctx.stroke();
             
             // Reset shadow
             ctx.shadowColor = 'transparent';
             ctx.shadowBlur = 0;
          });
        }
        
        if (laserPointsRef.current.length > 0) {
           laserFrameRef.current = requestAnimationFrame(renderLaser);
        } else {
           engineRef.current.renderer.clearDraft();
           laserFrameRef.current = null;
        }
      };
      laserFrameRef.current = requestAnimationFrame(renderLaser);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = useBoardStore.getState();
      const activeTab = state.tabs.find(t => t.id === state.activeTabId);

      
      
      if (e.ctrlKey) {
        // Zoom
        const zoomDelta = e.deltaY * -0.0015;
        const newZoom = Math.min(Math.max(0.01, state.zoom + zoomDelta), 5);
        
        const oldZoom = state.zoom;
        const oldPanX = state.panX;
        const oldPanY = state.panY;
        
        const rect = interactionLayerRef.current?.getBoundingClientRect();
        if (rect) {
          // Always zoom from center as requested by user
          const screenX = rect.width / 2;
          const screenY = rect.height / 2;
          
          const worldX = (screenX - oldPanX) / oldZoom;
          const worldY = (screenY - oldPanY) / oldZoom;
          
          const newPanX = screenX - worldX * newZoom;
          const newPanY = screenY - worldY * newZoom;
          
          state.setPan(newPanX, newPanY);
        }
        
        state.setZoom(newZoom);
      } else {
        // Pan
        if (state.viewMode === 'single-page') {
          const now = Date.now();
          const lastTime = (window as any)._lastPageScrollTime || 0;
          
          if (now - lastTime > 400 && Math.abs(e.deltaY) > 5) {
            (window as any)._lastPageScrollTime = now;
            const canvasH = containerRef.current?.clientHeight || window.innerHeight;
            const scaledPageHeight = canvasH * state.zoom;
            let currentPage = scaledPageHeight ? Math.round(-state.panY / scaledPageHeight) + 1 : 1;
            
            if (e.deltaY > 0) currentPage++;
            else if (e.deltaY < 0) currentPage--;
            
            if (currentPage < 1) currentPage = 1;
            
            if (engineRef.current && pdfFile) {
               const pdfPagesCount = engineRef.current.scene.objects.filter((o: any) => o.pageIndex !== undefined).length;
               if (pdfPagesCount > 0 && currentPage > pdfPagesCount) {
                  currentPage = pdfPagesCount;
               }
            }
            
            let newPanY = -(currentPage - 1) * scaledPageHeight;
            if (newPanY > 0) newPanY = 0;
            state.setPan(state.panX, newPanY);
          }
        } else {
          let dy = e.deltaY;
          if (e.deltaMode === 1) dy *= 40;
          else if (e.deltaMode === 2) dy *= window.innerHeight;
          
          let dx = e.deltaX;
          if (e.deltaMode === 1) dx *= 40;
          
          // Dampen large scroll deltas (mouse wheels) to prevent jumping too far
          const dampen = (val: number) => {
            const absVal = Math.abs(val);
            if (absVal > 40) {
              return Math.sign(val) * (40 + (absVal - 40) * 0.3);
            }
            return val;
          };

          let newPanY = state.panY - dampen(dy);
          let newPanX = state.panX;
          
          // Prevent scrolling out of bounds on top
          if (newPanY > 0) newPanY = 0;
          
          state.setPan(newPanX, newPanY);
        }
      }
    };
    const interLayer = interactionLayerRef.current;
    interLayer.addEventListener('wheel', handleWheel, { passive: false });

    engineRef.current = {
      renderer,
      scene,
      camera,
      loop,
      pointer,
      currentStroke: null,
      currentShape: null,
      selectionRect: null,
      snipRect: null
    };

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      renderer.resize(containerRef.current.clientWidth, containerRef.current.clientHeight, dpr);
      const state = useBoardStore.getState();
      renderer.renderBackground(state.gridEnabled, state.theme, !!pdfFile);
      updateScrollbar();
    };
    window.addEventListener('resize', handleResize);
    
    // Handle manual render requests (e.g. from PdfObject async renders)
    const handleRequestRender = () => {
      if (engineRef.current) {
        engineRef.current.renderer.renderMain();
      }
    };
    window.addEventListener('requestBoardRender', handleRequestRender);
    
    handleResize();

    // Render loop callback
    let draftNeedsUpdate = false;
    let lastCamX = -1;
    let lastCamY = -1;
    let lastZoom = -1;
    let lastGridEnabled = false;
    let lastTheme = 'green';

    // Drag selection state
    let isDraggingSelection = false;
    let selectionDragStartPoint: Point | null = null;
    let hasMovedSelection = false;
    
    // Transform state
    let transformAction: 'rotate' | 'scale_tl' | 'scale_tr' | 'scale_bl' | 'scale_br' | 'scale_tc' | 'scale_bc' | 'scale_lc' | 'scale_rc' | null = null;
    let transformStartPoint: Point | null = null;
    let transformStartBounds: import('../types').Rect | null = null;
    let transformInitialObjects: BoardObject[] = [];
    
    // Bezier state
    let bezierState: 'idle' | 'drawing-line' | 'setting-control' = 'idle';
    let currentBezierShape: Shape | null = null;
    
    // Arc state
    let arcState: 'idle' | 'setting-start' | 'setting-end' = 'idle';
    let currentArcShape: Shape | null = null;

    loop.addCallback((dt) => {
      const engine = engineRef.current!;
      const state = useBoardStore.getState();
      
      engine.camera.x = state.panX;
      engine.camera.y = state.panY;
      engine.camera.zoom = state.zoom;

      let labNeedsRender = false;
      engine.scene.objects.forEach(obj => {
        if (obj.type === 'lab-widget') {
          const lw = obj as LabWidget;
          if (lw.engine.state === 'playing') {
            lw.engine.update(dt);
            labNeedsRender = true;
          }
        }
      });
      if (labNeedsRender) {
        engine.renderer.renderMain();
      }

      let bgNeedsUpdate = false;
      if (engine.camera.x !== lastCamX || engine.camera.y !== lastCamY || engine.camera.zoom !== lastZoom ||
          state.gridEnabled !== lastGridEnabled || state.theme !== lastTheme) {
          
        bgNeedsUpdate = true;
        updateScrollbar();
      }

      if (bgNeedsUpdate) {
        engine.renderer.renderBackground(state.gridEnabled, state.theme, !!pdfFile);
        engine.renderer.renderMain();
        
        lastCamX = engine.camera.x;
        lastCamY = engine.camera.y;
        lastZoom = engine.camera.zoom;
        lastGridEnabled = state.gridEnabled;
        lastTheme = state.theme;
      }

      // Handle pending points for stroke/highlighter
      if (engine.pointer.pendingPoints.length > 0 && 
          (state.tool === 'pen' || state.tool === 'highlighter') && 
          engine.currentStroke) {
        for (const p of engine.pointer.pendingPoints) {
          const worldP = engine.camera.screenToWorld(p.x, p.y) as Point;
          worldP.pressure = p.pressure;
          worldP.tiltX = p.tiltX;
          worldP.tiltY = p.tiltY;
          engine.currentStroke.addPoint(worldP);
        }
        engine.pointer.pendingPoints = [];
        draftNeedsUpdate = true;
      }

      // Handle selection drag rendering on draft canvas
      if (state.tool === 'select-object' && engine.selectionRect && engine.pointer.pendingPoints.length > 0) {
        if (!isDraggingSelection) {
          const lastP = engine.pointer.pendingPoints[engine.pointer.pendingPoints.length - 1];
          engine.selectionRect.end = engine.camera.screenToWorld(lastP.x, lastP.y);
        }
        engine.pointer.pendingPoints = [];
        draftNeedsUpdate = true;
      }

      if (draftNeedsUpdate) {
        engine.renderer.renderDraft((ctx) => {
          if (engine.currentStroke) {
            engine.currentStroke.draw(ctx);
          }
          if (engine.currentShape) {
            engine.currentShape.draw(ctx);
            
            // HUD Overlay for dimensions
            const shape = engine.currentShape;
            let hudLines: string[] = [];
            const dx = shape.end.x - shape.start.x;
            const dy = shape.end.y - shape.start.y;
            const length = Math.round(Math.sqrt(dx*dx + dy*dy));
            let angleDeg = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
            if (angleDeg < 0) angleDeg += 360;

            if (shape.shapeType === 'line' || shape.shapeType === 'arrow') {
               hudLines.push(`Length: ${length}px`, `Angle: ${angleDeg}°`);
            } else if (shape.shapeType === 'rect' || shape.shapeType === 'ellipse') {
               hudLines.push(`W: ${Math.round(Math.abs(dx))}px`, `H: ${Math.round(Math.abs(dy))}px`);
            } else if (shape.shapeType === 'sine') {
               const amplitude = shape.sineAmplitude ?? 20;
               const wavelength = shape.sineWavelength ?? 50;
               const peaks = (length / wavelength).toFixed(1);
               hudLines.push(`Length: ${length}px`, `Wavelength: ${wavelength}px`, `Amplitude: ${amplitude}px`, `Peaks: ${peaks}`);
            } else if (shape.shapeType === 'bezier') {
               hudLines.push(`Length: ${length}px`);
               if (bezierState === 'setting-control') {
                  const cdx = shape.controlPoint.x - shape.start.x;
                  const cdy = shape.controlPoint.y - shape.start.y;
                  const cDist = Math.round(Math.sqrt(cdx*cdx + cdy*cdy));
                  hudLines.push(`Curve dist: ${cDist}px`);
               }
            } else if (shape.shapeType === 'arc') {
               const dy1 = -(shape.end.y - shape.start.y);
               const dx1 = shape.end.x - shape.start.x;
               const dy2 = -(shape.controlPoint.y - shape.start.y);
               const dx2 = shape.controlPoint.x - shape.start.x;

               let startAngle = Math.atan2(dy1, dx1) * 180 / Math.PI;
               let endAngle = Math.atan2(dy2, dx2) * 180 / Math.PI;
               
               let diff = endAngle - startAngle;
               while (diff < 0) diff += 360;
               while (diff >= 360) diff -= 360;
               
               const rad = Math.round(Math.sqrt(dx1*dx1 + dy1*dy1));
               hudLines.push(`Radius: ${rad}px`, `Angle: ${Math.round(diff)}°`);
            }
            
            if (hudLines.length > 0) {
              const activePoint = (shape.shapeType === 'arc' && arcState === 'setting-end') || (shape.shapeType === 'bezier' && bezierState === 'setting-control') ? shape.controlPoint : shape.end;
              
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen space
              const screenP = engine.camera.worldToScreen(activePoint.x, activePoint.y);
              
              ctx.font = '12px monospace';
              const padding = 6;
              const lineHeight = 16;
              let maxWidth = 0;
              hudLines.forEach(line => {
                 maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
              });
              
              // Canvas bounds check
              const hudX = screenP.x + 20;
              const hudY = screenP.y + 20;
              
              ctx.fillStyle = 'rgba(0,0,0,0.7)';
              if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(hudX, hudY, maxWidth + padding * 2, hudLines.length * lineHeight + padding * 2, 4);
                ctx.fill();
              } else {
                ctx.fillRect(hudX, hudY, maxWidth + padding * 2, hudLines.length * lineHeight + padding * 2);
              }
              
              ctx.fillStyle = '#fff';
              hudLines.forEach((line, i) => {
                 ctx.fillText(line, hudX + padding, hudY + padding + 12 + i * lineHeight);
              });
              
              ctx.restore();
            }
          }
          if (engine.snipRect) {
            const { start, end } = engine.snipRect;
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const w = Math.abs(end.x - start.x);
            const h = Math.abs(end.y - start.y);
            
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.strokeStyle = '#3b82f6';
            ctx.setLineDash([5 / engine.camera.zoom, 5 / engine.camera.zoom]);
            ctx.lineWidth = 2 / engine.camera.zoom;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
            ctx.restore();
          }
          if (engine.selectionRect) {
            const { start, end } = engine.selectionRect;
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const w = Math.abs(end.x - start.x);
            const h = Math.abs(end.y - start.y);
            
            ctx.save();
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1 / engine.camera.zoom;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
            ctx.restore();
          }
        });
        draftNeedsUpdate = false;
      }
    });

    // Helper
    const processPoint = (p: Point, engine: any, state: any): Point => {
      const worldP = engine.camera.screenToWorld(p.x, p.y) as Point;
      worldP.pressure = p.pressure;
      worldP.tiltX = p.tiltX;
      worldP.tiltY = p.tiltY;
      
      if (state.snapToGrid) {
        const gridSize = 50;
        worldP.x = Math.round(worldP.x / gridSize) * gridSize;
        worldP.y = Math.round(worldP.y / gridSize) * gridSize;
      }
      return worldP;
    };

    // Pointer events
    let isPanning = false;
    let panStartScreen: Point | null = null;
    let initialPan: {x: number, y: number} | null = null;
    let activeInternalDragObj: BoardObject | null = null;

    pointer.onPointerDown = (p, e) => {
      const state = useBoardStore.getState();
      const engine = engineRef.current!;
      
      // Panning (Middle mouse or Hand tool)
      if (e.button === 1 || state.tool === 'hand') {
        isPanning = true;
        panStartScreen = { x: e.clientX, y: e.clientY };
        initialPan = { x: state.panX, y: state.panY };
        if (interactionLayerRef.current) interactionLayerRef.current.style.cursor = 'grabbing';
        return;
      }
      
      const worldP = processPoint(p, engine, state);
      
      if (state.tool === 'laser') {
        laserPointsRef.current = [{ x: worldP.x, y: worldP.y, time: Date.now() }];
        if (!laserFrameRef.current) startLaserLoop();
      } else if (state.tool === 'pen' || state.tool === 'highlighter') {
        engine.currentStroke = new Stroke(state.strokeColor, state.strokeSize, false, state.tool === 'highlighter');
        engine.currentStroke.addPoint(worldP);
        draftNeedsUpdate = true;
      } else if (state.tool === 'line' || state.tool === 'arrow' || state.tool === 'rect' || state.tool === 'ellipse' || state.tool === 'sine') {
        engine.currentShape = new Shape(state.tool as any, worldP, state.strokeColor, state.strokeSize, state.strokeStyleType, state.isFilled, false, state.sineWavelength, state.sineAmplitude);
        draftNeedsUpdate = true;
      } else if (state.tool === 'arc') {
        if (arcState === 'idle') {
          engine.currentShape = new Shape('arc', worldP, state.strokeColor, state.strokeSize, state.strokeStyleType, state.isFilled);
          currentArcShape = engine.currentShape as Shape;
          currentArcShape.drawingState = 'radius';
          currentArcShape.end = { x: worldP.x, y: worldP.y };
          currentArcShape.controlPoint = { x: worldP.x, y: worldP.y };
          arcState = 'setting-start';
          draftNeedsUpdate = true;
        } else if (arcState === 'setting-start' && currentArcShape) {
          currentArcShape.drawingState = 'angle';
          arcState = 'setting-end';
          draftNeedsUpdate = true;
        } else if (arcState === 'setting-end' && currentArcShape) {
          currentArcShape.drawingState = undefined;
          currentArcShape.updateCenter();
          engine.scene.addObject(currentArcShape);
          engine.currentShape = null;
          currentArcShape = null;
          arcState = 'idle';
          
          engine.renderer.renderMain();
          engine.renderer.clearDraft();
          draftNeedsUpdate = false;
        }
      } else if (state.tool === 'text') {
        if (textInputRef.current) return;
        setTimeout(() => setTextInput({ x: p.x - 4, y: p.y - 4, text: '' }), 50);
      } else if (state.tool === 'bezier') {
        if (bezierState === 'idle') {
          engine.currentShape = new Shape('bezier', worldP, state.strokeColor, state.strokeSize, state.strokeStyleType, state.isFilled);
          currentBezierShape = engine.currentShape as Shape;
          currentBezierShape.controlPoint = { x: worldP.x, y: worldP.y };
          bezierState = 'drawing-line';
          draftNeedsUpdate = true;
        } else if (bezierState === 'setting-control' && currentBezierShape) {
          currentBezierShape.controlPoint = worldP;
          draftNeedsUpdate = true;
        }
      } else if (state.tool === 'select-object') {
        // Hit test handles first
        const bounds = engine.scene.getSelectionBounds();
        if (bounds) {
          const hs = 12 / engine.camera.zoom;
          const { x, y, w, h } = bounds;
          const hitTestHandle = (px: number, py: number, hx: number, hy: number) => {
            return px >= hx - hs && px <= hx + hs && py >= hy - hs && py <= hy + hs;
          };
          
          if (hitTestHandle(worldP.x, worldP.y, x + w/2, y - 20/engine.camera.zoom)) {
            transformAction = 'rotate';
          } else if (hitTestHandle(worldP.x, worldP.y, x, y)) {
            transformAction = 'scale_tl';
          } else if (hitTestHandle(worldP.x, worldP.y, x + w, y)) {
            transformAction = 'scale_tr';
          } else if (hitTestHandle(worldP.x, worldP.y, x, y + h)) {
            transformAction = 'scale_bl';
          } else if (hitTestHandle(worldP.x, worldP.y, x + w, y + h)) {
            transformAction = 'scale_br';
          } else if (hitTestHandle(worldP.x, worldP.y, x + w/2, y)) {
            transformAction = 'scale_tc';
          } else if (hitTestHandle(worldP.x, worldP.y, x + w/2, y + h)) {
            transformAction = 'scale_bc';
          } else if (hitTestHandle(worldP.x, worldP.y, x, y + h/2)) {
            transformAction = 'scale_lc';
          } else if (hitTestHandle(worldP.x, worldP.y, x + w, y + h/2)) {
            transformAction = 'scale_rc';
          }
          
          if (transformAction) {
            transformStartPoint = worldP;
            transformStartBounds = bounds;
            transformInitialObjects = engine.scene.getSelectedObjects().map(obj => {
              const clone = obj.clone();
              clone.id = obj.id;
              return clone;
            });
            return;
          }
        }

        // Hit test to see if we clicked on a selected object (for dragging)
        const selected = engine.scene.getSelectedObjects();
        let clickedOnSelected = false;
        
        if (selected.length > 1) {
          const bounds = engine.scene.getSelectionBounds();
          if (bounds && worldP.x >= bounds.x && worldP.x <= bounds.x + bounds.w &&
              worldP.y >= bounds.y && worldP.y <= bounds.y + bounds.h) {
            clickedOnSelected = true;
          }
        }
        
        if (!clickedOnSelected) {
          for (const obj of selected) {
            if (!obj.locked && obj.hitTest(worldP)) {
              clickedOnSelected = true;
              break;
            }
          }
        }

        if (clickedOnSelected) {
          // See if it intercepts the pointer down internally
          let consumed = false;
          const topSelected = engine.scene.getSelectedObjects()[0];
          if (topSelected && topSelected.onPointerDown) {
            consumed = topSelected.onPointerDown(worldP);
          }
          
          if (consumed) {
            activeInternalDragObj = topSelected;
            engine.renderer.renderMain();
            return; // Don't drag the whole selection
          }

          isDraggingSelection = true;
          selectionDragStartPoint = worldP;
          hasMovedSelection = false;
          return;
        } else {
          // Check if clicked unselected object to select it singlely
          let hitId: string | null = null;
          for (let i = engine.scene.objects.length - 1; i >= 0; i--) {
            const el = engine.scene.objects[i];
            if (!el.locked && el.hitTest(worldP)) {
              hitId = el.id;
              break;
            }
          }
          if (hitId) {
            engine.scene.toggleSelection(hitId, false);
            engine.renderer.renderMain();
            
            let consumed = false;
            const newlySelected = engine.scene.objects.find(o => o.id === hitId);
            if (newlySelected && newlySelected.onPointerDown) {
              consumed = newlySelected.onPointerDown(worldP);
            }
            
            if (consumed) {
              activeInternalDragObj = newlySelected!;
              engine.renderer.renderMain();
              return;
            }

            isDraggingSelection = true;
            selectionDragStartPoint = worldP;
            hasMovedSelection = false;
            return;
          }
        }
        
        isDraggingSelection = false;
        engine.selectionRect = { start: worldP, end: worldP };
        if (state.tool === 'select-object') {
          engine.scene.clearSelection();
          engine.renderer.renderMain();
        }
        draftNeedsUpdate = true;
      } else if (state.tool === 'snip') {
        engine.snipRect = { start: worldP, end: worldP };
        draftNeedsUpdate = true;
      } else if (state.tool === 'eraser-object') {
        // Find top-most element that hits
        let hitId: string | null = null;
        for (let i = engine.scene.objects.length - 1; i >= 0; i--) {
          const el = engine.scene.objects[i];
          if (!el.locked && el.hitTest(worldP)) {
            hitId = el.id;
            break;
          }
        }
        if (hitId) {
          engine.scene.removeObject(hitId);
          engine.renderer.renderMain();
        }
      }
    };

    pointer.onPointerMove = (p, e) => {
      const state = useBoardStore.getState();
      const engine = engineRef.current!;

      const worldP = processPoint(p, engine, state);

      if (activeInternalDragObj && activeInternalDragObj.onPointerMove) {
        activeInternalDragObj.onPointerMove(worldP);
        engine.renderer.renderMain();
        return;
      }

      // Middle mouse panning
      if (isPanning && panStartScreen && initialPan) {
        const dy = (e.clientY - panStartScreen.y);
        let newPanX = state.panX;
        let newPanY = initialPan.y + dy;
        if (newPanY > 0) newPanY = 0;
        
        // Disable single page snapping during middle click panning, it should just pan normally.
        state.setPan(newPanX, newPanY);
        return;
      }

      if (state.tool === 'laser' && pointer.isPointerDown) {
        laserPointsRef.current.push({ x: worldP.x, y: worldP.y, time: Date.now() });
      } else if ((state.tool === 'pen' || state.tool === 'highlighter') && engine.currentStroke && pointer.isPointerDown) {
        engine.currentStroke.addPoint(worldP);
        draftNeedsUpdate = true;
      }
      if (state.tool === 'arc' && arcState !== 'idle' && currentArcShape) {
        if (arcState === 'setting-start') {
          currentArcShape.end = worldP;
          currentArcShape.controlPoint = worldP; // Sync angle with radius initially
          draftNeedsUpdate = true;
        } else if (arcState === 'setting-end') {
          currentArcShape.controlPoint = worldP;
          draftNeedsUpdate = true;
        }
      } else if (engine.currentShape && engine.pointer.isPointerDown) {
        if (state.tool === 'bezier') {
          if (bezierState === 'drawing-line' && currentBezierShape) {
            currentBezierShape.end = worldP;
            currentBezierShape.controlPoint = { 
               x: (currentBezierShape.start.x + worldP.x) / 2, 
               y: (currentBezierShape.start.y + worldP.y) / 2 
            };
            draftNeedsUpdate = true;
          } else if (bezierState === 'setting-control' && currentBezierShape) {
            currentBezierShape.controlPoint = worldP;
            draftNeedsUpdate = true;
          }
        } else {
          let constrainedP = { ...worldP };
          if (e.shiftKey) {
            const dx = worldP.x - engine.currentShape.start.x;
            const dy = worldP.y - engine.currentShape.start.y;
            
            if (state.tool === 'line' || state.tool === 'arrow' || state.tool === 'sine') {
              const angle = Math.atan2(dy, dx);
              const snapAngle = Math.round(angle / (Math.PI / 12)) * (Math.PI / 12);
              const dist = Math.sqrt(dx*dx + dy*dy);
              constrainedP.x = engine.currentShape.start.x + Math.cos(snapAngle) * dist;
              constrainedP.y = engine.currentShape.start.y + Math.sin(snapAngle) * dist;
            } else if (state.tool === 'rect' || state.tool === 'ellipse') {
              const maxD = Math.max(Math.abs(dx), Math.abs(dy));
              constrainedP.x = engine.currentShape.start.x + Math.sign(dx) * maxD;
              constrainedP.y = engine.currentShape.start.y + Math.sign(dy) * maxD;
            }
          }
          engine.currentShape.end = constrainedP;
          draftNeedsUpdate = true;
        }
      }

      if (state.tool === 'snip' && engine.snipRect && pointer.isPointerDown) {
        engine.snipRect.end = worldP;
        draftNeedsUpdate = true;
      }

      // Handle drag selection
      if (transformAction && transformStartPoint && transformStartBounds && engine.pointer.isPointerDown) {
        // Clone initial objects WITH THE SAME ID
        const selected = transformInitialObjects.map(initialObj => {
           const clone = initialObj.clone();
           clone.id = initialObj.id; // Preserve ID
           clone.selected = true;
           return clone;
        });
        
        if (transformAction === 'rotate') {
           const center = {
              x: transformStartBounds.x + transformStartBounds.w / 2,
              y: transformStartBounds.y + transformStartBounds.h / 2
           };
           const startAngle = Math.atan2(transformStartPoint.y - center.y, transformStartPoint.x - center.x);
           const currentAngle = Math.atan2(worldP.y - center.y, worldP.x - center.x);
           let deltaAngle = currentAngle - startAngle;
           
           if (e.shiftKey) {
              const deg15 = Math.PI / 12;
              deltaAngle = Math.round(deltaAngle / deg15) * deg15;
           }
           
           for (const obj of selected) {
              const dx = obj.cx - center.x;
              const dy = obj.cy - center.y;
              const cos = Math.cos(deltaAngle);
              const sin = Math.sin(deltaAngle);
              const newCx = center.x + dx * cos - dy * sin;
              const newCy = center.y + dx * sin + dy * cos;
              
              obj.translate(newCx - obj.cx, newCy - obj.cy);
              obj.rotation += deltaAngle;
           }
        } else if (transformAction.startsWith('scale_')) {
           let fixedPoint = { x: 0, y: 0 };
           if (transformAction === 'scale_tl') fixedPoint = { x: transformStartBounds.x + transformStartBounds.w, y: transformStartBounds.y + transformStartBounds.h };
           if (transformAction === 'scale_tr') fixedPoint = { x: transformStartBounds.x, y: transformStartBounds.y + transformStartBounds.h };
           if (transformAction === 'scale_bl') fixedPoint = { x: transformStartBounds.x + transformStartBounds.w, y: transformStartBounds.y };
           if (transformAction === 'scale_br') fixedPoint = { x: transformStartBounds.x, y: transformStartBounds.y };
           
           if (transformAction === 'scale_tc') fixedPoint = { x: transformStartBounds.x + transformStartBounds.w/2, y: transformStartBounds.y + transformStartBounds.h };
           if (transformAction === 'scale_bc') fixedPoint = { x: transformStartBounds.x + transformStartBounds.w/2, y: transformStartBounds.y };
           if (transformAction === 'scale_lc') fixedPoint = { x: transformStartBounds.x + transformStartBounds.w, y: transformStartBounds.y + transformStartBounds.h/2 };
           if (transformAction === 'scale_rc') fixedPoint = { x: transformStartBounds.x, y: transformStartBounds.y + transformStartBounds.h/2 };
           
           const startDistX = transformStartPoint.x - fixedPoint.x;
           const startDistY = transformStartPoint.y - fixedPoint.y;
           const currentDistX = worldP.x - fixedPoint.x;
           const currentDistY = worldP.y - fixedPoint.y;
           
           let scaleX = Math.abs(startDistX) > 0.01 ? currentDistX / startDistX : 1;
           let scaleY = Math.abs(startDistY) > 0.01 ? currentDistY / startDistY : 1;
           
           if (transformAction === 'scale_tc' || transformAction === 'scale_bc') scaleX = 1;
           if (transformAction === 'scale_lc' || transformAction === 'scale_rc') scaleY = 1;
           
           if (e.shiftKey) {
              const scale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
              scaleX = scale * Math.sign(scaleX);
              scaleY = scale * Math.sign(scaleY);
           }
           
           for (const obj of selected) {
              const dx = obj.cx - fixedPoint.x;
              const dy = obj.cy - fixedPoint.y;
              const newCx = fixedPoint.x + dx * scaleX;
              const newCy = fixedPoint.y + dy * scaleY;
              
              obj.translate(newCx - obj.cx, newCy - obj.cy);
              obj.scaleX *= scaleX;
              obj.scaleY *= scaleY;
           }
        }
        
        const selectedIds = selected.map(o => o.id);
        engine.scene.objects = engine.scene.objects.map(o => {
            if (selectedIds.includes(o.id)) {
                return selected.find(s => s.id === o.id)!;
            }
            return o;
        });
        
        engine.renderer.renderMain(true); // hide selection UI during drag
        
      } else if (isDraggingSelection && selectionDragStartPoint && engine.pointer.isPointerDown) {
        const dx = worldP.x - selectionDragStartPoint.x;
        const dy = worldP.y - selectionDragStartPoint.y;
        
        const selected = engine.scene.getSelectedObjects();
        for (const obj of selected) {
          obj.translate(dx, dy);
        }
        
        selectionDragStartPoint = worldP;
        hasMovedSelection = true;
        engine.renderer.renderMain();
      }

      if (state.tool === 'eraser-object' && engine.pointer.isPointerDown) {
        let hitId: string | null = null;
        for (let i = engine.scene.objects.length - 1; i >= 0; i--) {
          const el = engine.scene.objects[i];
          if (!el.locked && el.hitTest(worldP)) {
            hitId = el.id;
            break;
          }
        }
        if (hitId) {
          engine.scene.removeObject(hitId);
          engine.renderer.renderMain();
        }
      }
      
      // Update cursor
      if (interactionLayerRef.current) {
        if (state.tool === 'select-object') {
          let cursor = 'default';
          if (engine.pointer.isPointerDown && transformAction) {
             if (transformAction === 'rotate') cursor = 'grabbing';
             else if (transformAction === 'scale_tl' || transformAction === 'scale_br') cursor = 'nwse-resize';
             else if (transformAction === 'scale_tr' || transformAction === 'scale_bl') cursor = 'nesw-resize';
             else if (transformAction === 'scale_tc' || transformAction === 'scale_bc') cursor = 'ns-resize';
             else if (transformAction === 'scale_lc' || transformAction === 'scale_rc') cursor = 'ew-resize';
          } else if (engine.pointer.isPointerDown && isDraggingSelection) {
             cursor = 'move';
          } else {
             const bounds = engine.scene.getSelectionBounds();
             if (bounds) {
               const hs = 12 / engine.camera.zoom;
               const { x, y, w, h } = bounds;
               const hitTestHandle = (px: number, py: number, hx: number, hy: number) => {
                 return px >= hx - hs && px <= hx + hs && py >= hy - hs && py <= hy + hs;
               };
               
               if (hitTestHandle(worldP.x, worldP.y, x + w/2, y - 20/engine.camera.zoom)) cursor = 'grab';
               else if (hitTestHandle(worldP.x, worldP.y, x, y) || hitTestHandle(worldP.x, worldP.y, x + w, y + h)) cursor = 'nwse-resize';
               else if (hitTestHandle(worldP.x, worldP.y, x + w, y) || hitTestHandle(worldP.x, worldP.y, x, y + h)) cursor = 'nesw-resize';
               else if (hitTestHandle(worldP.x, worldP.y, x + w/2, y) || hitTestHandle(worldP.x, worldP.y, x + w/2, y + h)) cursor = 'ns-resize';
               else if (hitTestHandle(worldP.x, worldP.y, x, y + h/2) || hitTestHandle(worldP.x, worldP.y, x + w, y + h/2)) cursor = 'ew-resize';
               else {
                 let hitObject = false;
                 for (const obj of engine.scene.getSelectedObjects()) {
                   if (!obj.locked && obj.hitTest(worldP)) {
                     hitObject = true;
                     break;
                   }
                 }
                 if (hitObject) cursor = 'move';
               }
             }
          }
          interactionLayerRef.current.style.cursor = cursor;
        }
      }
    };

    pointer.onPointerUp = (p, e) => {
      if (isPanning) {
        isPanning = false;
        panStartScreen = null;
        initialPan = null;
        if (interactionLayerRef.current) {
          const tool = useBoardStore.getState().tool;
          if (tool === 'text') interactionLayerRef.current.style.cursor = 'text';
          else if (tool === 'hand') interactionLayerRef.current.style.cursor = 'grab';
          else interactionLayerRef.current.style.cursor = 'crosshair';
        }
        return;
      }

      const state = useBoardStore.getState();
      const engine = engineRef.current!;
      const worldP = processPoint(p, engine, state);

      if (activeInternalDragObj) {
        if (activeInternalDragObj.onPointerUp) {
          activeInternalDragObj.onPointerUp(worldP);
        }
        activeInternalDragObj = null;
        engine.renderer.renderMain();
        return;
      }
      
      if ((state.tool === 'pen' || state.tool === 'highlighter') && engine.currentStroke) {
        if (engine.pointer.pendingPoints.length > 0) {
          for (const pt of engine.pointer.pendingPoints) {
            const worldPt = processPoint(pt, engine, state);
            engine.currentStroke.addPoint(worldPt);
          }
          engine.pointer.pendingPoints = [];
        }

        engine.currentStroke.addPoint(worldP);
        engine.currentStroke.isDrawing = false;
        engine.currentStroke.updateCenter();
        
        engine.scene.addObject(engine.currentStroke);
        engine.currentStroke = null;
        
        engine.renderer.renderMain();
        engine.renderer.clearDraft();
        draftNeedsUpdate = false;
      } else if (state.tool === 'bezier' && currentBezierShape) {
         if (bezierState === 'drawing-line') {
             bezierState = 'setting-control';
         } else if (bezierState === 'setting-control') {
             currentBezierShape.updateCenter();
             engine.scene.addObject(currentBezierShape);
             engine.currentShape = null;
             currentBezierShape = null;
             bezierState = 'idle';
             
             engine.renderer.renderMain();
             engine.renderer.clearDraft();
             draftNeedsUpdate = false;
         }
      } else if (state.tool === 'arc' && currentArcShape) {
         // Arc state machine is handled in pointerDown, do nothing on pointerUp
      } else if (engine.currentShape) {
        // Shapes
        if (e.shiftKey && state.tool !== 'bezier') {
           engine.currentShape.end = { ...engine.currentShape.end }; // Keep the constrained end from move
        } else {
           engine.currentShape.end = worldP;
        }
        engine.currentShape.updateCenter();
        const drawnShape = engine.currentShape;
        engine.scene.addObject(drawnShape);
        engine.currentShape = null;
        
        engine.renderer.renderMain();
        engine.renderer.clearDraft();
        draftNeedsUpdate = false;
      } else if (transformAction) {
        transformAction = null;
        transformStartPoint = null;
        transformStartBounds = null;
        transformInitialObjects = [];
        engine.scene.saveState();
        engine.renderer.renderMain();
      } else if (isDraggingSelection) {
        isDraggingSelection = false;
        if (hasMovedSelection) {
          engine.scene.saveState();
        }
      } else if (state.tool === 'snip' && engine.snipRect) {
        engine.snipRect.end = worldP;
        const { start, end } = engine.snipRect;
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);
        
        if (w > 10 && h > 10) {
            const screenStart = engine.camera.worldToScreen(x, y);
            const screenEnd = engine.camera.worldToScreen(x + w, y + h);
            const sW = screenEnd.x - screenStart.x;
            const sH = screenEnd.y - screenStart.y;
            
            const offCanvas = document.createElement('canvas');
            const dpr = window.devicePixelRatio || 1;
            offCanvas.width = sW * dpr;
            offCanvas.height = sH * dpr;
            const offCtx = offCanvas.getContext('2d');
            
            if (offCtx && bgCanvasRef.current && mainCanvasRef.current) {
                const sx = screenStart.x * dpr;
                const sy = screenStart.y * dpr;
                const sw = sW * dpr;
                const sh = sH * dpr;
                
                offCtx.drawImage(bgCanvasRef.current, sx, sy, sw, sh, 0, 0, offCanvas.width, offCanvas.height);
                offCtx.drawImage(mainCanvasRef.current, sx, sy, sw, sh, 0, 0, offCanvas.width, offCanvas.height);
                
                offCanvas.toBlob((blob) => {
                    if (blob) {
                        const item = new window.ClipboardItem({ 'image/png': blob });
                        navigator.clipboard.write([item]).then(() => {
                            const flash = document.createElement('div');
                            flash.style.position = 'fixed';
                            flash.style.inset = '0';
                            flash.style.backgroundColor = 'white';
                            flash.style.opacity = '0.5';
                            flash.style.pointerEvents = 'none';
                            flash.style.transition = 'opacity 0.3s ease-out';
                            flash.style.zIndex = '9999';
                            document.body.appendChild(flash);
                            requestAnimationFrame(() => {
                                flash.style.opacity = '0';
                                setTimeout(() => flash.remove(), 300);
                            });
                        }).catch(console.error);
                    }
                }, 'image/png');
            }
        }
        
        engine.snipRect = null;
        engine.renderer.renderMain();
        engine.renderer.clearDraft();
        draftNeedsUpdate = true;
      } else if (state.tool === 'select-object' && engine.selectionRect) {
        engine.selectionRect.end = worldP;
        
        const { start, end } = engine.selectionRect;
        const x1 = Math.min(start.x, end.x);
        const y1 = Math.min(start.y, end.y);
        const x2 = Math.max(start.x, end.x);
        const y2 = Math.max(start.y, end.y);
        const w = x2 - x1;
        const h = y2 - y1;
        
        // Box selection
        for (const el of engine.scene.objects) {
          if (el.locked) continue;
          const box = el.getBoundingBox();
          const elX2 = box.x + box.w;
          const elY2 = box.y + box.h;
          // Check if element box intersects selection rect
          if (!(box.x > x2 || elX2 < x1 || box.y > y2 || elY2 < y1)) {
            engine.scene.toggleSelection(el.id, true);
          }
        }
        
        engine.selectionRect = null;
        engine.renderer.renderMain();
        engine.renderer.clearDraft();
        draftNeedsUpdate = false;
      }
    };

    pointer.onDoubleClick = (p, e) => {
      const state = useBoardStore.getState();
      if (state.tool !== 'select-object') return;
      
      const engine = engineRef.current!;
      const worldP = processPoint(p, engine, state);
      
      let hitId: string | null = null;
      for (let i = engine.scene.objects.length - 1; i >= 0; i--) {
        const el = engine.scene.objects[i];
        if (!el.locked && el.hitTest(worldP)) {
          hitId = el.id;
          break;
        }
      }
      
      if (hitId) {
        state.setEditingObjectId(hitId);
        if (state.tool === 'select-object') {
          const obj = engine.scene.objects.find(o => o.id === hitId);
          if (obj?.type === 'text' || (obj && 'fontFamily' in obj)) {
            const textObj = obj as any; // Cast to access properties since we don't import Text here directly if it's tricky, wait we have Text imported!
          state.setStrokeColor(textObj.color);
          state.setFontFamily(textObj.fontFamily);
          state.setFontSize(textObj.fontSize);
          
          const screenP = engine.camera.worldToScreen(textObj.position.x, textObj.position.y);
          const inputWidth = textObj.maxWidth ? (textObj.maxWidth * engine.camera.zoom + 8) : undefined;
          setTextInput({ x: screenP.x - 4, y: screenP.y - 4, text: textObj.text, width: inputWidth });
          engine.scene.removeObject(hitId);
          state.setTool('text');
          engine.renderer.renderMain();
          }
        }
      } else {
        state.setEditingObjectId(null);
      }
    };

    pointer.onPointerCancel = () => {
      const engine = engineRef.current!;
      if (engine.currentStroke) {
        engine.currentStroke = null;
        engine.renderer.clearDraft();
        draftNeedsUpdate = false;
      }
      if (engine.currentShape) {
        engine.currentShape = null;
        engine.renderer.clearDraft();
        draftNeedsUpdate = false;
      }
      arcState = 'idle';
      bezierState = 'idle';
      isDraggingSelection = false;
      transformAction = null;
    };

    pointer.onPinchStart = (center) => {
      if (interactionLayerRef.current) interactionLayerRef.current.style.cursor = 'grabbing';
    };

    pointer.onPinchMove = (center, scaleDelta, panDeltaX, panDeltaY) => {
      const state = useBoardStore.getState();
      const oldZoom = state.zoom;
      const oldPanX = state.panX;
      const oldPanY = state.panY;
      
      const worldX = (center.x - oldPanX) / oldZoom;
      const worldY = (center.y - oldPanY) / oldZoom;
      
      const minZoom = 0.1;
      const maxZoom = 5;
      let newZoom = oldZoom * scaleDelta;
      newZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
      
      let newPanX = center.x - worldX * newZoom; // Keep zoom centered but no horizontal pan drag
      let newPanY = center.y - worldY * newZoom + panDeltaY;
      
      if (newPanY > 0) newPanY = 0;
      
      state.setZoom(newZoom);
      state.setPan(newPanX, newPanY);
    };

    pointer.onPinchEnd = () => {
      if (interactionLayerRef.current) {
        const tool = useBoardStore.getState().tool;
        if (tool === 'text') interactionLayerRef.current.style.cursor = 'text';
        else if (tool === 'hand') interactionLayerRef.current.style.cursor = 'grab';
        else interactionLayerRef.current.style.cursor = 'crosshair';
      }
    };

    loop.start();

    return () => {
      loop.stop();
      pointer.destroy();
      interLayer.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('requestBoardRender', handleRequestRender);
    };
  }, []);

  useEffect(() => {
    if (pdfFile && engineRef.current) {
      loadPDFToScene(pdfFile, engineRef.current.scene, engineRef.current.renderer, engineRef.current.camera);
    }
  }, [pdfFile]);

  useEffect(() => {
    if (tool !== 'select-object' && engineRef.current) {
      engineRef.current.scene.clearSelection();
      useBoardStore.getState().setEditingObjectId(null);
      engineRef.current.renderer.renderMain();
    }
  }, [tool]);
  const cursorStyle = React.useMemo(() => {
    // Helper to safely encode SVG as base64 for cursors
    const createSvgCursor = (svg: string, x: number, y: number) => {
      let base64 = '';
      if (typeof window !== 'undefined') {
        base64 = window.btoa(svg);
      } else if (typeof Buffer !== 'undefined') {
        base64 = Buffer.from(svg).toString('base64');
      } else {
        return 'crosshair';
      }
      return `url("data:image/svg+xml;base64,${base64}") ${Math.round(x)} ${Math.round(y)}, crosshair`;
    };

    if (tool === 'pen') {
      const size = Math.min(64, Math.max(4, strokeSize));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${strokeColor}" /></svg>`;
      return createSvgCursor(svg, size/2, size/2);
    }
    if (tool === 'highlighter') {
      const width = Math.min(32, Math.max(4, strokeSize));
      const height = Math.min(64, Math.max(12, strokeSize * 4));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" fill="${strokeColor}" fill-opacity="0.6" /></svg>`;
      return createSvgCursor(svg, width/2, height/2);
    }
    if (tool === 'laser') {
      const size = 12;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#ef4444" /></svg>`;
      return createSvgCursor(svg, size/2, size/2);
    }
    if (tool === 'eraser-object' || tool === 'eraser-stroke') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>`;
      return createSvgCursor(svg, 2, 20);
    }
    if (tool === 'snip') return 'crosshair';
    if (tool === 'text') return 'text';
    if (tool === 'select-object') return 'default';
    if (tool === 'hand') return 'grab';
    
    // shape tools
    return 'crosshair';
  }, [tool, strokeSize, strokeColor]);

  const [windowHeight, setWindowHeight] = React.useState(0);
  const [windowWidth, setWindowWidth] = React.useState(0);

  useEffect(() => {
    isActiveRef.current = isActive;
    if (isActive && engineRef.current) {
      useBoardStore.getState().setActiveEngineRef(engineRef);
    }
  }, [isActive]);

  useEffect(() => {
    if (containerRef.current) {
      setWindowHeight(containerRef.current.clientHeight);
      setWindowWidth(containerRef.current.clientWidth);
    }
    const handleResizeW = () => {
      if (containerRef.current) {
        setWindowHeight(containerRef.current.clientHeight);
        setWindowWidth(containerRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', handleResizeW);
    return () => window.removeEventListener('resize', handleResizeW);
  }, []);
  // Calculate current page and total pages based on PDF pages
  let currentPage = 1;
  let totalPages = 1;
  let pdfPages: any[] = [];
  
  if (engineRef.current) {
    pdfPages = engineRef.current.scene.objects.filter((o: any) => o.pageIndex !== undefined).sort((a: any, b: any) => a.pageIndex - b.pageIndex);
    totalPages = pdfPages.length || 1;
    
    if (pdfPages.length > 0) {
      const viewportCenterY = (-panY + windowHeight / 2) / zoom;
      let minDistance = Infinity;
      
      pdfPages.forEach(p => {
        const pageCenterY = p.y + p.height / 2;
        const dist = Math.abs(pageCenterY - viewportCenterY);
        if (dist < minDistance) {
          minDistance = dist;
          currentPage = p.pageIndex;
        }
      });
    } else {
      // Fallback for whiteboard
      const scaledPageHeight = windowHeight * zoom;
      currentPage = scaledPageHeight ? Math.round(-panY / scaledPageHeight) + 1 : 1;
    }
  }

  const goToPage = (page: number) => {
    if (page < 1) page = 1;
    if (page > totalPages && pdfPages.length > 0) page = totalPages;
    
    let newPanY = 0;
    
    if (pdfPages.length > 0) {
      const targetPage = pdfPages.find(p => p.pageIndex === page);
      if (targetPage) {
        // Scroll so the top of the page is at the top of the viewport
        newPanY = -targetPage.y * zoom + 20;
      }
    } else {
      const scaledPageHeight = windowHeight * zoom;
      newPanY = -(page - 1) * scaledPageHeight;
    }
    
    useBoardStore.getState().setPan(useBoardStore.getState().panX, newPanY);
    if (engineRef.current) {
        engineRef.current.camera.y = newPanY;
        engineRef.current.renderer.renderMain();
        engineRef.current.renderer.renderBackground(useBoardStore.getState().gridEnabled, useBoardStore.getState().theme, !!pdfFile);
    }
  };

  const handleZoom = (newZoom: number) => {
    const oldZoom = zoom;
    const oldPanX = useBoardStore.getState().panX;
    const oldPanY = useBoardStore.getState().panY;
    
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = (containerRef.current?.clientHeight || window.innerHeight) / 2;
    
    const worldX = (screenCenterX - oldPanX) / oldZoom;
    const worldY = (screenCenterY - oldPanY) / oldZoom;
    
    const newPanX = screenCenterX - worldX * newZoom;
    const newPanY = screenCenterY - worldY * newZoom;
    
    useBoardStore.getState().setPan(newPanX, newPanY);
    useBoardStore.getState().setZoom(newZoom);
    
    if (engineRef.current) {
      engineRef.current.camera.x = newPanX;
      engineRef.current.camera.y = newPanY;
      engineRef.current.camera.zoom = newZoom;
      engineRef.current.renderer.renderBackground(useBoardStore.getState().gridEnabled, useBoardStore.getState().theme, !!pdfFile);
      engineRef.current.renderer.renderMain();
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.1, 5); // Max zoom 5x
    handleZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.1, 0.01); // Min zoom 0.01x
    handleZoom(newZoom);
  };

  const handleFitWidth = () => {
    if (pdfPages.length > 0 && windowWidth > 0) {
      // Find the maximum width among all PDF pages
      const maxWidth = Math.max(...pdfPages.map(p => p.width));
      // Leave a small padding (e.g. 40px total)
      const padding = 40;
      const targetZoom = windowWidth / (maxWidth + padding);
      
      const newZoom = Math.min(Math.max(targetZoom, 0.01), 5);
      useBoardStore.getState().setZoom(newZoom);
      
      // Center the page horizontally
      const newPanX = (windowWidth - (maxWidth * newZoom)) / 2;
      useBoardStore.getState().setPan(newPanX, useBoardStore.getState().panY);
      
      if (engineRef.current) {
        engineRef.current.camera.zoom = newZoom;
        engineRef.current.camera.x = newPanX;
        engineRef.current.renderer.renderBackground(useBoardStore.getState().gridEnabled, useBoardStore.getState().theme, !!pdfFile);
        engineRef.current.renderer.renderMain();
      }
    } else {
      handleZoom(1);
    }
  };

  useEffect(() => {
    const handleExport = async () => {
      if (!isActiveRef.current) return;
      if (!engineRef.current || !bgCanvasRef.current || !mainCanvasRef.current || !containerRef.current) return;
      const engine = engineRef.current;
      const scene = engine.scene;
      
      let maxY = windowHeight;
      for (const obj of scene.objects) {
         const b = obj.getBoundingBox();
         if (b && b.y + b.h > maxY) maxY = b.y + b.h;
      }
      
      const canvasW = containerRef.current.clientWidth;
      const canvasH = containerRef.current.clientHeight;
      const totalPages = Math.max(1, Math.ceil(maxY / canvasH));
      
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: canvasW > canvasH ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvasW, canvasH]
      });
      
      const dpr = window.devicePixelRatio || 1;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasW * dpr;
      exportCanvas.height = canvasH * dpr;
      const ctx = exportCanvas.getContext('2d')!;
      
      const originalY = engine.camera.y;
      const originalGrid = useBoardStore.getState().gridEnabled;
      
      for (let i = 0; i < totalPages; i++) {
        engine.camera.y = -i * canvasH * engine.camera.zoom;
        engine.renderer.renderBackground(originalGrid, useBoardStore.getState().theme, !!pdfFile);
        engine.renderer.renderMain(true);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        ctx.drawImage(bgCanvasRef.current, 0, 0);
        ctx.drawImage(mainCanvasRef.current, 0, 0);
        
        const dataUrl = exportCanvas.toDataURL('image/png');
        
        if (i > 0) pdf.addPage([canvasW, canvasH], canvasW > canvasH ? 'landscape' : 'portrait');
        pdf.addImage(dataUrl, 'PNG', 0, 0, canvasW, canvasH, undefined, 'FAST');
      }
      
      engine.camera.y = originalY;
      engine.renderer.renderBackground(originalGrid, useBoardStore.getState().theme, !!pdfFile);
      engine.renderer.renderMain();
      
      pdf.save('board-export.pdf');
    };
    
    window.addEventListener('export-pdf', handleExport);
    return () => window.removeEventListener('export-pdf', handleExport);
  }, [windowHeight]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <div ref={containerRef} style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden' }}>
        <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />
        <canvas ref={mainCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />
        <canvas ref={draftCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }} />
        <div
          ref={interactionLayerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 3,
            touchAction: 'none',
            cursor: cursorStyle
          }}
        />

        {/* Scrollbar */}
        <div
          id={`v-scrollbar-${pdfFile ? 'pdf' : 'whiteboard'}`}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '14px',
            height: '100%',
            background: 'rgba(0,0,0,0.05)',
            zIndex: 10,
            display: 'none'
          }}
        >
          <div
            id={`v-scrollbar-thumb-${pdfFile ? 'pdf' : 'whiteboard'}`}
            onPointerDown={handleScrollbarDragStart}
            style={{
              position: 'absolute',
              right: '2px',
              top: 0,
              width: '10px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '5px',
              cursor: 'pointer',
              touchAction: 'none'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
              }
            }}
          />
        </div>

        {/* Page Navigator & Zoom Controls */}
        <div style={{
          position: 'absolute', 
          bottom: '48px', 
          ...(isNavVisible ? { left: '50%', transform: 'translateX(-50%)' } : { right: '24px' }),
          zIndex: 30,
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255, 255, 255, 0.95)', color: 'var(--text-primary)', backdropFilter: 'blur(12px)',
          padding: '8px', borderRadius: '12px', border: '1px solid var(--border-color)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          {isNavVisible && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '8px' }}>
              {/* Zoom Controls */}
              <button className="tool-btn" onClick={handleZoomOut} style={{ padding: '4px', width: 'auto', height: 'auto' }} title="Thu nhỏ">
                <ZoomOut size={18} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={zoomInputValue}
                  onChange={(e) => setZoomInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  onBlur={() => {
                    const val = parseInt(zoomInputValue.replace('%', ''));
                    if (!isNaN(val) && val > 0) {
                      handleZoom(val / 100);
                    } else {
                      setZoomInputValue(Math.round(zoom * 100).toString());
                    }
                  }}
                  style={{ fontSize: '13px', fontWeight: '500', width: '30px', textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', color: 'inherit' }}
                />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>%</span>
              </div>
              <button className="tool-btn" onClick={handleZoomIn} style={{ padding: '4px', width: 'auto', height: 'auto' }} title="Phóng to">
                <ZoomIn size={18} />
              </button>
              <button className="tool-btn" onClick={handleFitWidth} style={{ padding: '4px', width: 'auto', height: 'auto', marginLeft: '4px' }} title="Vừa chiều rộng">
                <Maximize size={16} />
              </button>

              <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 8px' }} />

              {/* Page Controls */}
              <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '60px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="number" 
                  min={1} 
                  max={totalPages} 
                  defaultValue={currentPage}
                  key={currentPage}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(e.currentTarget.value);
                      if (!isNaN(val)) goToPage(val);
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.currentTarget.value);
                    if (!isNaN(val)) goToPage(val);
                    else e.currentTarget.value = currentPage.toString();
                  }}
                  style={{
                    width: '40px',
                    textAlign: 'center',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    background: 'transparent',
                    color: 'inherit',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '2px 0'
                  }}
                />
                / {totalPages}
              </span>
              <button className="tool-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} style={{ padding: '4px', width: 'auto', height: 'auto', opacity: currentPage <= 1 ? 0.5 : 1 }}>
                <ChevronUp size={20} />
              </button>
              <button className="tool-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages && pdfPages.length > 0} style={{ padding: '4px', width: 'auto', height: 'auto', opacity: (currentPage >= totalPages && pdfPages.length > 0) ? 0.5 : 1 }}>
                <ChevronDown size={20} />
              </button>
            </div>
          )}
          <button 
            className="tool-btn" 
            onClick={() => setIsNavVisible(!isNavVisible)} 
            style={{ padding: '4px', width: 'auto', height: 'auto', color: 'var(--text-secondary)' }} 
            title={isNavVisible ? "Ẩn thanh điều hướng" : "Hiện thanh điều hướng"}
          >
            {isNavVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        
        {textInput && (
          <textarea
            autoFocus
            ref={(el) => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }
            }}
            style={{
              position: 'absolute',
              left: textInput.x,
              top: textInput.y,
              zIndex: 10,
              background: 'transparent',
              color: strokeColor,
              fontFamily: fontFamily,
              fontSize: `${fontSize * zoom}px`,
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              outline: 'none',
              minWidth: '100px',
              minHeight: '40px',
              width: textInput.width ? `${textInput.width}px` : undefined,
              resize: 'horizontal',
              overflow: 'hidden',
              padding: '4px',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)'
            }}
            value={textInput.text}
            onChange={(e) => {
              setTextInput({ ...textInput, text: e.target.value });
              e.target.style.height = 'auto';
              e.target.style.height = (e.target.scrollHeight) + 'px';
            }}
            onBlur={(e) => {
              const related = e.relatedTarget as HTMLElement | null;
              if (related && related.closest('.ui-toolbar')) {
                // If focus moves to UI toolbar, keep editing (don't save and unmount)
                return;
              }
              
              if (textInput.text.trim()) {
                const state = useBoardStore.getState();
                const engine = engineRef.current;
                if (engine) {
                  // Padding is 4px on each side = 8px total
                  const maxWidth = (e.target.clientWidth - 8) / engine.camera.zoom;
                  const worldP = engine.camera.screenToWorld(textInput.x + 4, textInput.y + 4);
                  const textObj = new Text(worldP as Point, textInput.text, strokeColor, fontFamily, fontSize, maxWidth);
                  engine.scene.addObject(textObj);
                  engine.renderer.renderMain();
                }
              }
              setTextInput(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
