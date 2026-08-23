import { BoardObject, Rect } from '../types';
import { LabSceneConfig } from '../lab/types';
import { LabEngine } from '../lab/LabEngine';

export class LabWidget extends BoardObject {
  x: number;
  y: number;
  w: number;
  h: number;
  sceneId: string;
  engine: LabEngine;

  constructor(sceneConfig: LabSceneConfig, x: number, y: number, w: number, h: number) {
    super();
    this.type = 'lab-widget';
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.sceneId = sceneConfig.id;
    this.engine = new LabEngine(sceneConfig);
  }

  _draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw widget container
    ctx.translate(this.x, this.y);
    
    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, this.w, this.h);
    
    // Border
    if (this.selected) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
    }
    ctx.strokeRect(0, 0, this.w, this.h);

    // Title bar
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, this.w, 32);
    ctx.fillStyle = '#475569';
    ctx.font = '600 14px sans-serif';
    ctx.fillText(this.engine.config.title, 12, 21);
    ctx.strokeRect(0, 0, this.w, 32);
    
    // Clip the drawing area so physics doesn't bleed out
    ctx.beginPath();
    ctx.rect(0, 32, this.w, this.h - 32);
    ctx.clip();
    
    // Delegate to Lab Renderer
    // We adjust origin so Lab sees (0,0) at the content area
    ctx.translate(0, 32);
    this.engine.renderer.render(ctx, this.w, this.h - 32);
    
    ctx.restore();
  }

  _getBoundingBox(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  _hitTest(p: import('../types').Point): boolean {
    return p.x >= this.x && p.x <= this.x + this.w &&
           p.y >= this.y && p.y <= this.y + this.h;
  }

  _translate(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  clone(): BoardObject {
    const cloned = new LabWidget(this.engine.config, this.x + 20, this.y + 20, this.w, this.h);
    cloned.copyTransforms(this);
    return cloned;
  }

  updateCenter(): void {
    this.cx = this.x + this.w / 2;
    this.cy = this.y + this.h / 2;
  }

  onPointerDown(p: import('../types').Point): boolean {
    const labX = p.x - this.x;
    const labY = p.y - this.y - 32; // Offset for title bar
    
    // Check if within bounds of the widget content
    if (labX >= 0 && labX <= this.w && labY >= 0 && labY <= (this.h - 32)) {
      if (this.engine.handlePointerDown) {
         return this.engine.handlePointerDown(labX, labY, this.w, this.h - 32);
      }
    }
    return false;
  }

  onPointerMove(p: import('../types').Point): void {
    if (this.engine.handlePointerMove) {
       const labX = p.x - this.x;
       const labY = p.y - this.y - 32;
       this.engine.handlePointerMove(labX, labY, this.w, this.h - 32);
    }
  }

  onPointerUp(p: import('../types').Point): void {
    if (this.engine.handlePointerUp) {
       const labX = p.x - this.x;
       const labY = p.y - this.y - 32;
       this.engine.handlePointerUp(labX, labY, this.w, this.h - 32);
    }
  }
}
