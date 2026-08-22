import { BoardObject, Point, Rect } from '../types';
import { useBoardStore } from '../store/useBoardStore';

export class PdfObject extends BoardObject {
  pdfPage: any;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  
  cachedCanvas: HTMLCanvasElement | null = null;
  cachedScale: number = 0;
  isRendering: boolean = false;
  renderTask: any = null;

  constructor(pdfPage: any, x: number, y: number, width: number, height: number, pageIndex: number) {
    super();
    this.type = 'pdf'; // Unique type
    this.pdfPage = pdfPage;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.pageIndex = pageIndex;
    this.locked = true;
  }

  _draw(ctx: CanvasRenderingContext2D) {
    const transform = ctx.getTransform();
    // Use the maximum of scale X and Y to be safe
    const currentScale = Math.max(transform.a, transform.d); 

    const { panX, panY, zoom } = useBoardStore.getState();
    const viewMinX = -panX / zoom;
    const viewMinY = -panY / zoom;
    const viewMaxX = (window.innerWidth - panX) / zoom;
    const viewMaxY = (window.innerHeight - panY) / zoom;

    const isVisible = (
      this.x < viewMaxX &&
      this.x + this.width > viewMinX &&
      this.y < viewMaxY + 500 && // 500px buffer
      this.y + this.height > viewMinY - 500
    );

    if (!isVisible) {
      if (this.cachedCanvas) {
        // Free memory for off-screen pages
        this.cachedCanvas = null;
        this.cachedScale = 0;
      }
    } else {
      // If the difference in scale is > 20%, trigger a re-render.
      // Also re-render if it's the very first time.
      if (!this.cachedCanvas || (this.cachedScale > 0 && Math.abs(this.cachedScale - currentScale) / this.cachedScale > 0.2)) {
        if (!this.isRendering) {
          this.renderToCache(currentScale);
        }
      }
    }

    if (this.cachedCanvas) {
      ctx.drawImage(this.cachedCanvas, this.x, this.y, this.width, this.height);
    } else {
      // Draw placeholder
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      
      // Optional subtle border and loading text if visible
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1 / currentScale; // 1px on screen
      ctx.strokeRect(this.x, this.y, this.width, this.height);
      
      if (isVisible) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = `${20 / currentScale}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Đang tải trang...', this.x + this.width / 2, this.y + this.height / 2);
      }
    }
  }

  async renderToCache(targetScale: number) {
    this.isRendering = true;
    
    // Prevent rendering at insanely huge scales (max 5x relative to device pixel ratio)
    const dpr = window.devicePixelRatio || 1;
    const safeScale = Math.min(targetScale * dpr, 4.0 * dpr); // Capped at 4.0 * dpr
    
    try {
      const viewport = this.pdfPage.getViewport({ scale: safeScale });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      // Cancel previous task if running
      if (this.renderTask) {
        this.renderTask.cancel();
      }

      this.renderTask = this.pdfPage.render({
        canvasContext: ctx,
        viewport: viewport
      });

      await this.renderTask.promise;
      
      this.cachedCanvas = canvas;
      this.cachedScale = targetScale;
      this.renderTask = null;

      // Dispatch event to tell Board to re-render main canvas
      window.dispatchEvent(new Event('requestBoardRender'));
    } catch (e: any) {
      if (e.name !== 'RenderingCancelledException') {
        console.error("PDF render error:", e);
      }
    } finally {
      this.isRendering = false;
    }
  }

  _getBoundingBox(): Rect {
    return {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    };
  }

  _hitTest(p: Point): boolean {
    return p.x >= this.x && p.x <= this.x + this.width &&
           p.y >= this.y && p.y <= this.y + this.height;
  }

  _translate(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  updateCenter(): void {
    const box = this._getBoundingBox();
    this.cx = box.x + box.w / 2;
    this.cy = box.y + box.h / 2;
  }

  clone(): BoardObject {
    const s = new PdfObject(this.pdfPage, this.x, this.y, this.width, this.height, this.pageIndex);
    s.copyTransforms(this);
    return s;
  }
}
