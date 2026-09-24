import { Camera } from './Camera';
import { Stroke } from '../objects/Stroke';
import { inkPath, inkRadius, inkSamples } from './InkGeometry';

interface InkPresenter {
  updateInkTrailStartPoint(event: PointerEvent, style: { color: string; diameter: number }): void;
}
type InkNavigator = Navigator & {
  ink?: { requestPresenter(options: { presentationArea: Element }): Promise<InkPresenter> };
};

// Owns only wet ink. The scene, React and the animation loop do not rasterize
// this surface while input is active. Saved ink always contains measured points.
export class LiveInk {
  private presenter: InkPresenter | null = null;
  private disposed = false;
  private rendered = 0;
  private stableThrough = 0;
  private hasStart = false;
  private backing: HTMLCanvasElement;
  private backingCtx: CanvasRenderingContext2D;
  private dirty: { x: number; y: number; right: number; bottom: number } | null = null;
  private stroke: Stroke | null = null;
  private lastEvent: PointerEvent | null = null;
  private nativeState: 'unavailable' | 'initializing' | 'ready' | 'failed' = 'unavailable';
  private inputType = 'unknown';
  private inputEvent = 'unknown';
  private nativeError: string | null = null;
  private metrics = { batches: 0, samples: 0, nativeUpdates: 0, maxInputAgeMs: 0, maxDrawMs: 0 };

  constructor(private canvas: HTMLCanvasElement, private ctx: CanvasRenderingContext2D, private camera: Camera) {
    this.backing = document.createElement('canvas');
    this.backingCtx = this.backing.getContext('2d')!;
    canvas.addEventListener('board-ink-diagnostics', this.report);
    canvas.dataset.inkEngine = 'spline-v2';
    const ink = (navigator as InkNavigator).ink;
    if (ink) {
      this.nativeState = 'initializing';
      void ink.requestPresenter({ presentationArea: canvas }).then(presenter => {
        if (!this.disposed) {
          this.presenter = presenter;
          this.nativeState = 'ready';
          canvas.dataset.nativeInk = 'ready';
        }
      }).catch(() => {
        if (!this.disposed) {
          this.nativeState = 'failed';
          canvas.dataset.nativeInk = 'failed';
        }
      });
    }
    canvas.dataset.nativeInk = this.nativeState;
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
    if (count > this.rendered) {
      if (this.backing.width !== this.canvas.width || this.backing.height !== this.canvas.height) {
        this.backing.width = this.canvas.width;
        this.backing.height = this.canvas.height;
      }
      const firstChanged = this.stableThrough + 1;
      const stableEnd = Math.max(0, count - 2);
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
      if (count > 1) this.ctx.fill(inkPath(stroke.points, stroke.size, stroke.isHighlighter, count - 1));
      this.ctx.restore();
      this.stableThrough = stableEnd;
      this.dirty = nextDirty;
      this.metrics.samples += count - this.rendered;
      this.rendered = count;
    }
    if (event) {
      this.inputType = event.pointerType;
      this.inputEvent = event.type;
      this.lastEvent = event;
      this.metrics.batches++;
      this.metrics.maxInputAgeMs = Math.max(this.metrics.maxInputAgeMs, Math.max(0, start - event.timeStamp));
      // Unlike JS prediction, the OS/browser can follow input between dispatched
      // events. Never send an untrusted event or an unrendered endpoint.
      if (this.presenter && event.isTrusted && !stroke.isHighlighter && count) {
        try {
          this.presenter.updateInkTrailStartPoint(event, {
            color: stroke.color,
            diameter: inkRadius(stroke.points[count - 1], stroke.size) * 2 * this.camera.zoom,
          });
          this.metrics.nativeUpdates++;
        } catch (error) {
          this.nativeError = String(error);
          this.presenter = null;
          this.nativeState = 'failed';
          this.canvas.dataset.nativeInk = 'failed';
        }
      }
    }
    this.metrics.maxDrawMs = Math.max(this.metrics.maxDrawMs, performance.now() - start);
  }

  // Canvas resize or camera changes invalidate pixels, but never sample data.
  redraw() {
    this.erasePixels();
    this.resetBacking();
    this.rendered = 0;
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
    // End any compositor trail on cancellation/tool changes too. Transparent
    // color is valid; zero diameter is not valid for the native API.
    if (this.presenter && this.lastEvent) {
      try { this.presenter.updateInkTrailStartPoint(this.lastEvent, { color: 'transparent', diameter: 1 }); } catch { /* Optional API. */ }
    }
    this.stroke = null;
    this.lastEvent = null;
    this.rendered = 0;
    this.resetBacking();
    this.erasePixels();
    this.canvas.style.opacity = '1';
  }

  diagnostics() {
    return { engine: 'spline-v2', inputType: this.inputType, inputEvent: this.inputEvent,
      nativeInk: this.nativeState, nativeError: this.nativeError,
      desynchronized: this.ctx.getContextAttributes().desynchronized,
      dpr: window.devicePixelRatio || 1, ...this.metrics };
  }

  private report = () => {
    this.canvas.dataset.inkDiagnostics = JSON.stringify(this.diagnostics());
  };

  destroy() {
    this.clear();
    this.canvas.removeEventListener('board-ink-diagnostics', this.report);
    this.disposed = true;
    this.presenter = null;
  }
}
