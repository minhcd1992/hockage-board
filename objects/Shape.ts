import { BoardObject, Point, Rect, ArrowHeadType } from '../types';

export class Shape extends BoardObject {
  start: Point;
  end: Point;
  controlPoint: Point;
  color: string;
  size: number;
  shapeType: 'line' | 'arrow' | 'rect' | 'ellipse' | 'arc' | 'sine' | 'bezier';
  strokeStyleType: 'solid' | 'dashed' | 'dotted';
  isFilled: boolean;
  isEraser: boolean;
  drawingState?: string;
  sineWavelength: number;
  sineAmplitude: number;
  arrowStart: ArrowHeadType;
  arrowEnd: ArrowHeadType;
  middleArrow: boolean;



  constructor(
    type: 'line' | 'arrow' | 'rect' | 'ellipse' | 'arc' | 'sine' | 'bezier', 
    start: Point, 
    color: string, 
    size: number,
    strokeStyleType: 'solid' | 'dashed' | 'dotted' = 'solid',
    isFilled: boolean = false,
    isEraser: boolean = false,
    sineWavelength: number = 50,
    sineAmplitude: number = 20,
    arrowStart: ArrowHeadType = 'none',
    arrowEnd: ArrowHeadType = 'arrow',
    middleArrow: boolean = false
  ) {
    super();
    this.type = 'shape';
    this.shapeType = type;
    this.start = { ...start };
    this.end = { ...start };
    this.controlPoint = { ...start };
    this.color = color;
    this.size = size;
    this.strokeStyleType = strokeStyleType;
    this.isFilled = isFilled;
    this.isEraser = isEraser;
    this.sineWavelength = sineWavelength;
    this.sineAmplitude = sineAmplitude;
    
    // Default config for arrows
    if (type === 'arrow') {
       this.arrowStart = arrowStart;
       this.arrowEnd = arrowEnd;
       this.middleArrow = middleArrow;
    } else {
       this.arrowStart = 'none';
       this.arrowEnd = 'none';
       this.middleArrow = false;
    }
  }

  _draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    if (this.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = this.isEraser ? '#000' : this.selected ? '#3b82f6' : this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.selected) {
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 4;
    }

    ctx.beginPath();
    
    // Apply stroke style
    if (this.strokeStyleType === 'dashed') {
      ctx.setLineDash([this.size * 3, this.size * 3]);
    } else if (this.strokeStyleType === 'dotted') {
      ctx.setLineDash([this.size, this.size * 2]);
    } else {
      ctx.setLineDash([]);
    }

    if (this.shapeType === 'line') {
      ctx.moveTo(this.start.x, this.start.y);
      ctx.lineTo(this.end.x, this.end.y);
      ctx.stroke();
    } else if (this.shapeType === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(this.start.x, this.start.y);
      ctx.lineTo(this.end.x, this.end.y);
      ctx.stroke();
      
      const dx = this.end.x - this.start.x;
      const dy = this.end.y - this.start.y;
      
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const angle = Math.atan2(dy, dx);
        const headLen = Math.max(10, this.size * 3);
        
        const drawArrowHead = (x: number, y: number, dirAngle: number) => {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - headLen * Math.cos(dirAngle - Math.PI / 6), y - headLen * Math.sin(dirAngle - Math.PI / 6));
          ctx.moveTo(x, y);
          ctx.lineTo(x - headLen * Math.cos(dirAngle + Math.PI / 6), y - headLen * Math.sin(dirAngle + Math.PI / 6));
          ctx.stroke();
        };

        // Draw start arrow
        if (this.arrowStart === 'arrow') {
           drawArrowHead(this.start.x, this.start.y, angle + Math.PI);
        } else if (this.arrowStart === 'inverted') {
           drawArrowHead(this.start.x, this.start.y, angle);
        }
        
        // Draw end arrow
        if (this.arrowEnd === 'arrow') {
           drawArrowHead(this.end.x, this.end.y, angle);
        } else if (this.arrowEnd === 'inverted') {
           drawArrowHead(this.end.x, this.end.y, angle + Math.PI);
        }
        
