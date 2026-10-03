import { Camera } from './Camera';
import { Stroke } from '../objects/Stroke';
import { inkPath, inkSamples } from './InkGeometry';

// Owns only wet ink. The scene, React and the animation loop do not rasterize
// this surface while input is active. Live and saved ink share the same geometry.
export class LiveInk {
  private renderedRevision = -1;
  private stableThrough = 0;
  private hasStart = false;
  private backing: HTMLCanvasElement;
  private backingCtx: CanvasRenderingContext2D;
  private dirty: { x: number; y: number; right: number; bottom: number } | null = null;
  private stroke: Stroke | null = null;
  private inputType = 'unknown';
  private inputEvent = 'unknown';
  private metrics = { batches: 0, samples: 0, maxInputAgeMs: 0, maxDrawMs: 0 };

  constructor(private canvas: HTMLCanvasElement, private ctx: CanvasRenderingContext2D, private camera: Camera) {
    this.backing = document.createElement('canvas');
    this.backingCtx = this.backing.getContext('2d')!;
    canvas.addEventListener('board-ink-diagnostics', this.report);
    canvas.dataset.inkEngine = 'quadratic-v4.1';
    // A delegated OS trail has its own lifetime and can briefly bridge pen lifts.
    // Keep all visible ink on our canvas, whose pixels reset on every stroke.
    canvas.dataset.nativeInk = 'disabled';
  }

  begin(stroke: Stroke, event: PointerEvent) {
    this.clear();
    this.stroke = stroke;
    // Draw opaque into the live surface, then apply alpha once to the layer.
    // This prevents dark joints and self-intersections in a highlighter stroke.
    this.canvas.style.opacity = stroke.isHighlighter ? '0.4' : '1';
    this.render(event);
  }

  render(event?: PointerEvent) {
    const stroke = this.stroke;
    if (!stroke) return;
    const start = performance.now();
    const count = stroke.points.length;
    if (stroke.revision !== this.renderedRevision) {
      if (this.backing.width !== this.canvas.width || this.backing.height !== this.canvas.height) {
        this.backing.width = this.canvas.width;
        this.backing.height = this.canvas.height;
      }
      const firstChanged = this.stableThrough + 1;
      // The exact tip can move without increasing the control-point count.
      // Keep every span touched by the local fit replaceable.
      const stableEnd = stroke.stableThrough;
      this.backingCtx.save();
      this.camera.applyTransform(this.backingCtx);
      this.backingCtx.fillStyle = stroke.color;
      if (!this.hasStart) {
        this.backingCtx.fill(inkPath(stroke.points, stroke.size, stroke.isHighlighter, 0, 0));
        this.hasStart = true;
      }
      if (stableEnd >= firstChanged) {
        this.backingCtx.fill(inkPath(stroke.points, stroke.size, stroke.isHighlighter, firstChanged, stableEnd));
      }
      this.backingCtx.restore();
      const samples = inkSamples(stroke.points, firstChanged);
      const dpr = window.devicePixelRatio || 1;
      const pad = (stroke.isHighlighter ? stroke.size * 2 : stroke.size * 0.6) * this.camera.zoom * dpr + 3;
      let x = Infinity, y = Infinity, right = -Infinity, bottom = -Infinity;
      for (const sample of samples) {
        const screen = this.camera.worldToScreen(sample.x, sample.y);
        x = Math.min(x, screen.x * dpr - pad); y = Math.min(y, screen.y * dpr - pad);
        right = Math.max(right, screen.x * dpr + pad); bottom = Math.max(bottom, screen.y * dpr + pad);
      }
      const nextDirty = { x, y, right, bottom };
      if (this.dirty) {
        x = Math.min(x, this.dirty.x); y = Math.min(y, this.dirty.y);
        right = Math.max(right, this.dirty.right); bottom = Math.max(bottom, this.dirty.bottom);
      }
      x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y));
      right = Math.min(this.canvas.width, Math.ceil(right)); bottom = Math.min(this.canvas.height, Math.ceil(bottom));
      // Replace only the old/new tail region from stable ink. No CPU pixel
      // readback, no full-stroke reconstruction on each pointer event.
      if (right > x && bottom > y) {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.beginPath(); this.ctx.rect(x, y, right - x, bottom - y); this.ctx.clip();
        this.ctx.globalCompositeOperation = 'copy';
        this.ctx.drawImage(this.backing, x, y, right - x, bottom - y, x, y, right - x, bottom - y);
        this.ctx.restore();
      }
      this.ctx.save();
      this.camera.applyTransform(this.ctx);
      this.ctx.fillStyle = stroke.color;
      if (count > 1) this.ctx.fill(inkPath(stroke.points, stroke.size, stroke.isHighlighter, stableEnd + 1));
      this.ctx.restore();
      this.stableThrough = stableEnd;
      this.dirty = nextDirty;
      this.metrics.samples += stroke.revision - Math.max(0, this.renderedRevision);
      this.renderedRevision = stroke.revision;
    }
    if (event) {
      this.inputType = event.pointerType;
      this.inputEvent = event.type;
      this.metrics.batches++;
      this.metrics.maxInputAgeMs = Math.max(this.metrics.maxInputAgeMs, Math.max(0, start - event.timeStamp));
    }
    this.metrics.maxDrawMs = Math.max(this.metrics.maxDrawMs, performance.now() - start);
  }

  // Canvas resize or camera changes invalidate pixels, but never sample data.
  redraw() {
    this.erasePixels();
    this.resetBacking();
    this.renderedRevision = -1;
    this.render();
  }

  private resetBacking() {
    this.backingCtx.save();
    this.backingCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.backingCtx.clearRect(0, 0, this.backing.width, this.backing.height);
    this.backingCtx.restore();
    this.stableThrough = 0;
    this.hasStart = false;
    this.dirty = null;
  }

  private erasePixels() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  clear() {
    this.stroke = null;
    this.renderedRevision = -1;
    this.resetBacking();
    this.erasePixels();
    this.canvas.style.opacity = '1';
  }

  diagnostics() {
    return { engine: 'quadratic-v4.1', inputType: this.inputType, inputEvent: this.inputEvent,
      smoothing: 'local-polynomial-quadratic',
      nativeInk: 'disabled', nativeUpdates: 0,
      desynchronized: this.ctx.getContextAttributes().desynchronized,
      dpr: window.devicePixelRatio || 1, ...this.metrics };
  }

  private report = () => {
    this.canvas.dataset.inkDiagnostics = JSON.stringify(this.diagnostics());
  };

  destroy() {
    this.clear();
    this.canvas.removeEventListener('board-ink-diagnostics', this.report);
  }
}
