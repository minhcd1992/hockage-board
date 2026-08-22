import { BoardObject } from '../types';

export class Scene {
  objects: BoardObject[] = [];
  history: BoardObject[][] = [[]];
  historyIndex: number = 0;
  clipboard: BoardObject[] = [];

  saveState() {
    // Drop future history if we are in the middle of undo stack
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push([...this.objects]);
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.objects = [...this.history[this.historyIndex]];
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.objects = [...this.history[this.historyIndex]];
      return true;
    }
    return false;
  }

  addObject(obj: BoardObject) {
    this.objects.push(obj);
    this.saveState();
  }

  removeObject(objId: string) {
    this.objects = this.objects.filter(el => el.id !== objId);
    this.saveState();
  }

  clear() {
    this.objects = [];
    this.saveState();
  }

  clearSelection() {
    for (const obj of this.objects) {
      obj.selected = false;
    }
  }

  toggleSelection(objId: string, add: boolean = false) {
    if (!add) {
      this.clearSelection();
    }
    const obj = this.objects.find(o => o.id === objId);
    if (obj) {
      obj.selected = true;
    }
  }

  getSelectedObjects(): BoardObject[] {
    return this.objects.filter(el => el.selected);
  }
  
  getSelectionBounds(): import('../types').Rect | null {
    const selected = this.getSelectedObjects();
    if (selected.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of selected) {
      const box = el.getBoundingBox();
      if (box.x < minX) minX = box.x;
      if (box.y < minY) minY = box.y;
      if (box.x + box.w > maxX) maxX = box.x + box.w;
      if (box.y + box.h > maxY) maxY = box.y + box.h;
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  
  deleteSelected() {
    const toDelete = this.getSelectedObjects().map(el => el.id);
    if (toDelete.length === 0) return;
    for (const id of toDelete) {
      this.objects = this.objects.filter(el => el.id !== id);
    }
    this.saveState();
  }

  copy() {
    this.clipboard = this.getSelectedObjects().map(obj => obj.clone());
  }

  cut() {
    this.copy();
    this.deleteSelected();
  }

  paste() {
    if (this.clipboard.length === 0) return;
    this.clearSelection();
    
    const pasted = this.clipboard.map(obj => {
      const clone = obj.clone();
      clone.translate(20, 20);
      clone.selected = true;
      return clone;
    });
    
    this.objects.push(...pasted);
    this.clipboard = pasted.map(obj => obj.clone());
    this.saveState();
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const el of this.objects) {
      el.draw(ctx);
    }
  }
}
