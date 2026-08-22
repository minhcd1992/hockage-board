import { LabSceneConfig } from '../types';

export const pendulumExperiment: LabSceneConfig = {
  id: "pendulum_01",
  title: "Khảo sát chu kỳ con lắc đơn",
  gravity: 9.81,
  objects: [
    {
      id: "stand_1",
      type: "stand",
      position: { x: 400, y: 100 }
    },
    {
      id: "pendulum_1",
      type: "pendulum",
      pivot: { x: 400, y: 100 },
      length: 250,
      mass: 0.2,
      angle: 30
    }
  ],
  controls: [
    "length",
    "mass",
    "angle"
  ],
  measurements: [
    "period",
    "velocity",
    "energy"
  ]
};
