import { BoardObject, Point, Rect } from '../types';
import { inkPath, inkSamples, smoothMousePoint } from '../engine/InkGeometry';

export class Stroke extends BoardObject {
  points: Point[];
  color: string;
  size: number;
  isDrawing: boolean;
  readonly mouseSmoothing: boolean;
  private inputZoom: number;
  private previousInput: Point | null = null;
  private lastInput: Point | null = null;
  private samplesCache: { points: Point[]; count: number; samples: Point[] } | null = null;

  private centerline() {
    if (!this.samplesCache || this.samplesCache.points !== this.points || this.samplesCache.count !== this.points.length) {
      this.samplesCache = { points: this.points, count: this.points.length, samples: inkSamples(this.points) };
    }
    return this.samplesCache.samples;
  }
  private outlineCache: { path: Path2D; size: number; highlighter: boolean; points: Point[]; count: number } | null = null;
  
  isEraser: boolean = false;
  isHighlighter: boolean = false;
  
  constructor(color: string, size: number, isEraser: boolean = false, isHighlighter: boolean = false,
    input: { mouse?: boolean; zoom?: number } = {}) {
    super();
    this.type = 'stroke';
    this.points = [];
    this.color = color;
    this.size = size;
    this.isDrawing = true;
    this.isEraser = isEraser;
    this.isHighlighter = isHighlighter;
    this.mouseSmoothing = !!input.mouse;
    this.inputZoom = Math.max(0.1, input.zoom ?? 1);
  }

  addPoint(p: Point) {
    if (this.mouseSmoothing) {
      if (this.lastInput?.x === p.x && this.lastInput.y === p.y) return;
      if (this.previousInput && this.lastInput) {
        this.points[this.points.length - 1] = smoothMousePoint(this.previousInput, this.lastInput, p, this.inputZoom);
      }
      this.previousInput = this.lastInput;
      this.lastInput = { ...p };
    }
    this.points.push(p);
    this.outlineCache = null;
    this.samplesCache = null;
  }

  // Identical geometry during input, after pointerup, and in exports.
  _draw(ctx: CanvasRenderingContext2D): void {
    if (!this.points.length) return;
    let cache = this.outlineCache;
    if (!cache || cache.size !== this.size || cache.highlighter !== this.isHighlighter ||
        cache.points !== this.points || cache.count !== this.points.length) {
      cache = { path: inkPath(this.points, this.size, this.isHighlighter), size: this.size,
        highlighter: this.isHighlighter, points: this.points, count: this.points.length };
      this.outlineCache = cache;
    }
    ctx.save();
    ctx.globalCompositeOperation = this.isEraser ? 'destination-out' : 'source-over';
    ctx.globalAlpha = this.isHighlighter ? 0.4 : 1;
    ctx.fillStyle = this.isEraser ? '#000' : this.color;
    ctx.fill(cache.path);
    ctx.restore();
  }

  _getBoundingBox(): Rect {
    if (this.points.length === 0) {
      return { x: 0, y: 0, w: 0, h: 0 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    const pad = (this.isHighlighter ? this.size * 2 : this.size * 0.6) + 2;

    for (const p of this.centerline()) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      x: minX - pad,
      y: minY - pad,
      w: (maxX - minX) + pad * 2,
      h: (maxY - minY) + pad * 2
    };
  }

  _hitTest(p: Point): boolean {
    const box = this._getBoundingBox();
    if (p.x < box.x || p.x > box.x + box.w || p.y < box.y || p.y > box.y + box.h) {
      return false;
    }
    
    const thresholdSq = Math.pow((this.isHighlighter ? this.size * 2 : this.size * 0.6) + 5, 2); // 5px tolerance

    if (this.points.length === 1) {
      const dx = this.points[0].x - p.x;
      const dy = this.points[0].y - p.y;
      return dx*dx + dy*dy <= thresholdSq;
    }
    
    // Hit-test the displayed curve rather than its raw input chords.
    const samples = this.centerline();
    for (let i = 0; i < samples.length - 1; i++) {
      const v = samples[i];
      const w = samples[i+1];
      
      const l2 = Math.pow(w.x - v.x, 2) + Math.pow(w.y - v.y, 2);
      let t = 0;
      if (l2 !== 0) {
        t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
      }
      
      const projX = v.x + t * (w.x - v.x);
      const projY = v.y + t * (w.y - v.y);
      
      const dx = p.x - projX;
      const dy = p.y - projY;
      
      if (dx*dx + dy*dy <= thresholdSq) {
        return true;
      }
    }
    
    return false;
  }

  _translate(dx: number, dy: number): void {
    this.outlineCache = null;
    this.samplesCache = null;
    for (const p of this.points) {
      p.x += dx;
      p.y += dy;
    }
  }

  updateCenter(): void {
    const box = this._getBoundingBox();
    this.cx = box.x + box.w / 2;
    this.cy = box.y + box.h / 2;
  }

  clone(): BoardObject {
    const s = new Stroke(this.color, this.size, this.isEraser, this.isHighlighter,
      { mouse: this.mouseSmoothing, zoom: this.inputZoom });
    s.points = this.points.map(p => ({ ...p }));
    s.isDrawing = this.isDrawing;
    s.copyTransforms(this);
    return s;
  }
}
