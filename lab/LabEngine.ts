import Matter from 'matter-js';
import { LabSceneConfig, LabObject } from './types';
import { LabRenderer } from './LabRenderer';

export class LabEngine {
  config: LabSceneConfig;
  matterEngine: Matter.Engine;
  renderer: LabRenderer;
  bodyMap: Map<string, Matter.Body | Matter.Constraint> = new Map();
  state: 'playing' | 'paused' = 'paused';
  time: number = 0; // seconds

  constructor(config: LabSceneConfig) {
    this.config = JSON.parse(JSON.stringify(config)); // deep clone
    this.matterEngine = Matter.Engine.create({
      gravity: { x: 0, y: this.config.gravity / 10, scale: 0.001 } 
    });
    this.renderer = new LabRenderer(this);
    this.setupScene();
  }

  setupScene() {
    this.time = 0;
    Matter.World.clear(this.matterEngine.world, false);
    this.bodyMap.clear();

    // Create bodies based on config
    this.config.objects.forEach(obj => {
      if (obj.type === 'car' || obj.type === 'particle') {
        if (obj.kinematics) {
          obj.kinematics.currentPosition = { ...obj.kinematics.initialPosition };
          obj.kinematics.currentVelocity = { ...obj.kinematics.initialVelocity };
        }
      } else if (obj.type === 'graph') {
        if (obj.graph) {
          obj.graph.series.forEach(s => s.history = []); // Clear graph history
        }
      } else if (obj.type === 'stand') {
        const pivot = obj.position || { x: 400, y: 100 };
        // Just a static visual, maybe no physics body needed, or a static pin
      } else if (obj.type === 'pendulum') {
        const pivot = obj.pivot || { x: 400, y: 100 };
        const length = obj.length || 200;
        const mass = obj.mass || 1;
        const angleDeg = obj.angle || 0;
        const angleRad = (angleDeg * Math.PI) / 180;
        
        const bobX = pivot.x + length * Math.sin(angleRad);
        const bobY = pivot.y + length * Math.cos(angleRad);
        
        const bob = Matter.Bodies.circle(bobX, bobY, 20, {
          mass: mass,
          frictionAir: 0.001 // tiny bit of air friction
        });
        
        const constraint = Matter.Constraint.create({
          pointA: pivot,
          bodyB: bob,
          length: length,
          stiffness: 1
        });
        
        this.bodyMap.set(obj.id + '_bob', bob);
        this.bodyMap.set(obj.id + '_constraint', constraint);
        Matter.World.add(this.matterEngine.world, [bob, constraint]);
      }
    });
  }

  update(dt: number) {
    if (this.state === 'playing') {
      const dtSec = dt / 1000;
      this.time += dtSec;
      
      // Update Physics (Matter.js)
      Matter.Engine.update(this.matterEngine, dt);

      // Update Kinematics (Explicit Math)
      this.config.objects.forEach(obj => {
        if ((obj.type === 'car' || obj.type === 'particle') && obj.kinematics) {
          const t = this.time;
          const k = obj.kinematics;
          k.currentPosition = {
            x: k.initialPosition.x + k.initialVelocity.x * t + 0.5 * k.acceleration.x * t * t,
            y: k.initialPosition.y + k.initialVelocity.y * t + 0.5 * k.acceleration.y * t * t
          };
          k.currentVelocity = {
            x: k.initialVelocity.x + k.acceleration.x * t,
            y: k.initialVelocity.y + k.acceleration.y * t
          };
        }
      });

      // Update Graphs
      this.config.objects.forEach(obj => {
        if (obj.type === 'graph' && obj.graph) {
          obj.graph.series.forEach(series => {
            const target = this.config.objects.find(o => o.id === series.targetId);
            if (target && target.kinematics?.currentPosition && target.kinematics?.currentVelocity) {
              let val = 0;
              switch(series.type) {
                case 'x-t': val = target.kinematics.currentPosition.x; break;
                case 'y-t': val = target.kinematics.currentPosition.y; break;
                case 'v-t': val = target.kinematics.currentVelocity.x; break;
                case 'a-t': val = target.kinematics.acceleration.x; break;
              }
              series.history.push({ t: this.time, val });
            }
          });
        }
      });
    }
  }

  play() {
    this.state = 'playing';
  }

  pause() {
    this.state = 'paused';
  }

  reset() {
    this.state = 'paused';
    // Re-read initial config
    this.setupScene();
  }

  updateConfig(objectId: string, updates: Partial<LabObject>) {
    const obj = this.config.objects.find(o => o.id === objectId);
    if (obj) {
      Object.assign(obj, updates);
      // If paused, we can reset scene to apply new length/angle
      if (this.state === 'paused') {
        this.setupScene();
      }
    }
  }
}
