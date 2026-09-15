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

    // Set composite operation
    if (this.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    // ======================================================================
    // LIVE DRAWING: Simple canvas stroke rendering — ZERO latency.
    // No perfect-freehand = no streamline delay = stroke is exactly at cursor.
    // Uses quadratic curves between midpoints for smooth appearance.
    // ======================================================================
    if (this.isDrawing) {
      if (this.isEraser) {
        ctx.strokeStyle = '#000';
      } else {
        ctx.strokeStyle = this.color;
      }
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      if (this.points.length === 1) {
        // Single point: draw a dot
        ctx.fillStyle = this.isEraser ? '#000' : this.color;
        ctx.arc(this.points[0].x, this.points[0].y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.points.length === 2) {
        ctx.moveTo(this.points[0].x, this.points[0].y);
        ctx.lineTo(this.points[1].x, this.points[1].y);
        ctx.stroke();
      } else {
        // Smooth quadratic curve through midpoints for a nice live preview
        ctx.moveTo(this.points[0].x, this.points[0].y);
        
        for (let i = 1; i < this.points.length - 1; i++) {
          const midX = (this.points[i].x + this.points[i + 1].x) / 2;
          const midY = (this.points[i].y + this.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, midX, midY);
        }

        // Draw to the last point
        const last = this.points[this.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }

      ctx.restore();
      return;
    }

    // ======================================================================
    // FINALIZED STROKE: Use perfect-freehand for beautiful pressure-
    // sensitive rendering. Only computed once when stroke is finalized.
    // ======================================================================
    const transform = ctx.getTransform();
    const scale = Math.sqrt(transform.a * transform.a + transform.b * transform.b) || 1;

    const inputPoints = [];
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      inputPoints.push({ x: p.x * scale, y: p.y * scale, pressure: p.pressure ?? 0.5 });
    }

    const outlinePoints = getStroke(inputPoints, {
      size: this.size * scale,
      thinning: 0.2,
      smoothing: 0.9,
      streamline: 0.75,
      simulatePressure: false,
      last: true, 
    });

    if (outlinePoints.length === 0) {
      ctx.restore();
      return;
    }

    ctx.fillStyle = this.isEraser ? '#000' : this.color;

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
