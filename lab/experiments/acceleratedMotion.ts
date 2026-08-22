import { LabSceneConfig } from '../types';

export const acceleratedMotionExperiment: LabSceneConfig = {
  id: 'accelerated-motion',
  title: 'Chuyển động thẳng biến đổi đều',
  gravity: 9.8,
  objects: [
    {
      id: 'car1',
      type: 'car',
      name: 'Xe đua',
      color: '#f59e0b',
      kinematics: {
        initialPosition: { x: 50, y: 150 },
        initialVelocity: { x: 0, y: 0 },
        acceleration: { x: 20, y: 0 },
      },
      showVelocityVector: true,
      showAccelerationVector: true,
    },
    {
      id: 'graph1',
      type: 'graph',
      graph: {
        title: 'Đồ thị v-t (Vận tốc - Thời gian)',
        bounds: { x: 50, y: 250, w: 300, h: 200 },
        series: [
          {
            targetId: 'car1',
            type: 'v-t',
            history: [],
            color: '#f59e0b'
          }
        ]
      }
    },
    {
      id: 'graph2',
      type: 'graph',
      graph: {
        title: 'Đồ thị x-t (Vị trí - Thời gian)',
        bounds: { x: 400, y: 250, w: 300, h: 200 },
        series: [
          {
            targetId: 'car1',
            type: 'x-t',
            history: [],
            color: '#22c55e'
          }
        ]
      }
    }
  ],
  controls: ['car1.initialVelocity.x', 'car1.acceleration.x'],
  measurements: ['car1.currentPosition.x', 'car1.currentVelocity.x']
};
