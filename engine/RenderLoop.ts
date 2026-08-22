export class RenderLoop {
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private callbacks: Set<(dt: number) => void> = new Set();
  private lastTime: number = 0;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  addCallback(cb: (dt: number) => void) {
    this.callbacks.add(cb);
  }

  removeCallback(cb: (dt: number) => void) {
    this.callbacks.delete(cb);
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const dt = currentTime - this.lastTime;
    this.lastTime = currentTime;

    for (const cb of this.callbacks) {
      cb(dt);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
