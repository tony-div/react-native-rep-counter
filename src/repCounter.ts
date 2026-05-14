export type RepPhase = 'UNKNOWN' | 'UP' | 'DOWN'

export type RepCounterState = {
  exercise: string | null
  reps: number
  confidence: number
  phase: RepPhase
  activeArm: string | null
}

export type RepCounterConfig = {
  exercise?: string | null
}

export type Landmark = {
  x: number
  y: number
  z: number
  visibility: number
}

export type LandmarksInput = number[] | Landmark[]

export const createRepCounter = () => {
  const { NitroModules } = require('react-native-nitro-modules') as typeof import('react-native-nitro-modules')
  return NitroModules.createHybridObject<import('./specs/RepCounter.nitro').HybridRepCounter>('HybridRepCounter')
}
