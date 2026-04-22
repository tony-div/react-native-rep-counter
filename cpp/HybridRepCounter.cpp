#include "HybridRepCounter.hpp"

#include "../nitrogen/generated/shared/c++/RepPhase.hpp"

namespace margelo::nitro::repcounter {

void HybridRepCounter::startSession(const std::optional<RepCounterConfig>& config) {
  if (config.has_value()) {
    if (config->upThresholdDeg.has_value()) {
      upThresholdDeg_ = config->upThresholdDeg.value();
    }
    if (config->downThresholdDeg.has_value()) {
      downThresholdDeg_ = config->downThresholdDeg.value();
    }
  }
  rust_.startSession(upThresholdDeg_, downThresholdDeg_);
}

void HybridRepCounter::stopSession() {
  rust_.stopSession();
}

void HybridRepCounter::ingestLandmarksBuffer(const std::vector<double>& landmarks) {
  rust_.ingestLandmarksBuffer(landmarks);
}

void HybridRepCounter::ingestLandmarksBufferWithExercise(
    const std::vector<double>& landmarks,
    const std::string& exercise) {
  rust_.ingestLandmarksBufferWithExercise(landmarks, exercise);
}

double HybridRepCounter::getRepCount() {
  return static_cast<double>(rust_.getRepCount());
}

RepPhase HybridRepCounter::getCurrentPhase() {
  const auto phase = rust_.getCurrentPhase();
  if (phase == "UP") {
    return RepPhase::UP;
  }
  if (phase == "DOWN") {
    return RepPhase::DOWN;
  }
  return RepPhase::UNKNOWN;
}

RepCounterState HybridRepCounter::getState() {
  RepCounterState state;
  state.reps = static_cast<double>(rust_.getRepCount());
  state.phase = getCurrentPhase();
  return state;
}

void HybridRepCounter::resetReps() {
  rust_.resetReps();
}

} // namespace margelo::nitro::repcounter