        // Draw middle arrow
        if (this.middleArrow) {
           const midX = (this.start.x + this.end.x) / 2;
           const midY = (this.start.y + this.end.y) / 2;
           drawArrowHead(midX, midY, angle);
        }
      }
    } else if (this.shapeType === 'rect') {
      const x = Math.min(this.start.x, this.end.x);
      const y = Math.min(this.start.y, this.end.y);
      const w = Math.abs(this.end.x - this.start.x);
      const h = Math.abs(this.end.y - this.start.y);
      ctx.rect(x, y, w, h);
      
      if (this.isEraser) {
        ctx.fillStyle = '#000';
        ctx.fill();
      } else if (this.isFilled) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3; // Semi-transparent fill
        ctx.fill();
        ctx.restore();
      }
      
      if (!this.isEraser) {
        ctx.stroke();
      }
    } else if (this.shapeType === 'ellipse') {
      const x = Math.min(this.start.x, this.end.x);
      const y = Math.min(this.start.y, this.end.y);
      const w = Math.abs(this.end.x - this.start.x);
      const h = Math.abs(this.end.y - this.start.y);
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2 * Math.PI);
      
      if (this.isFilled) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3; // Semi-transparent fill
        ctx.fill();
        ctx.restore();
      }
      ctx.stroke();
    } else if (this.shapeType === 'arc') {
      const cx = this.start.x;
      const cy = this.start.y;
      
      if (this.drawingState === 'radius' || this.drawingState === 'angle') {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
        ctx.restore();
      }
      
      if (this.drawingState !== 'radius') {
        const dx1 = this.end.x - cx;
        const dy1 = this.end.y - cy;
        const r = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const startAngle = Math.atan2(dy1, dx1);
        
        const dx2 = this.controlPoint.x - cx;
        const dy2 = this.controlPoint.y - cy;
        const endAngle = Math.atan2(dy2, dx2);
        
        // Luôn vẽ ngược chiều kim đồng hồ (counterclockwise = true)
        ctx.arc(cx, cy, r, startAngle, endAngle, true);
        
        if (this.isFilled) {
          ctx.save();
          ctx.fillStyle = this.color;
          ctx.globalAlpha = 0.3;
          ctx.fill();
          ctx.restore();
        }
        ctx.stroke();
      }
    } else if (this.shapeType === 'sine') {
      const dx = this.end.x - this.start.x;
      const dy = this.end.y - this.start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      ctx.translate(this.start.x, this.start.y);
      ctx.rotate(angle);
      
      const amplitude = this.sineAmplitude ?? 20;
      const wavelength = this.sineWavelength ?? 50;
      const periods = dist / wavelength;
      
      ctx.moveTo(0, 0);
      for (let x = 0; x <= dist; x += 2) {
         const y = Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
         ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (this.shapeType === 'bezier') {
      ctx.moveTo(this.start.x, this.start.y);
      ctx.quadraticCurveTo(this.controlPoint.x, this.controlPoint.y, this.end.x, this.end.y);
      if (this.isFilled) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.restore();
      }
      ctx.stroke();
    }

    // Reset dash for other drawings
    ctx.setLineDash([]);
    ctx.restore();


  }

  _getBoundingBox(): Rect {
    const x = Math.min(this.start.x, this.end.x);
    const y = Math.min(this.start.y, this.end.y);
    const w = Math.abs(this.end.x - this.start.x);
    const h = Math.abs(this.end.y - this.start.y);
    
    const padding = Math.max(10, this.size * 3);
    
    if (this.shapeType === 'bezier') {
      const x = Math.min(this.start.x, this.end.x, this.controlPoint.x);
      const y = Math.min(this.start.y, this.end.y, this.controlPoint.y);
      const w = Math.max(this.start.x, this.end.x, this.controlPoint.x) - x;
      const h = Math.max(this.start.y, this.end.y, this.controlPoint.y) - y;
      return { x: x - padding, y: y - padding, w: w + padding * 2, h: h + padding * 2 };
    }
    
    if (this.shapeType === 'arc') {
      const r = Math.sqrt((this.end.x - this.start.x)**2 + (this.end.y - this.start.y)**2);
      return {
        x: this.start.x - r - padding,
        y: this.start.y - r - padding,
        w: r * 2 + padding * 2,
        h: r * 2 + padding * 2
      };
    }
    
    if (this.shapeType === 'sine') {
      const dx = this.end.x - this.start.x;
      const dy = this.end.y - this.start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const amplitude = this.sineAmplitude ?? 20;
      
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const p1x = this.start.x + (0) * cos - (-amplitude) * sin;
      const p1y = this.start.y + (0) * sin + (-amplitude) * cos;
      
      const p2x = this.start.x + (dist) * cos - (-amplitude) * sin;
      const p2y = this.start.y + (dist) * sin + (-amplitude) * cos;
      
      const p3x = this.start.x + (dist) * cos - (amplitude) * sin;
      const p3y = this.start.y + (dist) * sin + (amplitude) * cos;
      
      const p4x = this.start.x + (0) * cos - (amplitude) * sin;
      const p4y = this.start.y + (0) * sin + (amplitude) * cos;
      
      const minX = Math.min(p1x, p2x, p3x, p4x);
      const minY = Math.min(p1y, p2y, p3y, p4y);
      const maxX = Math.max(p1x, p2x, p3x, p4x);
      const maxY = Math.max(p1y, p2y, p3y, p4y);
      
      return {
        x: minX - padding,
        y: minY - padding,
        w: maxX - minX + padding * 2,
        h: maxY - minY + padding * 2
      };
    }
    
    return {
      x: x - padding,
      y: y - padding,
      w: w + padding * 2,
      h: h + padding * 2
    };
  }

  _hitTest(p: Point): boolean {
    const thresholdSq = Math.pow(this.size / 2 + 5, 2);
    
    if (this.shapeType === 'line' || this.shapeType === 'arrow') {
      return this.distToSegmentSquared(p, this.start, this.end) <= thresholdSq;
    } else if (this.shapeType === 'rect') {
      const x = Math.min(this.start.x, this.end.x);
      const y = Math.min(this.start.y, this.end.y);
      const w = Math.abs(this.end.x - this.start.x);
      const h = Math.abs(this.end.y - this.start.y);
      
      const pts = [
        { x, y }, { x: x + w, y },
        { x: x + w, y: y + h }, { x, y: y + h }
      ];
      for (let i = 0; i < 4; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % 4];
        if (this.distToSegmentSquared(p, p1, p2) <= thresholdSq) return true;
      }
      return false;
    } else if (this.shapeType === 'ellipse') {
      const x = Math.min(this.start.x, this.end.x);
      const y = Math.min(this.start.y, this.end.y);
      const rx = Math.abs(this.end.x - this.start.x) / 2;
      const ry = Math.abs(this.end.y - this.start.y) / 2;
      const cx = x + rx;
      const cy = y + ry;
      
      if (rx === 0 || ry === 0) return false;
      
      const dx = p.x - cx;
      const dy = p.y - cy;
      const val = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      return val >= 0.7 && val <= 1.3;
    } else if (this.shapeType === 'arc' || this.shapeType === 'sine' || this.shapeType === 'bezier') {
      // Approximation for hit test on curves
      const box = this._getBoundingBox();
      return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
    }
    
    return false;
  }

  _translate(dx: number, dy: number): void {
    this.start.x += dx;
    this.start.y += dy;
    this.end.x += dx;
    this.end.y += dy;
    this.controlPoint.x += dx;
    this.controlPoint.y += dy;
  }

  updateCenter(): void {
    const box = this._getBoundingBox();
    this.cx = box.x + box.w / 2;
    this.cy = box.y + box.h / 2;
  }

  clone(): BoardObject {
    const s = new Shape(this.shapeType, this.start, this.color, this.size, this.strokeStyleType, this.isFilled, this.isEraser, this.sineWavelength, this.sineAmplitude, this.arrowStart, this.arrowEnd, this.middleArrow);
    s.start = { ...this.start };
    s.end = { ...this.end };
    s.controlPoint = { ...this.controlPoint };
    s.isPhysicsObject = this.isPhysicsObject;
    s.isStatic = this.isStatic;
    s.physicsMass = this.physicsMass;
    s.physicsVelocityX = this.physicsVelocityX;
    s.physicsVelocityY = this.physicsVelocityY;
    s.physicsAccelerationX = this.physicsAccelerationX;
    s.physicsAccelerationY = this.physicsAccelerationY;
    s.copyTransforms(this);
    return s;
  }

  private distToSegmentSquared(p: Point, v: Point, w: Point) {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
  }
}
