import type { HybridObject } from 'react-native-nitro-modules'

export interface RepCounterState {
  exercise: string | null
  reps: number
  confidence: number
  phase: string
  activeArm: string | null
}

export interface RepCounterConfig {
  exercise?: string | null
}

export interface HybridRepCounter
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  startSession(config: RepCounterConfig | null): void
  stopSession(): void
  setExercise(exercise: string | null): void
  resetReps(): void
  resetAll(): void
  getState(): RepCounterState
  update(landmarks: number[], exerciseOverride: string | null): RepCounterState
}
