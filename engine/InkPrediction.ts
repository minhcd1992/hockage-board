import { Point } from '../types';

// A tiny GPU-side backup lets us remove speculative ink without clearing or
// redrawing the full stroke, and without CPU getImageData readbacks.
export class InkPrediction {
  private backup: HTMLCanvasElement;
  private backupCtx: CanvasRenderingContext2D;
  private region: { x: number; y: number; w: number; h: number } | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private canvas: HTMLCanvasElement, private ctx: CanvasRenderingContext2D) {
    this.backup = document.createElement('canvas');
    this.backupCtx = this.backup.getContext('2d')!;
  }

  clear = () => {
    clearTimeout(this.timer);
    if (!this.region) return;
    const { x, y, w, h } = this.region;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.ctx.clip();
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'copy';
    this.ctx.drawImage(this.backup, 0, 0, w, h, x, y, w, h);
    this.ctx.restore();
    this.region = null;
  };

  draw(points: Point[], color: string, width: number, dpr: number) {
    this.clear();
    if (points.length < 2 || width <= 0) return;
    const pad = width / 2 + 2;
    const x = Math.max(0, Math.floor((Math.min(...points.map(p => p.x)) - pad) * dpr));
    const y = Math.max(0, Math.floor((Math.min(...points.map(p => p.y)) - pad) * dpr));
    const right = Math.min(this.canvas.width, Math.ceil((Math.max(...points.map(p => p.x)) + pad) * dpr));
    const bottom = Math.min(this.canvas.height, Math.ceil((Math.max(...points.map(p => p.y)) + pad) * dpr));
    const w = right - x, h = bottom - y;
    if (w <= 0 || h <= 0) return;
    if (this.backup.width < w) this.backup.width = w;
    if (this.backup.height < h) this.backup.height = h;
    this.backupCtx.globalCompositeOperation = 'copy';
    this.backupCtx.drawImage(this.canvas, x, y, w, h, 0, 0, w, h);
    this.region = { x, y, w, h };
    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
    this.ctx.restore();
    // Remove a speculative tip even when the user stops moving without lifting.
    this.timer = setTimeout(this.clear, 40);
  }
}
