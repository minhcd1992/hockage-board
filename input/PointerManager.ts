import { Point } from '../types';

export class PointerManager {
  private element: HTMLElement;
  private receivedRawInput = false;
  useRawInput?: () => boolean;
  
  isPointerDown: boolean = false;
  pendingPoints: Point[] = [];
  
  activePointers: Map<number, PointerEvent> = new Map();
  isPinching: boolean = false;
  initialPinchDistance: number = 0;
  lastPinchCenter: Point | null = null;
  lastPinchDistance: number = 0;
  
  lastPointerPos: Point | null = null;

  onPointerDown?: (p: Point, e: PointerEvent) => void;
  onPointerMove?: (p: Point, e: PointerEvent) => void;
  onPointerUp?: (p: Point, e: PointerEvent) => void;
  onPointerCancel?: () => void;
  onDoubleClick?: (p: Point, e: MouseEvent) => void;

  onPinchStart?: (center: Point) => void;
  onPinchMove?: (center: Point, scaleDelta: number, panDeltaX: number, panDeltaY: number) => void;
  onPinchEnd?: () => void;

  constructor(element: HTMLElement) {
    this.element = element;
    
    // We attach to the document or window for mouseup/move to not lose tracking if moved fast outside
    this.element.addEventListener('pointerdown', this.handlePointerDown);
    this.element.addEventListener('dblclick', this.handleDoubleClick);
    this.element.addEventListener('lostpointercapture', this.handlePointerCancel);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerrawupdate', this.handlePointerRawUpdate);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
  }

  destroy() {
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('dblclick', this.handleDoubleClick);
    this.element.removeEventListener('lostpointercapture', this.handlePointerCancel);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerrawupdate', this.handlePointerRawUpdate);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.button !== 1 && e.pointerType === 'mouse') return;
    
    this.activePointers.set(e.pointerId, e);

    if (this.activePointers.size === 2) {
      if (this.isPointerDown) {
        this.isPointerDown = false;
        if (this.onPointerCancel) this.onPointerCancel();
      }
      
      this.isPinching = true;
      const pts = Array.from(this.activePointers.values());
      const p1 = this.getPoint(pts[0]);
      const p2 = this.getPoint(pts[1]);
      
      this.lastPinchDistance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      this.initialPinchDistance = this.lastPinchDistance;
      this.lastPinchCenter = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      
      if (this.onPinchStart) this.onPinchStart(this.lastPinchCenter);
      return;
    }

    if (this.activePointers.size === 1) {
      this.receivedRawInput = false;
      this.isPointerDown = true;
      this.pendingPoints = [];
      const p = this.getPoint(e);
      this.pendingPoints.push(p);
      this.element.setPointerCapture(e.pointerId);
      if (this.onPointerDown) this.onPointerDown(p, e);
    }
  };

  private handlePointerRawUpdate = (event: Event) => {
    const e = event as PointerEvent;
    if (!this.isPointerDown || this.isPinching || !this.activePointers.has(e.pointerId) || !this.useRawInput?.()) return;
    this.receivedRawInput = true;
    this.handlePointerMove(e);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (this.isPointerDown && !this.activePointers.has(e.pointerId)) return;
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, e);
    }

    if (this.isPinching && this.activePointers.size === 2) {
      const pts = Array.from(this.activePointers.values());
      const p1 = this.getPoint(pts[0]);
      const p2 = this.getPoint(pts[1]);
      
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      
      if (this.lastPinchCenter && this.lastPinchDistance > 0) {
        let scaleDelta = 1;
        
        if (Math.abs(dist - this.initialPinchDistance) >= 20) {
          scaleDelta = dist / this.lastPinchDistance;
          this.lastPinchDistance = dist;
        }

        const panDeltaX = center.x - this.lastPinchCenter.x;
        const panDeltaY = center.y - this.lastPinchCenter.y;
        
        if (this.onPinchMove) this.onPinchMove(center, scaleDelta, panDeltaX, panDeltaY);
      }
      
      this.lastPinchCenter = center;
      return;
    }

    if (!this.isPointerDown) {
      // Hidden boards also register window listeners. Ignore unrelated hover.
      if (e.target !== this.element) return;
      this.lastPointerPos = this.getPoint(e);
      if (this.onPointerMove) this.onPointerMove(this.lastPointerPos, e);
      return;
    }

    // Raw updates already contain the samples repeated by pointermove.
    if (e.type === 'pointermove' && this.receivedRawInput && this.useRawInput?.()) {
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
    
    // One layout read per event batch, not one per hardware sample.
    const rect = this.element.getBoundingClientRect();
    for (const ev of events) {
      const p = this.getPoint(ev as PointerEvent, rect);
      this.pendingPoints.push(p);
    }
    
    this.lastPointerPos = this.getPoint(e, rect);
    if (this.onPointerMove) this.onPointerMove(this.lastPointerPos, e);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.activePointers.has(e.pointerId)) return;
    this.activePointers.delete(e.pointerId);

    if (this.isPinching) {
      if (this.activePointers.size < 2) {
        this.isPinching = false;
        if (this.onPinchEnd) this.onPinchEnd();
        
        // If there's 1 pointer left, we don't immediately restart drawing
        // to prevent accidental strokes when lifting fingers.
        this.isPointerDown = false;
      }
      return;
    }

    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    const p = this.getPoint(e);
    if (this.onPointerUp) this.onPointerUp(p, e);
  };

  private handlePointerCancel = (e: PointerEvent) => {
    if (!this.activePointers.has(e.pointerId)) return;
    this.activePointers.delete(e.pointerId);
    this.isPointerDown = false;
    this.pendingPoints = [];
    this.receivedRawInput = false;
    if (this.isPinching) this.onPinchEnd?.();
    this.isPinching = false;
    this.onPointerCancel?.();
  };

  private handleBlur = () => {
    if (!this.activePointers.size) return;
    this.activePointers.clear();
    this.isPointerDown = false;
    this.pendingPoints = [];
    if (this.isPinching) this.onPinchEnd?.();
    this.isPinching = false;
    this.onPointerCancel?.();
  };

  private handleDoubleClick = (e: MouseEvent) => {
    const p = this.getPoint(e as PointerEvent); 
    if (this.onDoubleClick) this.onDoubleClick(p, e);
  };

  private getPoint(e: PointerEvent, rect = this.element.getBoundingClientRect()): Point {
    
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
