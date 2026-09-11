import { BoardObject, Point, Rect } from '../types';
import { getStroke } from 'perfect-freehand';

export class Stroke extends BoardObject {
  points: Point[];
  color: string;
  size: number;
  isDrawing: boolean;
  
  isEraser: boolean = false;
  isHighlighter: boolean = false;
  
  constructor(color: string, size: number, isEraser: boolean = false, isHighlighter: boolean = false) {
    super();
    this.type = 'stroke';
    this.points = [];
    this.color = color;
    this.size = size;
    this.isDrawing = true;
    this.isEraser = isEraser;
    this.isHighlighter = isHighlighter;
  }

  addPoint(p: Point) {
    this.points.push(p);
  }

  // Draw the stroke
  _draw(ctx: CanvasRenderingContext2D): void {
    if (this.points.length === 0) return;

    ctx.save();

    if (this.isHighlighter) {
      // Highlighter: semi-transparent, blend without self-erasing
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      if (this.points.length > 0) {
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
          // A simple quadratic curve smoothing could be added here, but lineTo works well for strokes
          ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // Calculate visual scale from context
    const transform = ctx.getTransform();
    const scale = Math.sqrt(transform.a * transform.a + transform.b * transform.b) || 1;

    // Normal Pen (perfect-freehand)
    const inputPoints = this.points.map(p => ({
      x: p.x * scale,
      y: p.y * scale,
      pressure: p.pressure ?? 0.5
    }));

    const outlinePoints = getStroke(inputPoints, {
      size: this.size * scale,
      thinning: 0.2,
      smoothing: 0.9,
      streamline: 0.75,
      simulatePressure: false,
      last: !this.isDrawing, 
    });

    if (outlinePoints.length === 0) {
      ctx.restore();
      return;
    }

    if (this.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000'; // Color doesn't matter for destination-out, but must be solid
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = this.color;
    }

    ctx.beginPath();
    ctx.moveTo(outlinePoints[0][0] / scale, outlinePoints[0][1] / scale);
    
    // Draw the outline polygon
    for (let i = 1; i < outlinePoints.length; i++) {
      ctx.lineTo(outlinePoints[i][0] / scale, outlinePoints[i][1] / scale);
    }
    
    ctx.closePath();
    ctx.fill();
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
    
    const pad = this.size / 2 + 2;

    for (const p of this.points) {
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
    const box = this.getBoundingBox();
    if (p.x < box.x || p.x > box.x + box.w || p.y < box.y || p.y > box.y + box.h) {
      return false;
    }
    
    const thresholdSq = Math.pow(this.size / 2 + 5, 2); // 5px tolerance

    if (this.points.length === 1) {
      const dx = this.points[0].x - p.x;
      const dy = this.points[0].y - p.y;
      return dx*dx + dy*dy <= thresholdSq;
    }
    
    // Check distance to all segments
    for (let i = 0; i < this.points.length - 1; i++) {
      const v = this.points[i];
      const w = this.points[i+1];
      
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
    const s = new Stroke(this.color, this.size, this.isEraser);
    s.points = this.points.map(p => ({ ...p }));
    s.isDrawing = this.isDrawing;
    s.copyTransforms(this);
    return s;
  }
}

