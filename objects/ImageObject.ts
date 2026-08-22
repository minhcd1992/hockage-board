import { BoardObject, Point, Rect } from '../types';

export class ImageObject extends BoardObject {
  imgData: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement | null = null;
  pageIndex?: number;

  constructor(imgData: string, x: number, y: number, width: number, height: number, pageIndex?: number) {
    super();
    this.type = 'image';
    this.imgData = imgData;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.pageIndex = pageIndex;

    this.image = new Image();
    this.image.src = imgData;
  }

  _draw(ctx: CanvasRenderingContext2D) {
    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  _getBoundingBox(): Rect {
    return {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    };
  }

  _hitTest(p: Point): boolean {
    return p.x >= this.x && p.x <= this.x + this.width &&
           p.y >= this.y && p.y <= this.y + this.height;
  }

  _translate(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  updateCenter(): void {
    const box = this._getBoundingBox();
    this.cx = box.x + box.w / 2;
    this.cy = box.y + box.h / 2;
  }

  clone(): BoardObject {
    const s = new ImageObject(this.imgData, this.x, this.y, this.width, this.height, this.pageIndex);
    s.copyTransforms(this);
    return s;
  }
}
