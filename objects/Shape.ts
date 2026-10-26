import { BoardObject, Point, Rect, ArrowHeadType, pointInRect, rectsIntersect, segmentIntersectsRect } from '../types';

export class Shape extends BoardObject {
  start: Point;
  end: Point;
  controlPoint: Point;
  color: string;
  size: number;
  shapeType: 'line' | 'arrow' | 'rect' | 'ellipse' | 'arc' | 'sine' | 'bezier' | 'angle' | 'right-angle' | 'equal-segment';
  strokeStyleType: 'solid' | 'dashed' | 'dotted';
  isFilled: boolean;
  isEraser: boolean;
  drawingState?: string;
  sineWavelength: number;
  sineAmplitude: number;
  arrowStart: ArrowHeadType;
  arrowEnd: ArrowHeadType;
  middleArrow: boolean;

  // Geometric symbols properties
  angleType: 'single' | 'double' | 'triple' | 'tick' | 'fill';
  angleRadius: number;
  rightAngleType: 'square' | 'dot';
  rightAngleSize: number;
  equalSegmentMark: 'single' | 'double' | 'triple' | 'cross' | 'circle';
  equalSegmentDrawLine: boolean;
  equalSegmentMarkSize: number;

  constructor(
    type: 'line' | 'arrow' | 'rect' | 'ellipse' | 'arc' | 'sine' | 'bezier' | 'angle' | 'right-angle' | 'equal-segment', 
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
    middleArrow: boolean = false,
    angleType: 'single' | 'double' | 'triple' | 'tick' | 'fill' = 'single',
    angleRadius: number = 28,
    rightAngleType: 'square' | 'dot' = 'square',
    rightAngleSize: number = 18,
    equalSegmentMark: 'single' | 'double' | 'triple' | 'cross' | 'circle' = 'double',
    equalSegmentDrawLine: boolean = false,
    equalSegmentMarkSize: number = 14
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
    this.angleType = angleType;
    this.angleRadius = angleRadius;
    this.rightAngleType = rightAngleType;
    this.rightAngleSize = rightAngleSize;
    this.equalSegmentMark = equalSegmentMark;
    this.equalSegmentDrawLine = equalSegmentDrawLine;
    this.equalSegmentMarkSize = equalSegmentMarkSize;
    
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
    } else if (this.shapeType === 'angle') {
      const geom = this.getAngleGeometry();
      const { V, P1, P2, theta1, sweep, r, len1, len2 } = geom;

      if (this.drawingState === 'ray1') {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(V.x, V.y);
        ctx.lineTo(P1.x, P1.y);
        ctx.stroke();
        ctx.restore();
      } else if (this.drawingState === 'ray2') {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(V.x, V.y);
        ctx.lineTo(P1.x, P1.y);
        ctx.moveTo(V.x, V.y);
        ctx.lineTo(P2.x, P2.y);
        ctx.stroke();
        ctx.restore();
      }

      if (len1 >= 2 && len2 >= 2 && Math.abs(sweep) > 0.01) {
        const anticlockwise = sweep < 0;
        const endTheta = theta1 + sweep;

        if (this.isFilled || this.angleType === 'fill') {
          ctx.save();
          ctx.fillStyle = this.color;
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.moveTo(V.x, V.y);
          ctx.arc(V.x, V.y, r, theta1, endTheta, anticlockwise);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.beginPath();
        if (this.angleType === 'double') {
          ctx.arc(V.x, V.y, r, theta1, endTheta, anticlockwise);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(V.x, V.y, r + 6, theta1, endTheta, anticlockwise);
          ctx.stroke();
        } else if (this.angleType === 'triple') {
          ctx.arc(V.x, V.y, Math.max(12, r - 5), theta1, endTheta, anticlockwise);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(V.x, V.y, r, theta1, endTheta, anticlockwise);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(V.x, V.y, r + 5, theta1, endTheta, anticlockwise);
          ctx.stroke();
        } else {
          ctx.arc(V.x, V.y, r, theta1, endTheta, anticlockwise);
          ctx.stroke();

          if (this.angleType === 'tick') {
            const midTheta = theta1 + sweep / 2;
            const t1 = Math.max(8, r - 6);
            const t2 = r + 6;
            ctx.beginPath();
            ctx.moveTo(V.x + t1 * Math.cos(midTheta), V.y + t1 * Math.sin(midTheta));
            ctx.lineTo(V.x + t2 * Math.cos(midTheta), V.y + t2 * Math.sin(midTheta));
            ctx.stroke();
          }
        }
      }
    } else if (this.shapeType === 'right-angle') {
      const geom = this.getRightAngleGeometry();
      
      if (this.drawingState === 'ray1') {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
        ctx.restore();
      }

      if (geom) {
        const { V, pA, pB, pC, center } = geom;

        if (this.isFilled) {
          ctx.save();
          ctx.fillStyle = this.color;
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.moveTo(V.x, V.y);
          ctx.lineTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
          ctx.lineTo(pC.x, pC.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.lineTo(pC.x, pC.y);
        ctx.stroke();

        if (this.rightAngleType === 'dot') {
          ctx.beginPath();
          ctx.arc(center.x, center.y, Math.max(2, this.size * 0.8), 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
        }
      }
    } else if (this.shapeType === 'equal-segment') {
      const geom = this.getEqualSegmentGeometry();
      if (geom) {
        const { A, B, u, n, mid, h, sp } = geom;

        if (this.equalSegmentDrawLine) {
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
        }

        const mark = this.equalSegmentMark ?? 'double';

        const drawTick = (centerPt: Point) => {
          ctx.beginPath();
          ctx.moveTo(centerPt.x - h * n.x, centerPt.y - h * n.y);
          ctx.lineTo(centerPt.x + h * n.x, centerPt.y + h * n.y);
          ctx.stroke();
        };

        if (mark === 'single') {
          drawTick(mid);
        } else if (mark === 'double') {
          drawTick({ x: mid.x - (sp / 2) * u.x, y: mid.y - (sp / 2) * u.y });
          drawTick({ x: mid.x + (sp / 2) * u.x, y: mid.y + (sp / 2) * u.y });
        } else if (mark === 'triple') {
          drawTick({ x: mid.x - sp * u.x, y: mid.y - sp * u.y });
          drawTick(mid);
          drawTick({ x: mid.x + sp * u.x, y: mid.y + sp * u.y });
        } else if (mark === 'cross') {
          const d = h * 0.75;
          ctx.beginPath();
          ctx.moveTo(mid.x - d * (u.x + n.x), mid.y - d * (u.y + n.y));
          ctx.lineTo(mid.x + d * (u.x + n.x), mid.y + d * (u.y + n.y));
          ctx.moveTo(mid.x - d * (u.x - n.x), mid.y - d * (u.y - n.y));
          ctx.lineTo(mid.x + d * (u.x - n.x), mid.y + d * (u.y - n.y));
          ctx.stroke();
        } else if (mark === 'circle') {
          ctx.beginPath();
          ctx.arc(mid.x, mid.y, Math.max(2.5, this.size * 1.2), 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    // Reset dash for other drawings
    ctx.setLineDash([]);
    ctx.restore();
  }

  private static normAngle(a: number): number {
    return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }

  private isAngleOnArc(angle: number, startAngle: number, endAngle: number): boolean {
    const sweep = Shape.normAngle(startAngle - endAngle);
    const dist = Shape.normAngle(startAngle - angle);
    return dist <= sweep + 1e-9;
  }

  getAngleGeometry() {
    const V = this.start;
    const P1 = this.end;
    const P2 = this.controlPoint;
    const dx1 = P1.x - V.x;
    const dy1 = P1.y - V.y;
    const len1 = Math.hypot(dx1, dy1);
    const theta1 = Math.atan2(dy1, dx1);

    const dx2 = P2.x - V.x;
    const dy2 = P2.y - V.y;
    const len2 = Math.hypot(dx2, dy2);
    const theta2 = Math.atan2(dy2, dx2);

    let diff = theta2 - theta1;
    let sweep = ((diff % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;

    let r = this.angleRadius ?? 28;
    if (len1 > 2 && len2 > 2) {
      r = Math.min(r, Math.max(16, Math.min(len1, len2) * 0.7));
    }
    return { V, P1, P2, theta1, theta2, sweep, r, len1, len2 };
  }

  getRightAngleGeometry() {
    const V = this.start;
    const P1 = this.end;
    const P2 = this.controlPoint;
    const dx1 = P1.x - V.x;
    const dy1 = P1.y - V.y;
    const len1 = Math.hypot(dx1, dy1);
    if (len1 < 1e-4) {
      return null;
    }
    const u1 = { x: dx1 / len1, y: dy1 / len1 };
    const perpA = { x: -u1.y, y: u1.x };
    const perpB = { x: u1.y, y: -u1.x };

    const toCtrl = { x: P2.x - V.x, y: P2.y - V.y };
    const dotA = toCtrl.x * perpA.x + toCtrl.y * perpA.y;
    const dotB = toCtrl.x * perpB.x + toCtrl.y * perpB.y;
    const u2 = dotA >= dotB ? perpA : perpB;

    let s = this.rightAngleSize ?? 18;
    if (len1 > 2 && len1 < s * 1.5) {
      s = Math.max(10, len1 * 0.8);
    }

    const pA = { x: V.x + s * u1.x, y: V.y + s * u1.y };
    const pB = { x: V.x + s * (u1.x + u2.x), y: V.y + s * (u1.y + u2.y) };
    const pC = { x: V.x + s * u2.x, y: V.y + s * u2.y };
    const center = { x: V.x + 0.5 * s * (u1.x + u2.x), y: V.y + 0.5 * s * (u1.y + u2.y) };

    return { V, P1, P2, u1, u2, s, pA, pB, pC, center, len1 };
  }

  getEqualSegmentGeometry() {
    const A = this.start;
    const B = this.end;
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-4) return null;

    const u = { x: dx / len, y: dy / len };
    const n = { x: -u.y, y: u.x };
    const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    const h = (this.equalSegmentMarkSize ?? 14) / 2;
    const sp = 4;
    return { A, B, len, u, n, mid, h, sp };
  }

  private getAngleSamples(steps = 24): Point[] {
    const geom = this.getAngleGeometry();
    if (geom.len1 < 2 || geom.len2 < 2 || Math.abs(geom.sweep) < 0.01) return [this.start];
    const { V, theta1, sweep, r } = geom;
    const pts: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = theta1 + (sweep * i) / steps;
      pts.push({ x: V.x + r * Math.cos(a), y: V.y + r * Math.sin(a) });
    }
    return pts;
  }

  private getArcGeometry() {
    const cx = this.start.x;
    const cy = this.start.y;
    const dx1 = this.end.x - cx;
    const dy1 = this.end.y - cy;
    const r = Math.hypot(dx1, dy1);
    const startAngle = Math.atan2(dy1, dx1);
    const dx2 = this.controlPoint.x - cx;
    const dy2 = this.controlPoint.y - cy;
    const endAngle = Math.atan2(dy2, dx2);
    const p1 = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) };
    const p2 = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) };
    return { cx, cy, r, startAngle, endAngle, p1, p2 };
  }

  private getArrowHeadSegments(): [Point, Point][] {
    if (this.shapeType !== 'arrow') return [];
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return [];
    const angle = Math.atan2(dy, dx);
    const headLen = Math.max(10, this.size * 3);
    const segs: [Point, Point][] = [];
    const addHead = (x: number, y: number, dirAngle: number) => {
      const tip = { x, y };
      segs.push(
        [tip, { x: x - headLen * Math.cos(dirAngle - Math.PI / 6), y: y - headLen * Math.sin(dirAngle - Math.PI / 6) }],
        [tip, { x: x - headLen * Math.cos(dirAngle + Math.PI / 6), y: y - headLen * Math.sin(dirAngle + Math.PI / 6) }],
      );
    };
    if (this.arrowStart === 'arrow') addHead(this.start.x, this.start.y, angle + Math.PI);
    else if (this.arrowStart === 'inverted') addHead(this.start.x, this.start.y, angle);
    if (this.arrowEnd === 'arrow') addHead(this.end.x, this.end.y, angle);
    else if (this.arrowEnd === 'inverted') addHead(this.end.x, this.end.y, angle + Math.PI);
    if (this.middleArrow) {
      addHead((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2, angle);
    }
    return segs;
  }

  private evalBezier(t: number): Point {
    const mt = 1 - t;
    return {
      x: mt * mt * this.start.x + 2 * mt * t * this.controlPoint.x + t * t * this.end.x,
      y: mt * mt * this.start.y + 2 * mt * t * this.controlPoint.y + t * t * this.end.y,
    };
  }

  private getBezierSamples(steps = 32): Point[] {
    const pts: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      pts.push(this.evalBezier(i / steps));
    }
    return pts;
  }

  private getArcSamples(steps = 36): Point[] {
    const { cx, cy, r, startAngle, endAngle } = this.getArcGeometry();
    if (r < 1e-6) return [{ x: cx, y: cy }];
    const sweep = Shape.normAngle(startAngle - endAngle);
    const count = Math.max(4, Math.ceil((sweep / (Math.PI * 2)) * steps));
    const pts: Point[] = [];
    for (let i = 0; i <= count; i++) {
      const theta = startAngle - (sweep * i) / count;
      pts.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
    }
    return pts;
  }

  _getBoundingBox(): Rect {
    const x = Math.min(this.start.x, this.end.x);
    const y = Math.min(this.start.y, this.end.y);
    const w = Math.abs(this.end.x - this.start.x);
    const h = Math.abs(this.end.y - this.start.y);
    
    const padding = this.size / 2 + 4;
    
    if (this.shapeType === 'bezier') {
      const p0 = this.start;
      const p1 = this.controlPoint;
      const p2 = this.end;
      const pts: Point[] = [p0, p2];
      const denomX = p0.x - 2 * p1.x + p2.x;
      if (Math.abs(denomX) > 1e-9) {
        const tx = (p0.x - p1.x) / denomX;
        if (tx > 0 && tx < 1) pts.push(this.evalBezier(tx));
      }
      const denomY = p0.y - 2 * p1.y + p2.y;
      if (Math.abs(denomY) > 1e-9) {
        const ty = (p0.y - p1.y) / denomY;
        if (ty > 0 && ty < 1) pts.push(this.evalBezier(ty));
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const pt of pts) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
      return { x: minX - padding, y: minY - padding, w: (maxX - minX) + padding * 2, h: (maxY - minY) + padding * 2 };
    }
    
    if (this.shapeType === 'arc') {
      const { cx, cy, r, startAngle, endAngle, p1, p2 } = this.getArcGeometry();
      if (r < 1e-6) {
        return { x: cx - padding, y: cy - padding, w: padding * 2, h: padding * 2 };
      }
      const pts: Point[] = [p1, p2];
      const cardinals = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      for (const theta of cardinals) {
        if (this.isAngleOnArc(theta, startAngle, endAngle)) {
          pts.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
        }
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const pt of pts) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
      return {
        x: minX - padding,
        y: minY - padding,
        w: (maxX - minX) + padding * 2,
        h: (maxY - minY) + padding * 2
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

    if (this.shapeType === 'arrow') {
      const arrowPad = Math.max(padding, Math.max(10, this.size * 3) * 0.5 + 2);
      return {
        x: x - arrowPad,
        y: y - arrowPad,
        w: w + arrowPad * 2,
        h: h + arrowPad * 2
      };
    }
    
    if (this.shapeType === 'angle') {
      const geom = this.getAngleGeometry();
      const pts: Point[] = [this.start];
      if (geom.len1 >= 2 && geom.len2 >= 2 && Math.abs(geom.sweep) > 0.01) {
        const { V, theta1, sweep, r } = geom;
        const steps = 16;
        for (let i = 0; i <= steps; i++) {
          const a = theta1 + (sweep * i) / steps;
          pts.push({ x: V.x + r * Math.cos(a), y: V.y + r * Math.sin(a) });
          if (this.angleType === 'double' || this.angleType === 'triple') {
            pts.push({ x: V.x + (r + 6) * Math.cos(a), y: V.y + (r + 6) * Math.sin(a) });
          }
        }
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const pt of pts) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
      return { x: minX - padding, y: minY - padding, w: maxX - minX + padding * 2, h: maxY - minY + padding * 2 };
    }

    if (this.shapeType === 'right-angle') {
      const geom = this.getRightAngleGeometry();
      if (!geom) {
        return { x: this.start.x - padding, y: this.start.y - padding, w: padding * 2, h: padding * 2 };
      }
      const pts: Point[] = [geom.V, geom.pA, geom.pB, geom.pC];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const pt of pts) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
      return { x: minX - padding, y: minY - padding, w: maxX - minX + padding * 2, h: maxY - minY + padding * 2 };
    }

    if (this.shapeType === 'equal-segment') {
      const geom = this.getEqualSegmentGeometry();
      if (!geom) {
        return { x: this.start.x - padding, y: this.start.y - padding, w: padding * 2, h: padding * 2 };
      }
      const { A, B, mid, n, h } = geom;
      const pts: Point[] = [
        A, B,
        { x: mid.x - h * n.x, y: mid.y - h * n.y },
        { x: mid.x + h * n.x, y: mid.y + h * n.y }
      ];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const pt of pts) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
      return { x: minX - padding, y: minY - padding, w: maxX - minX + padding * 2, h: maxY - minY + padding * 2 };
    }
    
    return {
      x: x - padding,
      y: y - padding,
      w: w + padding * 2,
      h: h + padding * 2
    };
  }

  _hitTest(p: Point): boolean {
    const threshold = Math.max(this.size / 2 + 6, 8);
    const thresholdSq = threshold * threshold;
    
    if (this.shapeType === 'line') {
      return this.distToSegmentSquared(p, this.start, this.end) <= thresholdSq;
    } else if (this.shapeType === 'arrow') {
      if (this.distToSegmentSquared(p, this.start, this.end) <= thresholdSq) return true;
      for (const [a, b] of this.getArrowHeadSegments()) {
        if (this.distToSegmentSquared(p, a, b) <= thresholdSq) return true;
      }
      return false;
    } else if (this.shapeType === 'rect') {
      const x = Math.min(this.start.x, this.end.x);
      const y = Math.min(this.start.y, this.end.y);
      const w = Math.abs(this.end.x - this.start.x);
      const h = Math.abs(this.end.y - this.start.y);
      
      if (this.isFilled || this.isEraser) {
        return (
          p.x >= x - threshold &&
          p.x <= x + w + threshold &&
          p.y >= y - threshold &&
          p.y <= y + h + threshold
        );
      }

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
      
      if (rx < 1 || ry < 1) {
        return this.distToSegmentSquared(p, this.start, this.end) <= thresholdSq;
      }
      
      const dx = p.x - cx;
      const dy = p.y - cy;
      const outerRx = rx + threshold;
      const outerRy = ry + threshold;
      if ((dx * dx) / (outerRx * outerRx) + (dy * dy) / (outerRy * outerRy) > 1) {
        return false;
      }
      if (this.isFilled) return true;

      const innerRx = Math.max(0, rx - threshold);
      const innerRy = Math.max(0, ry - threshold);
      if (innerRx === 0 || innerRy === 0) return true;
      return (dx * dx) / (innerRx * innerRx) + (dy * dy) / (innerRy * innerRy) >= 1;
    } else if (this.shapeType === 'arc') {
      const { cx, cy, r, startAngle, endAngle, p1, p2 } = this.getArcGeometry();
      if (r < 1e-6) {
        return (p.x - cx) ** 2 + (p.y - cy) ** 2 <= thresholdSq;
      }
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.hypot(dx, dy);
      const theta = Math.atan2(dy, dx);
      if (this.isAngleOnArc(theta, startAngle, endAngle)) {
        if (Math.abs(d - r) <= threshold) return true;
        if (this.isFilled && d <= r) {
          const sweep = Shape.normAngle(startAngle - endAngle);
          const midAngle = startAngle - sweep / 2;
          const midPt = { x: cx + r * Math.cos(midAngle), y: cy + r * Math.sin(midAngle) };
          const crossP = (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x);
          const crossMid = (p2.x - p1.x) * (midPt.y - p1.y) - (p2.y - p1.y) * (midPt.x - p1.x);
          if (crossP * crossMid >= 0) return true;
        }
        return false;
      }
      const d1Sq = (p.x - p1.x) ** 2 + (p.y - p1.y) ** 2;
      const d2Sq = (p.x - p2.x) ** 2 + (p.y - p2.y) ** 2;
      return Math.min(d1Sq, d2Sq) <= thresholdSq;
    } else if (this.shapeType === 'bezier') {
      const pts = this.getBezierSamples(32);
      for (let i = 0; i < pts.length - 1; i++) {
        if (this.distToSegmentSquared(p, pts[i], pts[i + 1]) <= thresholdSq) return true;
      }
      if (this.isFilled && this.pointInPolygon(p, pts)) return true;
      return false;
    } else if (this.shapeType === 'sine') {
      const dx = this.end.x - this.start.x;
      const dy = this.end.y - this.start.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1e-6) {
        return (p.x - this.start.x) ** 2 + (p.y - this.start.y) ** 2 <= thresholdSq;
      }
      const angle = Math.atan2(dy, dx);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const px = p.x - this.start.x;
      const py = p.y - this.start.y;
      const lx = px * cos + py * sin;
      const ly = -px * sin + py * cos;

      const amplitude = this.sineAmplitude ?? 20;
      const wavelength = Math.max(1, this.sineWavelength ?? 50);
      if (lx < -threshold || lx > dist + threshold || Math.abs(ly) > Math.abs(amplitude) + threshold) {
        return false;
      }
      const localP = { x: lx, y: ly };
      const startX = Math.max(0, Math.floor((lx - threshold - 4) / 2) * 2);
      const endX = Math.min(dist, Math.ceil((lx + threshold + 4) / 2) * 2);
      let prev: Point = {
        x: startX,
        y: Math.sin((startX / wavelength) * Math.PI * 2) * amplitude,
      };
      for (let x = startX + 2; x <= endX + 1.999; x += 2) {
        const clampedX = Math.min(x, dist);
        const curr: Point = {
          x: clampedX,
          y: Math.sin((clampedX / wavelength) * Math.PI * 2) * amplitude,
        };
        if (this.distToSegmentSquared(localP, prev, curr) <= thresholdSq) return true;
        prev = curr;
        if (clampedX >= dist) break;
      }
      return false;
    } else if (this.shapeType === 'equal-segment') {
      if (this.equalSegmentDrawLine && this.distToSegmentSquared(p, this.start, this.end) <= thresholdSq) return true;
      const geom = this.getEqualSegmentGeometry();
      if (geom) {
        const { mid, n, h, u, sp } = geom;
        const mark = this.equalSegmentMark ?? 'double';
        const hitTick = (center: Point) => {
          const tA = { x: center.x - h * n.x, y: center.y - h * n.y };
          const tB = { x: center.x + h * n.x, y: center.y + h * n.y };
          return this.distToSegmentSquared(p, tA, tB) <= thresholdSq;
        };
        if (mark === 'single' && hitTick(mid)) return true;
        if (mark === 'double') {
          if (hitTick({ x: mid.x - (sp / 2) * u.x, y: mid.y - (sp / 2) * u.y })) return true;
          if (hitTick({ x: mid.x + (sp / 2) * u.x, y: mid.y + (sp / 2) * u.y })) return true;
        }
        if (mark === 'triple') {
          if (hitTick({ x: mid.x - sp * u.x, y: mid.y - sp * u.y })) return true;
          if (hitTick(mid)) return true;
          if (hitTick({ x: mid.x + sp * u.x, y: mid.y + sp * u.y })) return true;
        }
        if (mark === 'cross' || mark === 'circle') {
          if (Math.hypot(p.x - mid.x, p.y - mid.y) <= Math.max(h + 4, threshold)) return true;
        }
        if (this.distToSegmentSquared(p, this.start, this.end) <= thresholdSq) return true;
      }
      return false;
    } else if (this.shapeType === 'right-angle') {
      const geom = this.getRightAngleGeometry();
      if (!geom) return false;
      const { V, pA, pB, pC } = geom;
      if (this.distToSegmentSquared(p, pA, pB) <= thresholdSq) return true;
      if (this.distToSegmentSquared(p, pB, pC) <= thresholdSq) return true;
      if (this.isFilled) {
        if (this.pointInPolygon(p, [V, pA, pB, pC])) return true;
      }
      return false;
    } else if (this.shapeType === 'angle') {
      const geom = this.getAngleGeometry();
      if (geom.len1 < 2 || geom.len2 < 2) return false;
      const { V, theta1, sweep, r } = geom;
      const dist = Math.hypot(p.x - V.x, p.y - V.y);
      const angle = Math.atan2(p.y - V.y, p.x - V.x);
      let angleDiff = angle - theta1;
      let normSweep = ((angleDiff % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      const onSweep = sweep > 0 ? (normSweep >= -0.15 && normSweep <= sweep + 0.15) : (normSweep <= 0.15 && normSweep >= sweep - 0.15);
      if (onSweep) {
        if (Math.abs(dist - r) <= threshold + 4) return true;
        if ((this.angleType === 'double' || this.angleType === 'triple') && Math.abs(dist - (r + 6)) <= threshold + 4) return true;
        if ((this.isFilled || this.angleType === 'fill') && dist <= r) return true;
      }
      return false;
    }
    
    return false;
  }

  override intersectsRect(rect: Rect): boolean {
    if (!rectsIntersect(this.getBoundingBox(), rect)) return false;
    const scale = Math.max(Math.abs(this.scaleX), Math.abs(this.scaleY));
    const pad = (this.size / 2 + 2) * scale;
    const expanded: Rect = {
      x: rect.x - pad,
      y: rect.y - pad,
      w: rect.w + pad * 2,
      h: rect.h + pad * 2,
    };

    const checkSegments = (segs: [Point, Point][]) => {
      for (const [a, b] of segs) {
        if (segmentIntersectsRect(this.transformPoint(a), this.transformPoint(b), expanded)) {
          return true;
        }
      }
      return false;
    };

    const checkPolyline = (pts: Point[]) => {
      if (pts.length === 1) return pointInRect(this.transformPoint(pts[0]), expanded);
      for (let i = 0; i < pts.length - 1; i++) {
        if (segmentIntersectsRect(this.transformPoint(pts[i]), this.transformPoint(pts[i + 1]), expanded)) {
          return true;
        }
      }
      return false;
    };

    if (this.shapeType === 'line') {
      return checkSegments([[this.start, this.end]]);
    } else if (this.shapeType === 'arrow') {
      return checkSegments([[this.start, this.end], ...this.getArrowHeadSegments()]);
    } else if (this.shapeType === 'rect') {
      const x = Math.min(this.start.x, this.end.x);
      const y = Math.min(this.start.y, this.end.y);
      const w = Math.abs(this.end.x - this.start.x);
      const h = Math.abs(this.end.y - this.start.y);
      const pts = [
        { x, y }, { x: x + w, y },
        { x: x + w, y: y + h }, { x, y: y + h }, { x, y }
      ];
      if (checkPolyline(pts)) return true;
      if (this.isFilled || this.isEraser) {
        return this.hitTest({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
      }
      return false;
    } else if (this.shapeType === 'ellipse') {
      const x = Math.min(this.start.x, this.end.x);
      const y = Math.min(this.start.y, this.end.y);
      const rx = Math.abs(this.end.x - this.start.x) / 2;
      const ry = Math.abs(this.end.y - this.start.y) / 2;
      const cx = x + rx;
      const cy = y + ry;
      const pts: Point[] = [];
      const steps = 36;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        pts.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
      }
      if (checkPolyline(pts)) return true;
      if (this.isFilled) {
        return this.hitTest({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
      }
      return false;
    } else if (this.shapeType === 'arc') {
      if (checkPolyline(this.getArcSamples(36))) return true;
      if (this.isFilled) {
        return this.hitTest({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
      }
      return false;
    } else if (this.shapeType === 'bezier') {
      if (checkPolyline(this.getBezierSamples(32))) return true;
      if (this.isFilled) {
        return this.hitTest({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
      }
      return false;
    } else if (this.shapeType === 'sine') {
      const dx = this.end.x - this.start.x;
      const dy = this.end.y - this.start.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1e-6) return pointInRect(this.transformPoint(this.start), expanded);
      const angle = Math.atan2(dy, dx);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const amplitude = this.sineAmplitude ?? 20;
      const wavelength = Math.max(1, this.sineWavelength ?? 50);
      const pts: Point[] = [];
      for (let x = 0; x <= dist; x += 2) {
        const y = Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
        pts.push({
          x: this.start.x + x * cos - y * sin,
          y: this.start.y + x * sin + y * cos,
        });
      }
      return checkPolyline(pts);
    } else if (this.shapeType === 'equal-segment') {
      const geom = this.getEqualSegmentGeometry();
      if (!geom) return false;
      const { A, B, mid, n, h, u, sp } = geom;
      const segs: [Point, Point][] = [];
      if (this.equalSegmentDrawLine) segs.push([A, B]);
      const mark = this.equalSegmentMark ?? 'double';
      const addTick = (center: Point) => {
        segs.push([{ x: center.x - h * n.x, y: center.y - h * n.y }, { x: center.x + h * n.x, y: center.y + h * n.y }]);
      };
      if (mark === 'single') addTick(mid);
      else if (mark === 'double') {
        addTick({ x: mid.x - (sp / 2) * u.x, y: mid.y - (sp / 2) * u.y });
        addTick({ x: mid.x + (sp / 2) * u.x, y: mid.y + (sp / 2) * u.y });
      } else if (mark === 'triple') {
        addTick({ x: mid.x - sp * u.x, y: mid.y - sp * u.y });
        addTick(mid);
        addTick({ x: mid.x + sp * u.x, y: mid.y + sp * u.y });
      } else if (mark === 'cross') {
        const d = h * 0.75;
        segs.push([
          { x: mid.x - d * (u.x + n.x), y: mid.y - d * (u.y + n.y) },
          { x: mid.x + d * (u.x + n.x), y: mid.y + d * (u.y + n.y) }
        ], [
          { x: mid.x - d * (u.x - n.x), y: mid.y - d * (u.y - n.y) },
          { x: mid.x + d * (u.x - n.x), y: mid.y + d * (u.y - n.y) }
        ]);
      } else if (mark === 'circle') {
        if (pointInRect(this.transformPoint(mid), expanded)) return true;
      }
      segs.push([A, B]);
      return checkSegments(segs);
    } else if (this.shapeType === 'right-angle') {
      const geom = this.getRightAngleGeometry();
      if (!geom) return false;
      const { pA, pB, pC } = geom;
      if (checkSegments([[pA, pB], [pB, pC]])) return true;
      if (this.isFilled) {
        return this.hitTest({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
      }
      return false;
    } else if (this.shapeType === 'angle') {
      const samples = this.getAngleSamples(24);
      if (checkPolyline(samples)) return true;
      if (this.isFilled || this.angleType === 'fill') {
        return this.hitTest({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
      }
      return false;
    }

    return false;
  }

  private pointInPolygon(p: Point, vs: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i].x, yi = vs[i].y;
      const xj = vs[j].x, yj = vs[j].y;
      const intersect = ((yi > p.y) !== (yj > p.y)) &&
        (p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
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
    const s = new Shape(
      this.shapeType, this.start, this.color, this.size, this.strokeStyleType, this.isFilled, this.isEraser,
      this.sineWavelength, this.sineAmplitude, this.arrowStart, this.arrowEnd, this.middleArrow,
      this.angleType, this.angleRadius, this.rightAngleType, this.rightAngleSize,
      this.equalSegmentMark, this.equalSegmentDrawLine, this.equalSegmentMarkSize
    );
    s.start = { ...this.start };
    s.end = { ...this.end };
    s.controlPoint = { ...this.controlPoint };
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
