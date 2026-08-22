import { Point } from '../types';

export class PointerManager {
  private element: HTMLElement;
  
  isPointerDown: boolean = false;
  pendingPoints: Point[] = [];
  
  onPointerDown?: (p: Point, e: PointerEvent) => void;
  onPointerMove?: (p: Point, e: PointerEvent) => void;
  onPointerUp?: (p: Point, e: PointerEvent) => void;
  onDoubleClick?: (p: Point, e: MouseEvent) => void;

  constructor(element: HTMLElement) {
    this.element = element;
    
    // We attach to the document or window for mouseup/move to not lose tracking if moved fast outside
    this.element.addEventListener('pointerdown', this.handlePointerDown);
    this.element.addEventListener('dblclick', this.handleDoubleClick);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  destroy() {
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('dblclick', this.handleDoubleClick);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  private handlePointerDown = (e: PointerEvent) => {
    // Only primary button and middle button
    if (e.button !== 0 && e.button !== 1 && e.pointerType === 'mouse') return;
    this.isPointerDown = true;
    this.pendingPoints = [];
    const p = this.getPoint(e);
    this.pendingPoints.push(p);
    this.element.setPointerCapture(e.pointerId);
    if (this.onPointerDown) this.onPointerDown(p, e);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) {
      if (this.onPointerMove) this.onPointerMove(this.getPoint(e), e);
      return;
    }
    
    let events = [e];
    try {
      if (typeof e.getCoalescedEvents === 'function') {
        const coalesced = e.getCoalescedEvents();
        if (coalesced && coalesced.length > 0) {
          events = coalesced;
        }
      }
    } catch (err) {
      // Ignore
    }
    
    for (const ev of events) {
      const p = this.getPoint(ev as PointerEvent);
      this.pendingPoints.push(p);
    }
    
    if (this.onPointerMove) this.onPointerMove(this.getPoint(e), e);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    const p = this.getPoint(e);
    if (this.onPointerUp) this.onPointerUp(p, e);
  };

  private handleDoubleClick = (e: MouseEvent) => {
    const p = this.getPoint(e as PointerEvent); // MouseEvent can be cast safely here as we only use clientX/Y
    if (this.onDoubleClick) this.onDoubleClick(p, e);
  };

  private getPoint(e: PointerEvent): Point {
    const rect = this.element.getBoundingClientRect();
    
    // Ensure mouse always has normal pressure, and stylus doesn't report 0
    let pressure = e.pressure;
    if (e.pointerType === 'mouse' || typeof pressure !== 'number' || pressure === 0) {
      pressure = 0.5;
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY
    };
  }
}
