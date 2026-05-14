import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { PoseLandmarks } from 'react-native-pose-landmarks/src'
import { exerciseRecognition } from 'react-native-exercise-recognition/src'
import { createRepCounter, type RepCounterState } from 'react-native-rep-counter'

const EXERCISES = [
  { label: 'Bicep Curl', value: 'bicep_curl' },
  { label: 'Front Raises', value: 'front_raise' },
  { label: 'Lateral Raises', value: 'lateral_raise' },
  { label: 'Shoulder Press', value: 'shoulder_press' },
  { label: 'Triceps Extension', value: 'tricep_extension' },
  { label: 'Push Up', value: 'push_up' },
  { label: 'Pull Up', value: 'pull_up' },
  { label: 'Bench Pressing', value: 'bench_pressing' },
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
]

function App(): React.JSX.Element {
  const [sessionActive, setSessionActive] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [selectedExercise, setSelectedExercise] = useState(
    EXERCISES[0]?.value ?? 'bicep_curl'
  )
  const [repState, setRepState] = useState<RepCounterState>({
    exercise: null,
    reps: 0,
    confidence: 0,
    phase: 'UNKNOWN',
    activeArm: null,
  })
  const [classifierInferenceMs, setClassifierInferenceMs] = useState(-1)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [inferenceMs, setInferenceMs] = useState(-1)
  const [landmarks, setLandmarks] = useState<number[]>([])
  const [viewport, setViewport] = useState({
    width: DEFAULT_SIZE.width,
    height: DEFAULT_SIZE.height * 0.62,
  })

  const DEFAULT_EXERCISE_RECOGNITION_SETTINGS = {
    minConfidence: '0.4',
    smoothingWindow: '5',
    enterConfidence: '0.4',
    exitConfidence: '0.45',
    enterFrames: '3',
    exitFrames: '8',
    emaAlpha: '0.2',
    minVisibility: '0.2',
    minVisibleUpperBodyJoints: '4',
    nullExitWindowSeconds: '5',
    nullExitWindowThreshold: '0.99',
  }

  const [minConfidence, setMinConfidence] = useState(
    parseFloat(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.minConfidence)
  )
  const [enterConfidence, setEnterConfidence] = useState(
    parseFloat(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.enterConfidence)
  )
  const [exitConfidence, setExitConfidence] = useState(
    parseFloat(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.exitConfidence)
  )
  const [enterFrames, setEnterFrames] = useState(
    parseInt(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.enterFrames)
  )
  const [exitFrames, setExitFrames] = useState(
    parseInt(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.exitFrames)
  )
  const [emaAlpha, setEmaAlpha] = useState(
    parseFloat(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.emaAlpha)
  )
  const [erMinVisibility, setErMinVisibility] = useState(
    parseFloat(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.minVisibility)
  )
  const [minVisibleUpperBodyJoints, setMinVisibleUpperBodyJoints] = useState(
    parseInt(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.minVisibleUpperBodyJoints)
  )
  const [nullExitWindowSeconds, setNullExitWindowSeconds] = useState(
    parseFloat(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.nullExitWindowSeconds)
  )
  const [nullExitWindowThreshold, setNullExitWindowThreshold] = useState(
    parseFloat(DEFAULT_EXERCISE_RECOGNITION_SETTINGS.nullExitWindowThreshold)
  )

  const [inputMinVis, setInputMinVis] = useState('0.5')
  const [inputSampleRate, setInputSampleRate] = useState('30')
  const [inputRigidFrames, setInputRigidFrames] = useState('5')
  const [inputModelSel, setInputModelSel] = useState('0')
  const [inputOneEuroCutoff, setInputOneEuroCutoff] = useState('0.8')
  const [inputOneEuroBeta, setInputOneEuroBeta] = useState('0.1')
  const [inputMinConf, setInputMinConf] = useState('0.6')
  const [inputSmoothWin, setInputSmoothWin] = useState('5')
  const [inputEnterConf, setInputEnterConf] = useState('0.7')
  const [inputExitConf, setInputExitConf] = useState('0.4')
  const [inputEnterFrames, setInputEnterFrames] = useState('3')
  const [inputExitFrames, setInputExitFrames] = useState('5')
  const [inputEmaAlpha, setInputEmaAlpha] = useState('0.3')
  const [inputErMinVis, setInputErMinVis] = useState('0.5')
  const [inputMinUpperJoints, setInputMinUpperJoints] = useState('4')
  const [inputNullExitSec, setInputNullExitSec] = useState('2.0')
  const [inputNullExitThresh, setInputNullExitThresh] = useState('3')
  const [inputUpThresh, setInputUpThresh] = useState('150')
  const [inputDownThresh, setInputDownThresh] = useState('90')

  const [settingsVisible, setSettingsVisible] = useState(false)
  const repCounterRef = useRef(createRepCounter())

  const getExerciseLabel = useCallback((value: string | null) => {
    if (!value) return 'Unknown'
    return EXERCISES.find(item => item.value === value)?.label ?? value
  }, [])

  const applySettings = useCallback(() => {
    setMinConfidence(parseFloat(inputMinConf) || 0)
    setEnterConfidence(parseFloat(inputEnterConf) || 0)
    setExitConfidence(parseFloat(inputExitConf) || 0)
    setEnterFrames(parseInt(inputEnterFrames) || 0)
    setExitFrames(parseInt(inputExitFrames) || 0)
    setEmaAlpha(parseFloat(inputEmaAlpha) || 0)
    setErMinVisibility(parseFloat(inputErMinVis) || 0)
    setMinVisibleUpperBodyJoints(parseInt(inputMinUpperJoints) || 0)
    setNullExitWindowSeconds(parseFloat(inputNullExitSec) || 0)
    setNullExitWindowThreshold(parseInt(inputNullExitThresh) || 0)
    setSettingsVisible(false)
  }, [
    inputMinConf,
    inputEnterConf,
    inputExitConf,
    inputEnterFrames,
    inputExitFrames,
    inputEmaAlpha,
    inputErMinVis,
    inputMinUpperJoints,
    inputNullExitSec,
    inputNullExitThresh,
  ])

  useEffect(() => {
    return () => {
      repCounterRef.current.stopSession()
    }
  }, [])

  useEffect(() => {
    if (!sessionActive) return
    console.log('[App] Session starting, useAI:', useAI)

    if (useAI) {
      console.log('[App] Loading exercise model...')
      try {
        const loaded = exerciseRecognition.loadModelFromAsset(
          'exercise_classifier_rf.json'
        )
        console.log('[App] Model loaded:', loaded)
        setModelLoaded(loaded)
        if (!loaded) {
          console.error('[App] Failed to load model')
          setSessionActive(false)
          return
        }
      } catch (e) {
        console.error('[App] Exception loading model:', e)
        setModelLoaded(false)
        setSessionActive(false)
        return
      }
    } else {
      setModelLoaded(false)
    }

    if (PoseLandmarks == null) {
      console.error('[App] PoseLandmarks is null')
      setRepState(prev => ({ ...prev, phase: 'UNKNOWN' }))
      setSessionActive(false)
      return
    }

    console.log('[App] Initializing pose landmarker...')
    const initialized = PoseLandmarks.initPoseLandmarker(
      0.25,
      // inferenceSampleRateHz,
      // rigidBodyWindowFrames,
      // modelSelection,
      // enableVisibilityRecovery,
      // enableRigidBodyConstraint,
      // enableOneEuroFilter,
      // enableMotionPrediction,
      // oneEuroMinCutoff,
      // oneEuroBeta
    )
    console.log('[App] PoseLandmarker initialized:', initialized)
    if (!initialized) {
      console.error('[App] Failed to initialize pose landmarker')
      setRepState(prev => ({ ...prev, phase: 'UNKNOWN' }))
      setSessionActive(false)
      return
    }

    console.log('[App] Starting interval for landmarks...')
    const interval = setInterval(() => {
      try {
        const buffer = PoseLandmarks.getLandmarksBuffer()
        const inferenceMs = PoseLandmarks.getLastInferenceTimeMs()
        setInferenceMs(inferenceMs)

        if (
          !Array.isArray(buffer) ||
          buffer.length !== LANDMARK_COUNT * VALUES_PER_LANDMARK
        ) {
          return
        }

        setLandmarks(buffer)

        if (useAI) {
          exerciseRecognition.ingestLandmarksBuffer(buffer)
          const currentExercise = exerciseRecognition.getCurrentExercise()
          const confidence = exerciseRecognition.getCurrentConfidence()
          const exerciseToUse = currentExercise ?? selectedExercise
          const state = repCounterRef.current.update(buffer, exerciseToUse)
          setRepState({
            ...state,
            confidence,
            exercise: getExerciseLabel(state.exercise),
          })
          setClassifierInferenceMs(
            exerciseRecognition.getLastClassifierInferenceTimeMs()
          )
        } else {
          const state = repCounterRef.current.update(buffer, selectedExercise)
          setRepState({
            ...state,
            confidence: 0,
            exercise: getExerciseLabel(state.exercise),
          })
        }
      } catch (e) {
        console.error('[App] Error in interval:', e)
      }
    }, 66)

    return () => {
      console.log('[App] Cleaning up session')
      clearInterval(interval)
      PoseLandmarks.closePoseLandmarker()
    }
  }, [sessionActive, useAI, selectedExercise, getExerciseLabel])

  const onStart = useCallback(() => {
    console.log('[App] onStart called, useAI:', useAI)
    if (useAI) {
      console.log('[App] Starting exercise recognition session...')
      exerciseRecognition.startSession({
        minConfidence,
        enterConfidence,
        exitConfidence,
        enterFrames,
        exitFrames,
        emaAlpha,
        minVisibility: erMinVisibility,
        minVisibleUpperBodyJoints,
        nullExitWindowSeconds,
        nullExitWindowThreshold,
      })
      console.log('[App] Exercise recognition session started')
    }
    console.log('[App] Starting rep counter session...')
    repCounterRef.current.startSession({
      exercise: useAI ? null : selectedExercise,
    })
    console.log('[App] Rep counter session started')
    setRepState({
      exercise: useAI ? null : getExerciseLabel(selectedExercise),
      reps: 0,
      confidence: 0,
      phase: 'UNKNOWN',
      activeArm: null,
    })
    setClassifierInferenceMs(-1)
    setSessionActive(true)
    console.log('[App] Session active')
  }, [
    useAI,
    selectedExercise,
    minConfidence,
    enterConfidence,
    exitConfidence,
    enterFrames,
    exitFrames,
    emaAlpha,
    erMinVisibility,
    minVisibleUpperBodyJoints,
    nullExitWindowSeconds,
    nullExitWindowThreshold,
    getExerciseLabel,
  ])

  const onStop = useCallback(() => {
    console.log('[App] onStop called')
    setSessionActive(false)
    exerciseRecognition.stopSession()
    repCounterRef.current.stopSession()
    console.log('[App] Session stopped')
  }, [])

  const onReset = useCallback(() => {
    repCounterRef.current.resetReps()
    setRepState(prev => ({
      ...prev,
      reps: 0,
      phase: 'UNKNOWN',
    }))
  }, [])

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
      if (index >= 25) return null

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
            <View style={styles.hudHeader}>
              <Text style={styles.title}>Live Rep Counter</Text>
              <TouchableOpacity
                onPress={() => setSettingsVisible(true)}
                disabled={sessionActive}
              >
                <Text style={styles.settingsBtn}>⚙ Settings</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reps}>{repState.reps}</Text>
            <Text style={styles.phase}>Phase: {repState.phase}</Text>
            <Text style={styles.exercise}>
              {(repState.exercise ?? 'Unknown').toUpperCase()}
            </Text>
            <Text style={styles.meta}>
              Exercise confidence: {(repState.confidence * 100).toFixed(1)}%
            </Text>
            <Text style={styles.meta}>
              Landmark inference: {inferenceMs >= 0 ? `${inferenceMs.toFixed(0)} ms` : '--'}
            </Text>
            <Text style={styles.meta}>
              Classifier inference: {classifierInferenceMs >= 0 ? `${classifierInferenceMs.toFixed(1)} ms` : '--'}
            </Text>
            <Text style={styles.meta}>
              Exercise model: {modelLoaded ? 'loaded' : 'not loaded'}
            </Text>
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
            <Switch value={useAI} onValueChange={setUseAI} disabled={sessionActive} />
          </View>

          {!useAI && (
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Exercise:</Text>
              <View style={styles.exerciseButtons}>
                {EXERCISES.map(ex => (
                  <TouchableOpacity
                    key={ex.value}
                    style={[
                      styles.exerciseButton,
                      selectedExercise === ex.value && styles.exerciseButtonActive,
                    ]}
                    onPress={() => setSelectedExercise(ex.value)}
                    disabled={sessionActive}
                  >
                    <Text
                      style={[
                        styles.exerciseButtonText,
                        selectedExercise === ex.value && styles.exerciseButtonTextActive,
                      ]}
                    >
                      {ex.label}
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
        <Modal
          visible={settingsVisible}
          animationType="slide"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tuning Parameters</Text>
              <TouchableOpacity onPress={applySettings}>
                <Text style={styles.closeBtn}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.sectionTitle}>Pose Landmarker</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Min Visibility Confidence</Text>
                <TextInput
                  style={styles.input}
                  value={inputMinVis}
                  onChangeText={setInputMinVis}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Inference Sample Rate (Hz)</Text>
                <TextInput
                  style={styles.input}
                  value={inputSampleRate}
                  onChangeText={setInputSampleRate}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Rigid Body Window Frames</Text>
                <TextInput
                  style={styles.input}
                  value={inputRigidFrames}
                  onChangeText={setInputRigidFrames}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Model Selection (0=Lite, 1=Full)</Text>
                <TextInput
                  style={styles.input}
                  value={inputModelSel}
                  onChangeText={setInputModelSel}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>One Euro Min Cutoff</Text>
                <TextInput
                  style={styles.input}
                  value={inputOneEuroCutoff}
                  onChangeText={setInputOneEuroCutoff}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>One Euro Beta</Text>
                <TextInput
                  style={styles.input}
                  value={inputOneEuroBeta}
                  onChangeText={setInputOneEuroBeta}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={styles.sectionTitle}>Exercise Recognition</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Min Confidence</Text>
                <TextInput
                  style={styles.input}
                  value={inputMinConf}
                  onChangeText={setInputMinConf}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Smoothing Window</Text>
                <TextInput
                  style={styles.input}
                  value={inputSmoothWin}
                  onChangeText={setInputSmoothWin}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Enter Confidence</Text>
                <TextInput
                  style={styles.input}
                  value={inputEnterConf}
                  onChangeText={setInputEnterConf}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Exit Confidence</Text>
                <TextInput
                  style={styles.input}
                  value={inputExitConf}
                  onChangeText={setInputExitConf}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Enter Frames</Text>
                <TextInput
                  style={styles.input}
                  value={inputEnterFrames}
                  onChangeText={setInputEnterFrames}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Exit Frames</Text>
                <TextInput
                  style={styles.input}
                  value={inputExitFrames}
                  onChangeText={setInputExitFrames}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>EMA Alpha</Text>
                <TextInput
                  style={styles.input}
                  value={inputEmaAlpha}
                  onChangeText={setInputEmaAlpha}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Min Visibility</Text>
                <TextInput
                  style={styles.input}
                  value={inputErMinVis}
                  onChangeText={setInputErMinVis}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Min Visible Upper Body Joints</Text>
                <TextInput
                  style={styles.input}
                  value={inputMinUpperJoints}
                  onChangeText={setInputMinUpperJoints}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Null Exit Window (sec)</Text>
                <TextInput
                  style={styles.input}
                  value={inputNullExitSec}
                  onChangeText={setInputNullExitSec}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Null Exit Window Threshold</Text>
                <TextInput
                  style={styles.input}
                  value={inputNullExitThresh}
                  onChangeText={setInputNullExitThresh}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={styles.sectionTitle}>Rep Counter</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Up Threshold (deg)</Text>
                <TextInput
                  style={styles.input}
                  value={inputUpThresh}
                  onChangeText={setInputUpThresh}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Down Threshold (deg)</Text>
                <TextInput
                  style={styles.input}
                  value={inputDownThresh}
                  onChangeText={setInputDownThresh}
                  keyboardType="decimal-pad"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsBtn: {
    color: '#3fd4ff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a1118',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dceeff',
  },
  closeBtn: {
    color: '#3fd4ff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f6d66b',
    marginTop: 16,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#203446',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    color: '#dceeff',
  },
  input: {
    width: 80,
    backgroundColor: '#112131',
    color: '#f7fff8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'right',
  },
})

export default App
