# react-native-rep-counter

React Native TypeScript rep counting logic from pose landmarks.

The library ports the logic from `ai/Rep Counting/rep_counter_interface.py` into TypeScript and runs it off the UI thread via a lightweight worker queue. Provide pose landmarks (33 points, x/y/z/visibility) and an exercise label; the rep counter returns `{ exercise, reps, confidence, phase }`.

## Install

```bash
npm install react-native-rep-counter
```

Or install from a GitHub release (e.g. for a specific tag):

```bash
npm install https://github.com/your-org/react-native-rep-counter/releases/download/v2.0.0/react-native-rep-counter-v2.0.0.tgz
```

## Usage

```ts
import { createRepCounterWorker } from 'react-native-rep-counter'

const counter = createRepCounterWorker()
counter.startSession({ exercise: 'bicep_curl' })

// 33 landmarks * 4 values (x,y,z,visibility)
const state = await counter.enqueueLandmarks(flatLandmarks)
console.log(state.reps, state.phase)
```

## API

- `createRepCounter()` -> synchronous counter (use only off UI thread)
- `createRepCounterWorker()` -> queued async counter
- `RepCounterWorker.startSession(config?: { exercise?: string }): void`
- `RepCounterWorker.enqueueLandmarks(landmarks: number[] | Landmark[], exercise?: string): Promise<{ exercise, reps, confidence, phase }>`
- `RepCounterWorker.getState(): RepCounterState`
- `RepCounterWorker.resetReps(): void`

## Dev

```bash
npm install
npm run specs
```

No native build steps.

## Example app with reps HUD

An example app is included at `example/` and reuses the same live skeleton HUD pattern from the exercise-recognition example, but shows rep-centric metrics.

Run:

```bash
cd example
npm install
npm run start
npm run android
```
