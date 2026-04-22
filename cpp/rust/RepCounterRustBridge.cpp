#include "RepCounterRustBridge.hpp"

#include <android/log.h>
#include <array>

#if defined(EXREC_USE_RUST)
extern "C" {
void* rc_new(void);
void rc_free(void* ptr);
void rc_reset_reps(void* ptr);

typedef struct LandmarkFfi {
  float x;
  float y;
  float z;
  float visibility;
} LandmarkFfi;

typedef struct RepCounterStateFfi {
  unsigned int reps;
  int phase;
} RepCounterStateFfi;

RepCounterStateFfi rc_step(
  void* ptr,
  const LandmarkFfi* landmarks_ptr,
  size_t landmarks_len,
  const char* exercise_label
);
}
#endif

namespace margelo::nitro::repcounter {

namespace {

constexpr size_t kLandmarkCount = 33;
constexpr size_t kValuesPerLandmark = 4;

std::string phaseToString(int phase) {
  switch (phase) {
    case 1:
      return "UP";
    case 2:
      return "DOWN";
    default:
      return "UNKNOWN";
  }
}

} // namespace

RepCounterRustBridge::RepCounterRustBridge() = default;

RepCounterRustBridge::~RepCounterRustBridge() {
#if defined(EXREC_USE_RUST)
  if (handle_ != nullptr) {
    rc_free(handle_);
    handle_ = nullptr;
  }
#endif
}

void RepCounterRustBridge::startSession(double upThresholdDeg, double downThresholdDeg) {
  __android_log_print(ANDROID_LOG_INFO, "RepCounter", "startSession called: upThresholdDeg=%.1f, downThresholdDeg=%.1f, handle_=%p", upThresholdDeg, downThresholdDeg, handle_);
#if defined(EXREC_USE_RUST)
  if (handle_ != nullptr) {
    __android_log_print(ANDROID_LOG_INFO, "RepCounter", "startSession: freeing existing handle");
    rc_free(handle_);
  }
  __android_log_print(ANDROID_LOG_INFO, "RepCounter", "startSession: creating new handle");
  handle_ = rc_new();
  __android_log_print(ANDROID_LOG_INFO, "RepCounter", "startSession: new handle=%p", handle_);
#else
  __android_log_print(ANDROID_LOG_WARN, "RepCounter", "startSession: EXREC_USE_RUST not defined!");
  (void)upThresholdDeg;
  (void)downThresholdDeg;
#endif
  reps_ = 0;
  phase_ = 0;
  exercise_ = "unknown";
}

void RepCounterRustBridge::stopSession() {
#if defined(EXREC_USE_RUST)
  if (handle_ != nullptr) {
    rc_free(handle_);
    handle_ = nullptr;
  }
#endif
  reps_ = 0;
  phase_ = 0;
  exercise_ = "unknown";
}

void RepCounterRustBridge::setExercise(const std::string& exercise) {
  exercise_ = exercise;
}

void RepCounterRustBridge::ingestLandmarksBuffer(const std::vector<double>& landmarks) {
  ingestLandmarksBufferWithExercise(landmarks, exercise_);
}

void RepCounterRustBridge::ingestLandmarksBufferWithExercise(
    const std::vector<double>& landmarks,
    const std::string& exercise) {
  __android_log_print(ANDROID_LOG_INFO, "RepCounter", "ingestLandmarksBufferWithExercise: size=%zu, exercise=%s, handle_=%p", landmarks.size(), exercise.c_str(), handle_);
  if (landmarks.size() < kLandmarkCount * kValuesPerLandmark) {
    __android_log_print(ANDROID_LOG_WARN, "RepCounter", "ingestLandmarksBufferWithExercise: invalid size %zu < %zu", landmarks.size(), kLandmarkCount * kValuesPerLandmark);
    return;
  }

#if defined(EXREC_USE_RUST)
  if (handle_ == nullptr) {
    __android_log_print(ANDROID_LOG_INFO, "RepCounter", "ingestLandmarksBufferWithExercise: handle is null, creating new");
    handle_ = rc_new();
  }

  std::array<LandmarkFfi, kLandmarkCount> frame {};
  for (size_t i = 0; i < kLandmarkCount; ++i) {
    const size_t base = i * kValuesPerLandmark;
    frame[i].x = static_cast<float>(landmarks[base]);
    frame[i].y = static_cast<float>(landmarks[base + 1]);
    frame[i].z = static_cast<float>(landmarks[base + 2]);
    frame[i].visibility = static_cast<float>(landmarks[base + 3]);
  }

  const RepCounterStateFfi state =
      rc_step(handle_, frame.data(), frame.size(), exercise.c_str());
  __android_log_print(ANDROID_LOG_INFO, "RepCounter", "ingestLandmarksBufferWithExercise: result reps=%u, phase=%d", state.reps, state.phase);
  reps_ = static_cast<int>(state.reps);
  phase_ = state.phase;
#else
  __android_log_print(ANDROID_LOG_WARN, "RepCounter", "ingestLandmarksBufferWithExercise: EXREC_USE_RUST not defined!");
#endif
  (void)exercise;
}

int RepCounterRustBridge::getRepCount() const {
  return reps_;
}

std::string RepCounterRustBridge::getCurrentPhase() const {
  return phaseToString(phase_);
}

void RepCounterRustBridge::resetReps() {
#if defined(EXREC_USE_RUST)
  if (handle_ != nullptr) {
    rc_reset_reps(handle_);
  }
#endif
  reps_ = 0;
  phase_ = 0;
}

} // namespace margelo::nitro::repcounter
