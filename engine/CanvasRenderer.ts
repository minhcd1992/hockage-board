import { Scene } from './Scene';
import { Camera } from './Camera';
import { LiveInk } from './LiveInk';
import { Stroke } from '../objects/Stroke';
import { editAnchors } from './ObjectTransform';

export class CanvasRenderer {
  bgCanvas: HTMLCanvasElement;
  mainCanvas: HTMLCanvasElement;
  draftCanvas: HTMLCanvasElement;
  
  bgCtx: CanvasRenderingContext2D;
  mainCtx: CanvasRenderingContext2D;
  draftCtx: CanvasRenderingContext2D;
  liveInk: LiveInk;

  scene: Scene;
  camera: Camera;
  fileType: string;

  constructor(
    bgCanvas: HTMLCanvasElement,
    mainCanvas: HTMLCanvasElement,
    draftCanvas: HTMLCanvasElement,
    scene: Scene,
    camera: Camera,
    fileType: string = 'whiteboard'
  ) {
    this.bgCanvas = bgCanvas;
    this.mainCanvas = mainCanvas;
    this.draftCanvas = draftCanvas;
    
    // desynchronized: true reduces latency for drawing apps
    this.bgCtx = this.bgCanvas.getContext('2d', { alpha: false })!;
    this.mainCtx = this.mainCanvas.getContext('2d')!;
    // The live ink surface is the latency-sensitive layer. Browsers may ignore
    // this hint; the normal canvas path remains a functional fallback.
    this.draftCtx = this.draftCanvas.getContext('2d', { desynchronized: true })!;
    this.liveInk = new LiveInk(this.draftCanvas, this.draftCtx, camera);
    
    this.scene = scene;
    this.camera = camera;
    this.fileType = fileType;
  }

  resize(width: number, height: number, dpr: number) {
    const canvases = [this.bgCanvas, this.mainCanvas, this.draftCanvas];
    const contexts = [this.bgCtx, this.mainCtx, this.draftCtx];

    canvases.forEach((canvas, i) => {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      contexts[i].scale(dpr, dpr);
    });

    this.renderMain();
    this.liveInk.redraw();
  }

  // A new stroke is on top of the existing scene; do not repaint every old
  // object on every pen lift. Full render remains for undo/zoom/selection.
  commitStroke(stroke: Stroke) {
    this.mainCtx.save();
    this.camera.applyTransform(this.mainCtx);
    stroke.draw(this.mainCtx);
    this.mainCtx.restore();
    this.drawWhiteboardOverlays(this.mainCtx);
    this.liveInk.clear();
  }

  clearContext(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (canvas === this.draftCanvas) {
      this.liveInk.clear();
      return;
    }
    // We clear by using the transform matrix to cover the scaled canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  renderBackground(
    gridEnabled: boolean,
    theme: 'green' | 'white' = 'green',
    isPDF: boolean = false
  ) {
    this.clearContext(this.bgCtx, this.bgCanvas);
    
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cssWidth = this.bgCanvas.width / dpr;
    const cssHeight = this.bgCanvas.height / dpr;

    // Fill the screen with backdrop color (for out-of-bounds areas)
    this.bgCtx.save();
    this.bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    if (isPDF) {
      this.bgCtx.fillStyle = '#323639'; // Standard Chrome PDF viewer background
    } else {
      this.bgCtx.fillStyle = theme === 'white' ? '#e5e7eb' : '#1e1e1e'; // Backdrop color
    }
    this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    this.bgCtx.restore();

    if (isPDF) {
      // For PDF, the pages are drawn as ImageObjects in the scene.
      // We don't draw whiteboard pages.
      return;
    }

    // --- Whiteboard Pages Rendering (in World Space) ---
    const pageWorldWidth = cssWidth;
    const pageWorldHeight = cssHeight * 0.98;
    const stepWorldHeight = cssHeight; // includes gap
    
    this.bgCtx.save();
    this.camera.applyTransform(this.bgCtx);

    const worldViewTop = -this.camera.y / this.camera.zoom;
    const worldViewBottom = (-this.camera.y + cssHeight) / this.camera.zoom;

    const startPage = Math.floor(worldViewTop / stepWorldHeight);
    const endPage = Math.floor(worldViewBottom / stepWorldHeight);

    for (let i = startPage; i <= endPage; i++) {
      const pageY = i * stepWorldHeight;

      // 1. Draw Page Background
      this.bgCtx.save();
      this.bgCtx.translate(0, pageY);

      if (theme === 'white') {
        this.bgCtx.fillStyle = '#f8f9fa';
      } else {
        const centerX = pageWorldWidth / 2;
        const centerY = pageWorldHeight / 2;
        const radius = Math.max(pageWorldWidth, pageWorldHeight);
        
        const gradient = this.bgCtx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgb(21,96,44)');
        gradient.addColorStop(1, 'rgb(22,49,34)');
        this.bgCtx.fillStyle = gradient;
      }
      
      // Page Drop Shadow (optional, looks nice when zoomed out)
      this.bgCtx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      this.bgCtx.shadowBlur = 10;
      this.bgCtx.shadowOffsetX = 0;
      this.bgCtx.shadowOffsetY = 4;
      
      this.bgCtx.fillRect(0, 0, pageWorldWidth, pageWorldHeight);
      this.bgCtx.restore();

      // 2. Draw Grid on Page
      if (gridEnabled) {
        this.bgCtx.save();
        this.bgCtx.translate(0, pageY);
        
        // Clip grid to page boundaries
        this.bgCtx.beginPath();
        this.bgCtx.rect(0, 0, pageWorldWidth, pageWorldHeight);
        this.bgCtx.clip();

        if (theme === 'white') {
          this.bgCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        } else {
          this.bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        }
        
        // Ensure consistent grid line width regardless of zoom
        this.bgCtx.lineWidth = 1 / this.camera.zoom;
        this.bgCtx.beginPath();

        const gridSize = 50;

        // Vertical lines
        for (let x = 0; x < pageWorldWidth; x += gridSize) {
          this.bgCtx.moveTo(x, 0);
          this.bgCtx.lineTo(x, pageWorldHeight);
        }

        // Horizontal lines
        for (let y = 0; y < pageWorldHeight; y += gridSize) {
          this.bgCtx.moveTo(0, y);
          this.bgCtx.lineTo(pageWorldWidth, y);
        }

        this.bgCtx.stroke();
        this.bgCtx.restore();
      }
    }

    this.bgCtx.restore();
  }

