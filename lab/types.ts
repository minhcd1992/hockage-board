export type LabObjectType = 'stand' | 'mass' | 'pendulum' | 'car' | 'particle' | 'graph' | 'distance-measurement';

export interface Vector2 {
  x: number;
  y: number;
}

export interface KinematicState {
  initialPosition: Vector2;
  initialVelocity: Vector2;
  acceleration: Vector2;
  // Computed at runtime
  currentPosition?: Vector2;
  currentVelocity?: Vector2;
}

export interface GraphSeries {
  targetId: string;
  type: 'x-t' | 'v-t' | 'a-t' | 'y-t';
  history: { t: number, val: number }[];
  color: string;
}

export interface GraphState {
  title?: string;
  bounds: { x: number, y: number, w: number, h: number };
  series: GraphSeries[];
}

export interface DistanceMeasurement {
  targetA: string;
  targetB: string;
  offsetY: number; // Y offset from the objects to draw the line
}

export interface LabObject {
  id: string;
  type: LabObjectType;
  name?: string;
  color?: string;
  
  // Base properties
  position?: Vector2;
  
  // Pendulum properties
  pivot?: Vector2;
  length?: number;
  mass?: number;
  angle?: number;

  // Kinematic properties
  kinematics?: KinematicState;
  
  // Graph properties
  graph?: GraphState;
  
  // Distance Measurement
  distanceMeasurement?: DistanceMeasurement;

  // Visuals
  showVelocityVector?: boolean;
  showAccelerationVector?: boolean;
  showDisplacementVector?: boolean;
}

export interface LabSceneConfig {
  id: string;
  title: string;
  gravity: number;
  objects: LabObject[];
  controls: string[]; // e.g. "car1.velocity", "car2.acceleration"
  measurements: string[];
}
