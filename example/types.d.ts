declare module 'react-native-pose-landmarks' {
  export const PoseLandmarks: {
    initPoseLandmarker(): boolean
    closePoseLandmarker(): boolean
    getLandmarksBuffer(): number[]
    getLastInferenceTimeMs(): number
  }
}

declare module 'react-native-exercise-recognition' {
  export const exerciseRecognition: {
    startSession(config?: {
      minConfidence?: number
      smoothingWindow?: number
    }): void
    stopSession(): void
    ingestLandmarksBuffer(landmarks: Array<number>): void
    getCurrentExercise(): string | null
    getCurrentConfidence(): number
    loadModelFromAsset(filename: string): boolean
    getLastClassifierInferenceTimeMs(): number
  }
}
