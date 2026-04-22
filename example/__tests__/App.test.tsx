import React from 'react'
import renderer from 'react-test-renderer'

jest.mock('react-native-pose-landmarks', () => ({
  PoseLandmarks: {
    initPoseLandmarker: () => true,
    closePoseLandmarker: () => true,
    getLandmarksBuffer: () => [],
    getLastInferenceTimeMs: () => -1,
  },
}), { virtual: true })

jest.mock('react-native-rep-counter', () => ({
  repCounter: {
    startSession: () => undefined,
    stopSession: () => undefined,
    ingestLandmarksBuffer: () => undefined,
    getRepCount: () => 0,
    getCurrentPhase: () => 'UNKNOWN',
    getState: () => ({ reps: 0, phase: 'UNKNOWN' }),
    resetReps: () => undefined,
  },
}), { virtual: true })

import App from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    renderer.create(<App />)
  })
})
