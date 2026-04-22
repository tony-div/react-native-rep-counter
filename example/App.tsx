import React, { useEffect, useMemo, useState } from 'react'
import { Button, Dimensions, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { PoseLandmarks } from 'react-native-pose-landmarks'
import { exerciseRecognition } from 'react-native-exercise-recognition'
import { repCounter } from 'react-native-rep-counter'

const EXERCISES = [
  'bicep_curl',
  'front_raise',
  'lateral_raise',
  'shoulder_press',
  'tricep_extension',
  'push_up',
  'pull_up',
  'bench_pressing',
]

const LANDMARK_COUNT = 33
const VALUES_PER_LANDMARK = 4
const BONE_THICKNESS = 3
const DEFAULT_SIZE = Dimensions.get('window')

const POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [15, 21],
  [17, 19],
  [12, 14],
  [14, 16],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
  [27, 31],
  [28, 32],
]

function App(): React.JSX.Element {
  const [sessionActive, setSessionActive] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [selectedExercise, setSelectedExercise] = useState('bicep_curl')
  const [reps, setReps] = useState(0)
  const [phase, setPhase] = useState<'UNKNOWN' | 'UP' | 'DOWN'>('UNKNOWN')
  const [exercise, setExercise] = useState('Unknown')
  const [exerciseConfidence, setExerciseConfidence] = useState(0)
  const [classifierInferenceMs, setClassifierInferenceMs] = useState(-1)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [inferenceMs, setInferenceMs] = useState(-1)
  const [landmarks, setLandmarks] = useState<number[]>([])
  const [viewport, setViewport] = useState({
    width: DEFAULT_SIZE.width,
    height: DEFAULT_SIZE.height * 0.62,
  })

  useEffect(() => {
    if (!sessionActive) return

    if (useAI) {
      const loaded = exerciseRecognition.loadModelFromAsset('exercise_classifier_rf.json')
      setModelLoaded(loaded)
    } else {
      setModelLoaded(false)
    }

    if (PoseLandmarks == null) {
      setPhase('UNKNOWN')
      setSessionActive(false)
      return
    }

    const initialized = PoseLandmarks.initPoseLandmarker()
    if (!initialized) {
      setPhase('UNKNOWN')
      setSessionActive(false)
      return
    }

    const interval = setInterval(() => {
      const buffer = PoseLandmarks.getLandmarksBuffer()
      setInferenceMs(PoseLandmarks.getLastInferenceTimeMs())

      if (!Array.isArray(buffer) || buffer.length !== LANDMARK_COUNT * VALUES_PER_LANDMARK) {
        return
      }

setLandmarks(buffer)

      if (useAI) {
        exerciseRecognition.ingestLandmarksBuffer(buffer)
        const currentExercise = exerciseRecognition.getCurrentExercise() ?? selectedExercise
        repCounter.ingestLandmarksBufferWithExercise(buffer, currentExercise)
        setExercise(currentExercise)
        setExerciseConfidence(exerciseRecognition.getCurrentConfidence())
        setClassifierInferenceMs(exerciseRecognition.getLastClassifierInferenceTimeMs())
      } else {
        repCounter.ingestLandmarksBufferWithExercise(buffer, selectedExercise)
        setExercise(selectedExercise)
        setExerciseConfidence(0)
      }

      const state = repCounter.getState()
      setReps(state.reps)
      setPhase(state.phase)
    }, 66)

    return () => {
      clearInterval(interval)
      PoseLandmarks.closePoseLandmarker()
    }
  }, [sessionActive])

  const onStart = () => {
    if (useAI) {
      exerciseRecognition.startSession({ minConfidence: 0.6, smoothingWindow: 5 })
    }
    repCounter.startSession({ upThresholdDeg: 150, downThresholdDeg: 90 })
    setReps(0)
    setPhase('UNKNOWN')
    setExercise(useAI ? 'Unknown' : selectedExercise)
    setExerciseConfidence(0)
    setClassifierInferenceMs(-1)
    setSessionActive(true)
  }

  const onStop = () => {
    setSessionActive(false)
    exerciseRecognition.stopSession()
    repCounter.stopSession()
  }

  const onReset = () => {
    repCounter.resetReps()
    const state = repCounter.getState()
    setReps(state.reps)
    setPhase(state.phase)
  }

  const renderedSkeleton = useMemo(() => {
    if (landmarks.length !== LANDMARK_COUNT * VALUES_PER_LANDMARK) return null

    return POSE_CONNECTIONS.map(([from, to], index) => {
      const fromIndex = from * VALUES_PER_LANDMARK
      const toIndex = to * VALUES_PER_LANDMARK

      const fromVisibility = landmarks[fromIndex + 3] ?? 1
      const toVisibility = landmarks[toIndex + 3] ?? 1
      if (fromVisibility < 0.05 || toVisibility < 0.05) return null

      const x1 = (landmarks[fromIndex] ?? 0) * viewport.width
      const y1 = (landmarks[fromIndex + 1] ?? 0) * viewport.height
      const x2 = (landmarks[toIndex] ?? 0) * viewport.width
      const y2 = (landmarks[toIndex + 1] ?? 0) * viewport.height

      const deltaX = x2 - x1
      const deltaY = y2 - y1
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const angle = Math.atan2(deltaY, deltaX)
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2

      return (
        <View
          key={`bone-${from}-${to}-${index}`}
          style={[
            styles.bone,
            {
              left: midX - length / 2,
              top: midY - BONE_THICKNESS / 2,
              width: length,
              transform: [{ rotateZ: `${angle}rad` }],
            },
          ]}
        />
      )
    })
  }, [landmarks, viewport.height, viewport.width])

  const renderedLandmarks = useMemo(() => {
    if (landmarks.length !== LANDMARK_COUNT * VALUES_PER_LANDMARK) return null

    return Array.from({ length: LANDMARK_COUNT }).map((_, index) => {
      const baseIndex = index * VALUES_PER_LANDMARK
      const visibility = landmarks[baseIndex + 3] ?? 1
      if (visibility < 0.05) return null

      const x = (landmarks[baseIndex] ?? 0) * viewport.width
      const y = (landmarks[baseIndex + 1] ?? 0) * viewport.height

      return <View key={`dot-${index}`} style={[styles.dot, { left: x - 4, top: y - 4 }]} />
    })
  }, [landmarks, viewport.height, viewport.width])

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.hud}>
            <Text style={styles.title}>Live Rep Counter</Text>
            <Text style={styles.reps}>{reps}</Text>
            <Text style={styles.phase}>Phase: {phase}</Text>
            <Text style={styles.exercise}>{exercise.toUpperCase()}</Text>
            <Text style={styles.meta}>Exercise confidence: {(exerciseConfidence * 100).toFixed(1)}%</Text>
            <Text style={styles.meta}>
              Landmark inference: {inferenceMs >= 0 ? `${inferenceMs.toFixed(0)} ms` : '--'}
            </Text>
            <Text style={styles.meta}>
              Classifier inference: {classifierInferenceMs >= 0 ? `${classifierInferenceMs.toFixed(1)} ms` : '--'}
            </Text>
            <Text style={styles.meta}>Exercise model: {modelLoaded ? 'loaded' : 'not loaded'}</Text>
            <Text style={styles.meta}>
              Landmark points: {Math.floor(landmarks.length / VALUES_PER_LANDMARK)} / 33
            </Text>
          </View>

          <View
            style={styles.viewport}
            onLayout={event => {
              const { width, height } = event.nativeEvent.layout
              if (width > 0 && height > 0) {
                setViewport({ width, height })
              }
            }}
          >
            <View style={styles.cameraTint} />
            {renderedSkeleton}
            {renderedLandmarks}
            {landmarks.length === 0 ? (
              <Text style={styles.placeholder}>Waiting for live camera landmarks...</Text>
            ) : null}
          </View>

          <View style={styles.aiToggle}>
            <Text style={styles.label}>Use AI Classifier</Text>
            <Switch
              value={useAI}
              onValueChange={setUseAI}
              disabled={sessionActive}
            />
          </View>

          {!useAI && (
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Exercise:</Text>
              <View style={styles.exerciseButtons}>
                {EXERCISES.map(ex => (
                  <TouchableOpacity
                    key={ex}
                    style={[
                      styles.exerciseButton,
                      selectedExercise === ex && styles.exerciseButtonActive,
                    ]}
                    onPress={() => setSelectedExercise(ex)}
                    disabled={sessionActive}
                  >
                    <Text
                      style={[
                        styles.exerciseButtonText,
                        selectedExercise === ex && styles.exerciseButtonTextActive,
                      ]}
                    >
                      {ex.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.controls}>
            <View style={styles.buttons}>
              <Button title="Start" onPress={onStart} disabled={sessionActive} />
            </View>
            <View style={styles.buttons}>
              <Button title="Stop" onPress={onStop} disabled={!sessionActive} />
            </View>
            <View style={styles.buttons}>
              <Button title="Reset Reps" onPress={onReset} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a1118',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hud: {
    marginBottom: 12,
    backgroundColor: '#112131',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dceeff',
    letterSpacing: 0.2,
  },
  reps: {
    marginTop: 6,
    fontSize: 56,
    fontWeight: '900',
    color: '#f7fff8',
    lineHeight: 58,
  },
  phase: {
    marginTop: 2,
    marginBottom: 4,
    fontSize: 22,
    fontWeight: '700',
    color: '#79f0b3',
  },
  exercise: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f6d66b',
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
    color: '#97adc1',
  },
  viewport: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0e1d2a',
    borderWidth: 1,
    borderColor: '#203446',
  },
  cameraTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 20, 34, 0.76)',
  },
  bone: {
    position: 'absolute',
    height: BONE_THICKNESS,
    borderRadius: 999,
    backgroundColor: '#3fd4ff',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffca57',
    borderWidth: 1,
    borderColor: '#fff6d5',
  },
  placeholder: {
    color: '#8ea4b6',
    fontSize: 17,
    textAlign: 'center',
    marginTop: '45%',
  },
  aiToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#112131',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dceeff',
  },
  pickerContainer: {
    backgroundColor: '#112131',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
  },
  picker: {
    color: '#f7fff8',
    height: 120,
  },
  exerciseButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  exerciseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e3a4d',
    marginRight: 8,
    marginBottom: 8,
  },
  exerciseButtonActive: {
    backgroundColor: '#3fd4ff',
  },
  exerciseButtonText: {
    color: '#97adc1',
    fontSize: 12,
    fontWeight: '600',
  },
  exerciseButtonTextActive: {
    color: '#0a1118',
  },
  controls: {
    marginTop: 12,
    marginBottom: 6,
    flexDirection: 'row',
  },
  buttons: {
    flex: 1,
    marginHorizontal: 4,
  },
})

export default App
