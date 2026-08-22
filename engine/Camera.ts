export class Camera {
  x: number = 0;
  y: number = 0;
  zoom: number = 1;

  constructor(x: number = 0, y: number = 0, zoom: number = 1) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;
  }

  screenToWorld(screenX: number, screenY: number) {
    return {
      x: (screenX - this.x) / this.zoom,
      y: (screenY - this.y) / this.zoom
    };
  }

  worldToScreen(worldX: number, worldY: number) {
    return {
      x: worldX * this.zoom + this.x,
      y: worldY * this.zoom + this.y
    };
  }

  applyTransform(ctx: CanvasRenderingContext2D) {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.setTransform(this.zoom * dpr, 0, 0, this.zoom * dpr, this.x * dpr, this.y * dpr);
  }

  resetTransform(ctx: CanvasRenderingContext2D) {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
