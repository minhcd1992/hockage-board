import { Camera } from './Camera';
import { Stroke } from '../objects/Stroke';
import { inkPath, inkRadius } from './InkGeometry';

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
  private stroke: Stroke | null = null;
  private lastEvent: PointerEvent | null = null;
  private nativeState: 'unavailable' | 'initializing' | 'ready' | 'failed' = 'unavailable';
  private inputType = 'unknown';
  private inputEvent = 'unknown';
  private nativeError: string | null = null;
  private metrics = { batches: 0, samples: 0, nativeUpdates: 0, maxInputAgeMs: 0, maxDrawMs: 0 };

  constructor(private canvas: HTMLCanvasElement, private ctx: CanvasRenderingContext2D, private camera: Camera) {
    canvas.addEventListener('board-ink-diagnostics', this.report);
    canvas.dataset.inkEngine = 'capsule-v1';
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
      this.ctx.save();
      this.camera.applyTransform(this.ctx);
      this.ctx.fillStyle = stroke.color;
      this.ctx.fill(inkPath(stroke.points, stroke.size, stroke.isHighlighter, this.rendered));
      this.ctx.restore();
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
    this.rendered = 0;
    this.render();
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
    this.erasePixels();
    this.canvas.style.opacity = '1';
  }

  diagnostics() {
    return { engine: 'capsule-v1', inputType: this.inputType, inputEvent: this.inputEvent,
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