  renderMain(hideSelectionBox = false) {
    this.clearContext(this.mainCtx, this.mainCanvas);
    this.camera.applyTransform(this.mainCtx);
    this.scene.draw(this.mainCtx);
    
    if (!hideSelectionBox) {
      const bounds = this.scene.getSelectionBounds();
      const anchors = editAnchors(this.scene.getSelectedObjects());
      if (anchors.length) {
        const ctx = this.mainCtx;
        const zoom = this.camera.zoom;
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 1.5 / zoom;
        if (anchors.length === 3) {
          ctx.setLineDash([4 / zoom, 4 / zoom]);
          ctx.beginPath();
          ctx.moveTo(anchors[0].point.x, anchors[0].point.y);
          ctx.lineTo(anchors[2].point.x, anchors[2].point.y);
          ctx.lineTo(anchors[1].point.x, anchors[1].point.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        for (const { point } of anchors) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5 / zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      } else if (bounds) {
        const zoom = this.camera.zoom;
        this.mainCtx.save();
        this.mainCtx.strokeStyle = '#3b82f6';
        this.mainCtx.lineWidth = 1.5 / zoom;
        
        // Bounding box
        this.mainCtx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
        
        // Handles
        const hs = 8 / zoom;
        this.mainCtx.fillStyle = '#ffffff';
        
        const drawHandle = (x: number, y: number, isRotate = false) => {
          this.mainCtx.beginPath();
          if (isRotate) {
            this.mainCtx.arc(x, y, hs/2, 0, Math.PI * 2);
          } else {
            this.mainCtx.rect(x - hs/2, y - hs/2, hs, hs);
          }
          this.mainCtx.fill();
          this.mainCtx.stroke();
        };
        
        drawHandle(bounds.x, bounds.y); // tl
        drawHandle(bounds.x + bounds.w / 2, bounds.y); // tc
        drawHandle(bounds.x + bounds.w, bounds.y); // tr
        drawHandle(bounds.x, bounds.y + bounds.h / 2); // lc
        drawHandle(bounds.x + bounds.w, bounds.y + bounds.h / 2); // rc
        drawHandle(bounds.x, bounds.y + bounds.h); // bl
        drawHandle(bounds.x + bounds.w / 2, bounds.y + bounds.h); // bc
        drawHandle(bounds.x + bounds.w, bounds.y + bounds.h); // br
        
        // Rotate handle
        this.mainCtx.beginPath();
        this.mainCtx.moveTo(bounds.x + bounds.w / 2, bounds.y);
        this.mainCtx.lineTo(bounds.x + bounds.w / 2, bounds.y - 20 / zoom);
        this.mainCtx.stroke();
        drawHandle(bounds.x + bounds.w / 2, bounds.y - 20 / zoom, true);
        
        this.mainCtx.restore();
      }
    }
    
    this.camera.resetTransform(this.mainCtx);
    this.drawWhiteboardOverlays(this.mainCtx);
  }

  drawWhiteboardOverlays(ctx: CanvasRenderingContext2D) {
    const isPDF = this.scene.objects.some((o: any) => o.pageIndex !== undefined);
    if (isPDF) return;
    
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cssWidth = this.mainCanvas.width / dpr;
    const cssHeight = this.mainCanvas.height / dpr;

    const pageWorldWidth = cssWidth;
    const pageWorldHeight = cssHeight * 0.98;
    const stepWorldHeight = cssHeight; // includes gap
    
    ctx.save();
    this.camera.applyTransform(ctx);
    
    // Find active page based on camera center
    const centerY = (-this.camera.y + cssHeight / 2) / this.camera.zoom;
    const activePageIndex = Math.max(0, Math.floor(centerY / stepWorldHeight));
    
    // Draw red border around active page
    if (this.fileType !== 'html' && this.fileType !== 'lesson') {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2 / this.camera.zoom;
      ctx.strokeRect(0, activePageIndex * stepWorldHeight, pageWorldWidth, pageWorldHeight);
    }

    ctx.restore();
  }

  renderDraft(drawFn: (ctx: CanvasRenderingContext2D) => void) {
    this.clearContext(this.draftCtx, this.draftCanvas);
    this.camera.applyTransform(this.draftCtx);
    drawFn(this.draftCtx);
    this.camera.resetTransform(this.draftCtx);
    this.drawWhiteboardOverlays(this.draftCtx);
  }

  clearDraft() {
    this.clearContext(this.draftCtx, this.draftCanvas);
  }
}

