# react-native-rep-counter

React Native Nitro Module for on-device rep counting from pose landmarks.

This module does not perform exercise classification. It only applies a threshold state machine to right-elbow angle:

- `DOWN` when angle < `downThresholdDeg` (default `90`)
- `UP` when angle > `upThresholdDeg` (default `150`)
- reps increment on `DOWN -> UP`

## Install

```bash
npm install react-native-rep-counter react-native-nitro-modules
```

If you want the complete live UI pipeline (pose + exercise + reps), also install:

```bash
npm install github:tony-div/react-native-pose-landmarks#v1.1.0
npm install github:tony-div/react-native-exercise-recognition#v1.1.0
```

Peer dependency notes:

- `react-native-rep-counter` declares the following peer deps:
  - `react-native-nitro-modules`
  - `react-native-pose-landmarks@1.1.0`
  - `react-native-exercise-recognition@1.1.0`

If your registry does not host those packages, install them from GitHub tags as shown above.

## Usage

```ts
import { repCounter } from 'react-native-rep-counter'

repCounter.startSession({ upThresholdDeg: 150, downThresholdDeg: 90 })

// 33 landmarks * 4 values (x,y,z,visibility)
repCounter.ingestLandmarksBuffer(flatLandmarks)

const state = repCounter.getState()
console.log(state.reps, state.phase)
```

## API

- `startSession(config?: { upThresholdDeg?: number; downThresholdDeg?: number }): void`
- `stopSession(): void`
- `ingestLandmarksBuffer(landmarks: number[]): void`
- `getRepCount(): number`
- `getCurrentPhase(): 'UNKNOWN' | 'UP' | 'DOWN'`
- `getState(): { reps: number; phase: 'UNKNOWN' | 'UP' | 'DOWN' }`
- `resetReps(): void`

## Dev

```bash
npm install
npm run specs
```

For Android native builds, Rust toolchain is required (`cargo` + `rustup`).

## Example app with reps HUD

An example app is included at `example/` and reuses the same live skeleton HUD pattern from the exercise-recognition example, but shows rep-centric metrics.

Run:

```bash
cd example
npm install
npm run start
npm run android
```
