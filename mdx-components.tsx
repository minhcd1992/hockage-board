import type { MDXComponents } from 'mdx/types'
import { Section } from '@/components/lesson/Section'
import { InfoBox } from '@/components/lesson/InfoBox'
import { Quiz } from '@/components/lesson/Quiz'
import { QuizTF } from '@/components/lesson/QuizTF'
import { QuizShort } from '@/components/lesson/QuizShort'
import { TwoColumns, Col } from '@/components/lesson/TwoColumns'
import { Math } from '@/components/lesson/Math'
import { WestLakeSim } from '@/components/simulations/WestLakeSim'
import { CrossroadsSim } from '@/components/simulations/CrossroadsSim'
import { FerrisWheelSim, CarPointSim, CarGarageSim, Coordinate1D, Coordinate2D } from '@/components/simulations/TheorySims'
import { CompareTable } from '@/components/lesson/CompareTable'
import { VectorAdditionSim } from '@/components/simulations/VectorAdditionSim'
import { AntExperimentSim } from '@/components/simulations/AntExperimentSim'
import { VirtualLabSim } from '@/components/simulations/VirtualLabSim'

// Lesson 2
import { SpeedometerSim, CurvedPathSim, SatelliteSim, RealWorldSim, LimitVelocitySim } from '@/components/simulations/Lesson2Sims'
import { RelativeVelocitySim } from '@/components/simulations/RelativeVelocitySim'
import { PhotogateSim } from '@/components/simulations/PhotogateSim'
import { BoatRiverSim } from '@/components/simulations/BoatRiverSim'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Section,
    InfoBox,
    Quiz,
    QuizTF,
    QuizShort,
    TwoColumns,
    Col,
    Math,
    WestLakeSim,
    CrossroadsSim,
    FerrisWheelSim,
    CarPointSim,
    CarGarageSim,
    Coordinate1D,
    Coordinate2D,
    CompareTable,
    VectorAdditionSim,
    AntExperimentSim,
    VirtualLabSim,
    
    // Lesson 2
    SpeedometerSim,
    CurvedPathSim,
    SatelliteSim,
    RelativeVelocitySim,
    PhotogateSim,
    BoatRiverSim,
    RealWorldSim,
    LimitVelocitySim,
    
    ...components,
  }
}
