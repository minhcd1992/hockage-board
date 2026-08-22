import { LabSceneConfig } from '../types';

export const freeFallExperiment: LabSceneConfig = {
  id: 'free-fall',
  title: 'Rơi tự do',
  gravity: 9.8,
  objects: [
    {
      id: 'particle1',
      type: 'particle',
      name: 'Vật rơi',
      color: '#eab308',
      kinematics: {
        initialPosition: { x: 400, y: 50 },
        initialVelocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 98 }, // px/s^2 (scaled gravity for visual)
      },
      showVelocityVector: true,
      showAccelerationVector: true,
    },
    {
      id: 'graph1',
      type: 'graph',
      graph: {
        title: 'Đồ thị v-t (Vận tốc - thời gian)',
        bounds: { x: 550, y: 50, w: 250, h: 200 },
        series: [
          {
            targetId: 'particle1',
            type: 'v-t',
            history: [],
            color: '#ef4444'
          }
        ]
      }
    },
    {
      id: 'graph2',
      type: 'graph',
      graph: {
        title: 'Đồ thị y-t (Độ cao - thời gian)',
        bounds: { x: 550, y: 280, w: 250, h: 200 },
        series: [
          {
            targetId: 'particle1',
            type: 'y-t',
            history: [],
            color: '#3b82f6'
          }
        ]
      }
    }
  ],
  controls: ['particle1.initialPosition.y'],
  measurements: ['particle1.currentPosition.y', 'particle1.currentVelocity.y']
};
