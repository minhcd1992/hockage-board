import { LabSceneConfig } from '../types';

export const displacementConfig: LabSceneConfig = {
  id: 'displacement',
  title: 'Độ Dịch Chuyển và Quãng Đường',
  gravity: 9.8, // Not really used for this vector-path simulation
  objects: [
    {
      id: 'ninja-path',
      type: 'vector-path',
      name: 'Ninja Path',
      vectorPath: {
        waypoints: [{ x: 0, y: 0 }], // Starting point of the ninja
        isDragging: false,
        dragPos: null,
        accumulatedDistance: 0
      }
    }
  ],
  controls: [],
  measurements: []
};
