import { BoardObject, Point, Rect } from '../types';

// Cached canvas for text measurement
let measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx() {
  if (!measureCtx && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }
  return measureCtx;
}

export class Text extends BoardObject {
  position: Point;
  text: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  maxWidth?: number;

  constructor(position: Point, text: string, color: string, fontFamily: string, fontSize: number, maxWidth?: number) {
    super();
    this.type = 'text';
    this.position = position;
    this.text = text;
    this.color = color;
    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.maxWidth = maxWidth;
  }
  
  private getLines(ctx: CanvasRenderingContext2D): string[] {
    const lines: string[] = [];
    const paragraphs = this.text.split('\n');
    
    if (!this.maxWidth) {
      return paragraphs;
    }
    
    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let currentLine = words[0] || '';
      
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < this.maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
    }
    return lines;
  }

  _draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    if (this.selected) {
      const box = this.getBoundingBox();
      ctx.strokeStyle = 'rgba(0, 120, 215, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(box.x - 2, box.y - 2, box.w + 4, box.h + 4);
    }
    
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = 'top';
    
    const lines = this.getLines(ctx);
    lines.forEach((line, i) => {
      ctx.fillText(line, this.position.x, this.position.y + i * this.fontSize * 1.2);
    });
    
    ctx.restore();
  }

  _getBoundingBox(): Rect {
    const ctx = getMeasureCtx();
    if (!ctx) {
      // Fallback
      return { x: this.position.x, y: this.position.y, w: 100, h: 50 };
    }
    
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    const lines = this.getLines(ctx);
    
    let maxW = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxW) maxW = w;
    }
    
    const h = lines.length * this.fontSize * 1.2;
    
    return {
      x: this.position.x,
      y: this.position.y,
      w: Math.max(maxW, 10),
      h: Math.max(h, 10)
    };
  }

  _hitTest(localP: Point): boolean {
    const box = this._getBoundingBox();
    return localP.x >= box.x && localP.x <= box.x + box.w && localP.y >= box.y && localP.y <= box.y + box.h;
  }

  _translate(dx: number, dy: number): void {
    this.position.x += dx;
    this.position.y += dy;
  }

  updateCenter(): void {
    const box = this._getBoundingBox();
    this.cx = box.x + box.w / 2;
    this.cy = box.y + box.h / 2;
  }

  clone(): BoardObject {
    const t = new Text(
      { x: this.position.x, y: this.position.y },
      this.text,
      this.color,
      this.fontFamily,
      this.fontSize,
      this.maxWidth
    );
    t.copyTransforms(this);
    return t;
  }
}
