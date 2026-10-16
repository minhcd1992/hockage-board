export type ToolType =  
  | 'select-object' 
  | 'hand'
  | 'pen' 
  | 'highlighter' 
  | 'eraser-object' 
  | 'eraser-stroke' 
  | 'line' 
  | 'arrow' 
  | 'rect' 
  | 'ellipse'
  | 'arc'
  | 'sine'
  | 'bezier'
  | 'text'
  | 'laser'
  | 'snip';

export type ObjectType = 'stroke' | 'shape' | 'image' | 'text' | 'pdf';

export type ArrowHeadType = 'none' | 'arrow' | 'inverted';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  tiltX?: number;
  tiltY?: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AppState {
  tool: ToolType;
  strokeColor: string;
  size: number;
  zoom: number;
  panX: number;
  panY: number;
  dpr: number;
}

export interface Workspace {
  id: string;
  name: string;
  objects: BoardObject[];
}

export function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}

function ccw(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

export function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = ccw(a, b, c);
  const d2 = ccw(a, b, d);
  const d3 = ccw(c, d, a);
  const d4 = ccw(c, d, b);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  const onSeg = (p: Point, q: Point, r: Point) =>
    r.x >= Math.min(p.x, q.x) - 1e-9 && r.x <= Math.max(p.x, q.x) + 1e-9 &&
    r.y >= Math.min(p.y, q.y) - 1e-9 && r.y <= Math.max(p.y, q.y) + 1e-9;
  if (Math.abs(d1) <= 1e-9 && onSeg(a, b, c)) return true;
  if (Math.abs(d2) <= 1e-9 && onSeg(a, b, d)) return true;
  if (Math.abs(d3) <= 1e-9 && onSeg(c, d, a)) return true;
  if (Math.abs(d4) <= 1e-9 && onSeg(c, d, b)) return true;
  return false;
}

export function segmentIntersectsRect(p1: Point, p2: Point, r: Rect): boolean {
  if (pointInRect(p1, r) || pointInRect(p2, r)) return true;
  if (
    Math.max(p1.x, p2.x) < r.x ||
    Math.min(p1.x, p2.x) > r.x + r.w ||
    Math.max(p1.y, p2.y) < r.y ||
    Math.min(p1.y, p2.y) > r.y + r.h
  ) {
    return false;
  }
  const tl = { x: r.x, y: r.y };
  const tr = { x: r.x + r.w, y: r.y };
  const br = { x: r.x + r.w, y: r.y + r.h };
  const bl = { x: r.x, y: r.y + r.h };
  return (
    segmentsIntersect(p1, p2, tl, tr) ||
    segmentsIntersect(p1, p2, tr, br) ||
    segmentsIntersect(p1, p2, br, bl) ||
    segmentsIntersect(p1, p2, bl, tl)
  );
}

export abstract class BoardObject {
  id: string;
  type: string;
  selected: boolean;
  locked: boolean;

  cx: number = 0;
  cy: number = 0;
  rotation: number = 0;
  scaleX: number = 1;
  scaleY: number = 1;
  
  constructor() {
    this.id = crypto.randomUUID();
    this.type = 'base';
    this.selected = false;
    this.locked = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.translate(-this.cx, -this.cy);
    
    this._draw(ctx);
    
    ctx.restore();
  }
  
  hitTest(p: Point): boolean {
    const localP = this.inverseTransformPoint(p);
    return this._hitTest(localP);
  }

  intersectsRect(rect: Rect): boolean {
    return rectsIntersect(this.getBoundingBox(), rect);
  }

  getBoundingBox(): Rect {
    const local = this._getBoundingBox();
    const pts = [
      { x: local.x, y: local.y },
      { x: local.x + local.w, y: local.y },
      { x: local.x + local.w, y: local.y + local.h },
      { x: local.x, y: local.y + local.h }
    ];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pt of pts) {
       const globalP = this.transformPoint({ x: pt.x, y: pt.y });
       if (globalP.x < minX) minX = globalP.x;
       if (globalP.y < minY) minY = globalP.y;
       if (globalP.x > maxX) maxX = globalP.x;
       if (globalP.y > maxY) maxY = globalP.y;
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  translate(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
    this._translate(dx, dy);
  }

  transformPoint(p: Point): Point {
     let x = p.x - this.cx;
     let y = p.y - this.cy;
     x *= this.scaleX;
     y *= this.scaleY;
     const cos = Math.cos(this.rotation);
     const sin = Math.sin(this.rotation);
     const rx = x * cos - y * sin;
     const ry = x * sin + y * cos;
     return { x: rx + this.cx, y: ry + this.cy, pressure: p.pressure };
  }

  inverseTransformPoint(p: Point): Point {
     let x = p.x - this.cx;
     let y = p.y - this.cy;
     const cos = Math.cos(-this.rotation);
     const sin = Math.sin(-this.rotation);
     const rx = x * cos - y * sin;
     const ry = x * sin + y * cos;
     const sx = rx / this.scaleX;
     const sy = ry / this.scaleY;
     return { x: sx + this.cx, y: sy + this.cy, pressure: p.pressure };
  }

  copyTransforms(other: BoardObject) {
    this.cx = other.cx;
    this.cy = other.cy;
    this.rotation = other.rotation;
    this.scaleX = other.scaleX;
    this.scaleY = other.scaleY;
  }

  abstract _draw(ctx: CanvasRenderingContext2D): void;
  abstract _getBoundingBox(): Rect;
  abstract _hitTest(p: Point): boolean;
  abstract _translate(dx: number, dy: number): void;
  abstract clone(): BoardObject;
  abstract updateCenter(): void;

  // Optional interaction hooks
  onPointerDown?(p: Point): boolean;
  onPointerMove?(p: Point): void;
  onPointerUp?(p: Point): void;
}
