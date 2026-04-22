# RepCounter Example

This example follows the module README install flow and includes:

- live pose landmarks (`react-native-pose-landmarks`)
- live exercise recognition (`react-native-exercise-recognition`)
- rep counting HUD (`react-native-rep-counter`)

## Install

From this `example/` directory:

```bash
npm install
```

Dependencies are configured in `package.json` as:

- `react-native-rep-counter`: local `file:..`
- `react-native-exercise-recognition`: `github:tony-div/react-native-exercise-recognition#v1.1.0`
- `react-native-pose-landmarks`: `github:tony-div/react-native-pose-landmarks#v1.1.0`

## Run

```bash
npm run start
npm run android
```

## Usage Flow

1. Tap **Start** to initialize pose + classifier + rep counter sessions.
2. Landmarks stream in every ~66ms.
3. HUD updates:
   - reps
   - phase (`UNKNOWN`/`DOWN`/`UP`)
   - detected exercise and confidence
   - landmark and classifier inference timings
4. Tap **Reset Reps** to reset only the rep counter state.
5. Tap **Stop** to stop all sessions.
