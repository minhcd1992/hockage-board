import { BoardObject, Point } from '../types';
import { Shape } from '../objects/Shape';
import { Stroke } from '../objects/Stroke';

export type AnchorKey = 'start' | 'end' | 'controlPoint';

export function editAnchors(objects: BoardObject[]): { key: AnchorKey; point: Point }[] {
  const obj = objects[0];
  if (objects.length !== 1 || !(obj instanceof Shape) || obj.locked ||
      !['line', 'arrow', 'bezier'].includes(obj.shapeType)) return [];
  const keys: AnchorKey[] = obj.shapeType === 'bezier' ? ['start', 'end', 'controlPoint'] : ['start', 'end'];
  return keys.map(key => ({ key, point: obj.transformPoint(obj[key]) }));
}

export function transformCopy(obj: BoardObject): BoardObject {
  const copy = obj.clone();
  copy.id = obj.id;
  copy.selected = obj.selected;
  copy.locked = obj.locked;
  return copy;
}

function worldGeometry(obj: Shape | Stroke, map: (p: Point) => Point) {
  if (obj instanceof Shape) {
    const points = [obj.start, obj.end, obj.controlPoint].map(p => map(obj.transformPoint(p)));
    [obj.start, obj.end, obj.controlPoint] = points;
  } else {
    obj.points = obj.points.map(p => ({ ...p, ...map(obj.transformPoint(p)) }));
  }
  obj.rotation = 0;
  obj.scaleX = obj.scaleY = 1;
  obj.updateCenter();
}

export function moveAnchor(obj: Shape, key: AnchorKey, point: Point, snapAngle: boolean) {
  worldGeometry(obj, p => p);
  if (snapAngle && key !== 'controlPoint') {
    const fixed = key === 'start' ? obj.end : obj.start;
    const distance = Math.hypot(point.x - fixed.x, point.y - fixed.y);
    const step = Math.PI / 12;
    const angle = Math.round(Math.atan2(point.y - fixed.y, point.x - fixed.x) / step) * step;
    point = { x: fixed.x + distance * Math.cos(angle), y: fixed.y + distance * Math.sin(angle) };
  }
  obj[key] = { ...point };
  obj.updateCenter();
}

export function keepAspect(objects: BoardObject[]): boolean {
  return objects.some(obj => obj.type === 'image' || obj.type === 'pdf' || obj.type === 'text' ||
    (obj instanceof Shape && (obj.shapeType === 'arc' || obj.shapeType === 'sine' || Math.abs(obj.rotation) > 1e-8)));
}

/** Resize geometry, keeping pen width and arrow decorations independent of length. */
export function resizeObject(obj: BoardObject, fixed: Point, sx: number, sy: number) {
  if (obj.locked) return;
  const map = (p: Point) => ({ ...p, x: fixed.x + (p.x - fixed.x) * sx, y: fixed.y + (p.y - fixed.y) * sy });
  if (obj instanceof Stroke || (obj instanceof Shape && ['line', 'arrow', 'bezier'].includes(obj.shapeType))) {
    worldGeometry(obj, map);
    return;
  }
  const center = map({ x: obj.cx, y: obj.cy });
  if (obj instanceof Shape) {
    // Rotated shapes use uniform resizing: a world-axis stretch would introduce shear.
    const localMap = (p: Point) => ({ x: obj.cx + (p.x - obj.cx) * sx, y: obj.cy + (p.y - obj.cy) * sy });
    obj.start = localMap(obj.start);
    obj.end = localMap(obj.end);
    obj.controlPoint = localMap(obj.controlPoint);
    obj.sineAmplitude *= sy;
    obj.sineWavelength *= sx;
  } else {
    obj.scaleX *= sx;
    obj.scaleY *= sy;
  }
  obj.translate(center.x - obj.cx, center.y - obj.cy);
}
