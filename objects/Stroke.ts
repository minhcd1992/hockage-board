import { BoardObject, Point, Rect, pointInRect, rectsIntersect, segmentIntersectsRect } from '../types';
import { inkPath, inkSamples } from '../engine/InkGeometry';
import { INK_LOOKAHEAD, stabilizeInkPoint } from '../engine/InkStabilizer';

export class Stroke extends BoardObject {
  points: Point[];
  color: string;
  size: number;
  isDrawing: boolean;
  revision = 0;
  private inputZoom: number;
  private inputPoints: Point[] = [];

  get stableThrough() {
    return Math.max(0, this.points.length - INK_LOOKAHEAD - 2);
  }
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
    input: { zoom?: number } = {}) {
    super();
    this.type = 'stroke';
    this.points = [];
    this.color = color;
    this.size = size;
    this.isDrawing = true;
    this.isEraser = isEraser;
    this.isHighlighter = isHighlighter;
    this.inputZoom = Math.max(0.1, input.zoom ?? 1);
  }

  addPoint(p: Point) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const last = this.inputPoints.at(-1);
    if (last?.x === p.x && last.y === p.y && last.pressure === p.pressure) return;
    const anchor = this.inputPoints.at(-2);
    // Both native pen and mouse-mode tablets use distance-based controls.
    // Retain a mutable, exact tip between anchors instead of recording every
    // tiny jitter or waiting for another animation frame. Never move the start.
    if (last && anchor && ((last.x === p.x && last.y === p.y) ||
        Math.hypot(last.x - anchor.x, last.y - anchor.y) * this.inputZoom < 2)) {
      this.inputPoints[this.inputPoints.length - 1] = { ...p };
    } else {
      this.inputPoints.push({ ...p });
    }
    // Refit only the controls touched by the newest sample. Always fit from
    // measured controls, never previously smoothed output (no cumulative drift).
    const count = this.inputPoints.length;
    for (let i = Math.max(0, count - INK_LOOKAHEAD - 1); i < count; i++) {
      this.points[i] = { ...stabilizeInkPoint(this.inputPoints, i, this.inputZoom) };
    }
    this.revision++;
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

  override getBoundingBox(): Rect {
    if (this.rotation === 0 && this.scaleX === 1 && this.scaleY === 1) {
      return this._getBoundingBox();
    }
    if (this.points.length === 0) {
      return { x: 0, y: 0, w: 0, h: 0 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const scale = Math.max(Math.abs(this.scaleX), Math.abs(this.scaleY));
    const pad = ((this.isHighlighter ? this.size * 2 : this.size * 0.6) + 2) * scale;
    for (const p of this.centerline()) {
      const gp = this.transformPoint(p);
      if (gp.x < minX) minX = gp.x;
      if (gp.y < minY) minY = gp.y;
      if (gp.x > maxX) maxX = gp.x;
      if (gp.y > maxY) maxY = gp.y;
    }
    return {
      x: minX - pad,
      y: minY - pad,
      w: (maxX - minX) + pad * 2,
      h: (maxY - minY) + pad * 2
    };
  }

  _hitTest(p: Point): boolean {
    if (this.points.length === 0) return false;
    const box = this._getBoundingBox();
    const extraTolerance = 6;
    if (
      p.x < box.x - extraTolerance ||
      p.x > box.x + box.w + extraTolerance ||
      p.y < box.y - extraTolerance ||
      p.y > box.y + box.h + extraTolerance
    ) {
      return false;
    }
    
    const thresholdSq = Math.pow((this.isHighlighter ? this.size * 2 : this.size * 0.6) + extraTolerance, 2);

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

  override intersectsRect(rect: Rect): boolean {
    if (this.points.length === 0) return false;
    if (!rectsIntersect(this.getBoundingBox(), rect)) return false;
    const scale = Math.max(Math.abs(this.scaleX), Math.abs(this.scaleY));
    const pad = ((this.isHighlighter ? this.size * 2 : this.size * 0.6) + 2) * scale;
    const expanded: Rect = {
      x: rect.x - pad,
      y: rect.y - pad,
      w: rect.w + pad * 2,
      h: rect.h + pad * 2,
    };
    const samples = this.centerline();
    if (samples.length === 1) {
      return pointInRect(this.transformPoint(samples[0]), expanded);
    }
    for (let i = 0; i < samples.length - 1; i++) {
      const p1 = this.transformPoint(samples[i]);
      const p2 = this.transformPoint(samples[i + 1]);
      if (segmentIntersectsRect(p1, p2, expanded)) return true;
    }
    return false;
  }

  _translate(dx: number, dy: number): void {
    this.outlineCache = null;
    this.samplesCache = null;
    for (const p of [...this.points, ...this.inputPoints]) {
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
      { zoom: this.inputZoom });
    s.points = this.points.map(p => ({ ...p }));
    s.inputPoints = this.inputPoints.map(p => ({ ...p }));
    s.isDrawing = this.isDrawing;
    s.copyTransforms(this);
    return s;
  }
}
