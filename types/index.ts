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
  | 'laser';

export type ObjectType = 'stroke' | 'shape' | 'image' | 'text' | 'pdf' | 'lab-widget';

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
}
