import { Scene } from './Scene';
import { Camera } from './Camera';

export class CanvasRenderer {
  bgCanvas: HTMLCanvasElement;
  mainCanvas: HTMLCanvasElement;
  draftCanvas: HTMLCanvasElement;
  
  bgCtx: CanvasRenderingContext2D;
  mainCtx: CanvasRenderingContext2D;
  draftCtx: CanvasRenderingContext2D;

  scene: Scene;
  camera: Camera;

  constructor(
    bgCanvas: HTMLCanvasElement,
    mainCanvas: HTMLCanvasElement,
    draftCanvas: HTMLCanvasElement,
    scene: Scene,
    camera: Camera
  ) {
    this.bgCanvas = bgCanvas;
    this.mainCanvas = mainCanvas;
    this.draftCanvas = draftCanvas;
    
    // desynchronized: true reduces latency for drawing apps
    this.bgCtx = this.bgCanvas.getContext('2d', { alpha: false })!;
    this.mainCtx = this.mainCanvas.getContext('2d', { desynchronized: true })!;
    this.draftCtx = this.draftCanvas.getContext('2d', { desynchronized: true })!;
    
    this.scene = scene;
    this.camera = camera;
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
  }

  clearContext(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // We clear by using the transform matrix to cover the scaled canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  renderBackground(
    gridEnabled: boolean,
    isPDF: boolean = false
  ) {
    this.clearContext(this.bgCtx, this.bgCanvas);
    
    // Draw Background
    const w = this.bgCanvas.width;
    const h = this.bgCanvas.height;
    
    if (isPDF) {
      this.bgCtx.fillStyle = '#323639'; // Standard Chrome PDF viewer background
    } else {
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = Math.max(w, h); // Cover the whole screen
      
      const gradient = this.bgCtx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      gradient.addColorStop(0, 'rgb(21,96,44)');
      gradient.addColorStop(1, 'rgb(22,49,34)');
      this.bgCtx.fillStyle = gradient;
    }
    
    // Fill in scaled coordinates
    const scale = 1; // Since we already scaled by dpr
    this.bgCtx.fillRect(0, 0, this.bgCanvas.width / scale, this.bgCanvas.height / scale);

    // Draw Grid
    if (gridEnabled) {
      const gridSize = 50 * this.camera.zoom;
      const offsetX = this.camera.x % gridSize;
      const offsetY = this.camera.y % gridSize;
      
      const width = this.bgCanvas.width;
      const height = this.bgCanvas.height;

      this.bgCtx.save();
      this.bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; // Xám nhạt hơi sáng
      this.bgCtx.lineWidth = 1;
      this.bgCtx.beginPath();

      // Vertical lines
      for (let x = offsetX; x < width; x += gridSize) {
        this.bgCtx.moveTo(x, 0);
        this.bgCtx.lineTo(x, height);
      }

      // Horizontal lines
      for (let y = offsetY; y < height; y += gridSize) {
        this.bgCtx.moveTo(0, y);
        this.bgCtx.lineTo(width, y);
      }

      this.bgCtx.stroke();
      this.bgCtx.restore();
    }
    
    if (!isPDF) {
      const dpr = window.devicePixelRatio || 1;
      const cssHeight = this.bgCanvas.height / dpr;
      const cssWidth = this.bgCanvas.width / dpr;

      // Create a 2% gap between pages
      const gapHeight = cssHeight * 0.02;
      const pageHeight = cssHeight * 0.98;
      const step = cssHeight; // pageHeight + gapHeight

      const scaledStep = step * this.camera.zoom;
      const scaledGap = gapHeight * this.camera.zoom;
      
      const pageOffsetY = this.camera.y % scaledStep;

      this.bgCtx.save();
      for (let y = pageOffsetY; y < cssHeight; y += scaledStep) {
        if (y > 0) {
          // Draw the gap
          this.bgCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
          this.bgCtx.fillRect(0, y - scaledGap, cssWidth, scaledGap);
          
          // Draw border lines for the page ends
          this.bgCtx.beginPath();
          this.bgCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          this.bgCtx.lineWidth = 1;
          this.bgCtx.moveTo(0, y - scaledGap);
          this.bgCtx.lineTo(cssWidth, y - scaledGap);
          this.bgCtx.moveTo(0, y);
          this.bgCtx.lineTo(cssWidth, y);
          this.bgCtx.stroke();
        }
      }
      this.bgCtx.restore();
    }
  }

  renderMain(hideSelectionBox = false) {
    this.clearContext(this.mainCtx, this.mainCanvas);
    this.camera.applyTransform(this.mainCtx);
    this.scene.draw(this.mainCtx);
    
    if (!hideSelectionBox) {
      const bounds = this.scene.getSelectionBounds();
      if (bounds) {
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
    
    const dpr = window.devicePixelRatio || 1;
    const cssHeight = this.mainCanvas.height / dpr;
    const cssWidth = this.mainCanvas.width / dpr;

    const gapHeight = cssHeight * 0.02;
    const step = cssHeight;
    
    const scaledStep = step * this.camera.zoom;
    const scaledGap = gapHeight * this.camera.zoom;
    let pageOffsetY = this.camera.y % scaledStep;
    if (pageOffsetY > 0) pageOffsetY -= scaledStep;
    
    const activePageIndex = Math.max(0, Math.round(-this.camera.y / scaledStep));
    let pageIndexOffset = Math.floor(-this.camera.y / scaledStep);
    
    ctx.save();
    for (let y = pageOffsetY; y <= cssHeight + scaledStep; y += scaledStep) {
      if (y > -scaledStep && y < cssHeight + scaledStep) {
         if (y > 0) {
           ctx.fillStyle = '#334155';
           ctx.fillRect(0, y - scaledGap, cssWidth, scaledGap);
           
           ctx.beginPath();
           ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
           ctx.lineWidth = 1;
           ctx.moveTo(0, y - scaledGap);
           ctx.lineTo(cssWidth, y - scaledGap);
           ctx.moveTo(0, y);
           ctx.lineTo(cssWidth, y);
           ctx.stroke();
         }
         
         if (pageIndexOffset === activePageIndex) {
           ctx.strokeStyle = '#ef4444';
           ctx.lineWidth = 2;
           ctx.strokeRect(1, y + 1, cssWidth - 2, scaledStep - scaledGap - 2);
         }
      }
      pageIndexOffset++;
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
