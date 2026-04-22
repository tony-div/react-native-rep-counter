import { type HybridObject, NitroModules } from 'react-native-nitro-modules'

export interface RepCounterConfig {
  upThresholdDeg?: number
  downThresholdDeg?: number
}

export type RepPhase = 'UNKNOWN' | 'UP' | 'DOWN'

export interface RepCounterState {
  reps: number
  phase: RepPhase
}

export interface RepCounter extends HybridObject<{ ios: 'c++', android: 'c++' }> {
  startSession(config?: RepCounterConfig): void
  stopSession(): void
  ingestLandmarksBuffer(landmarks: Array<number>): void
  ingestLandmarksBufferWithExercise(
    landmarks: Array<number>,
    exercise: string,
  ): void
  getRepCount(): number
  getCurrentPhase(): RepPhase
  getState(): RepCounterState
  resetReps(): void
}

export const repCounter = NitroModules.createHybridObject<RepCounter>('RepCounter')
