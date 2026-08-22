import { LabSceneConfig } from '../types';

export const uniformMotion2CarsExperiment: LabSceneConfig = {
  id: 'uniform-motion-2-cars',
  title: 'Hai xe chuyển động ngược chiều',
  gravity: 9.8,
  objects: [
    {
      id: 'car1',
      type: 'car',
      name: 'Xe A',
      color: '#ef4444',
      kinematics: {
        initialPosition: { x: 100, y: 200 },
        initialVelocity: { x: 50, y: 0 },
        acceleration: { x: 0, y: 0 },
      },
      showVelocityVector: true,
    },
    {
      id: 'car2',
      type: 'car',
      name: 'Xe B',
      color: '#3b82f6',
      kinematics: {
        initialPosition: { x: 700, y: 200 },
        initialVelocity: { x: -30, y: 0 },
        acceleration: { x: 0, y: 0 },
      },
      showVelocityVector: true,
    },
    {
      id: 'distance',
      type: 'distance-measurement',
      distanceMeasurement: {
        targetA: 'car1',
        targetB: 'car2',
        offsetY: 280,
      }
    },
    {
      id: 'graph1',
      type: 'graph',
      graph: {
        title: 'Đồ thị x-t (Vị trí - Thời gian)',
        bounds: { x: 50, y: 350, w: 600, h: 250 },
        series: [
          {
            targetId: 'car1',
            type: 'x-t',
            history: [],
            color: '#ef4444'
          },
          {
            targetId: 'car2',
            type: 'x-t',
            history: [],
            color: '#3b82f6'
          }
        ]
      }
    }
  ],
  controls: ['car1.initialVelocity.x', 'car2.initialVelocity.x', 'car1.initialPosition.x', 'car2.initialPosition.x'],
  measurements: []
};
