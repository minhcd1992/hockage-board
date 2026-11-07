import { Point } from '../types';

// Speed-adaptive low-pass ("One Euro" filter, Casiez et al. 2012), applied in
// screen pixels. Slow, careful movement gets strong smoothing (removes digitizer
// jitter and integer staircase); fast movement gets a high cutoff, so the
// along-path lag stays bounded at roughly 1 / (2π·BETA) ≈ 2 px.
const MIN_CUTOFF_HZ = 1.2;
const BETA = 0.08;
const DERIVATIVE_CUTOFF_HZ = 1;
// Pressure from pens is noisy; a short time constant removes width "bumps"
// without visibly delaying deliberate pressure changes.
const PRESSURE_TAU_S = 0.018;

const alpha = (cutoff: number, dt: number) => 1 / (1 + 1 / (2 * Math.PI * cutoff * dt));

export class InkFilter {
  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private pressure: number | undefined;
  private time = 0;
  private started = false;

  constructor(private zoom: number) {}

  /** Returns the filtered position (world coordinates) for a raw sample. */
  filter(p: Point): Point {
    const sx = p.x * this.zoom, sy = p.y * this.zoom;
    if (!this.started || p.t === undefined) {
      this.started = true;
      this.x = sx; this.y = sy; this.vx = this.vy = 0;
      this.pressure = p.pressure;
      this.time = p.t ?? 0;
      return { ...p };
    }
    // Clamp: identical timestamps would freeze the filter, long pauses would
    // otherwise produce a huge derivative spike.
    const dt = Math.min(0.05, Math.max(0.001, (p.t - this.time) / 1000));
    this.time = p.t;
    const ad = alpha(DERIVATIVE_CUTOFF_HZ, dt);
    this.vx += ad * ((sx - this.x) / dt - this.vx);
    this.vy += ad * ((sy - this.y) / dt - this.vy);
    const a = alpha(MIN_CUTOFF_HZ + BETA * Math.hypot(this.vx, this.vy), dt);
    this.x += a * (sx - this.x);
    this.y += a * (sy - this.y);
    if (p.pressure !== undefined) {
      this.pressure = this.pressure === undefined ? p.pressure
        : this.pressure + (1 - Math.exp(-dt / PRESSURE_TAU_S)) * (p.pressure - this.pressure);
    }
    return { ...p, x: this.x / this.zoom, y: this.y / this.zoom, pressure: this.pressure };
  }
}
