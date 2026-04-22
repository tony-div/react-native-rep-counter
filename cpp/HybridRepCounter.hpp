#pragma once

#include "../nitrogen/generated/shared/c++/HybridRepCounterSpec.hpp"
#include "rust/RepCounterRustBridge.hpp"

#include <optional>
#include <string>
#include <vector>

namespace margelo::nitro::repcounter {

class HybridRepCounter : public HybridRepCounterSpec {
 public:
  HybridRepCounter() : HybridObject(TAG) {}

 public:
  void startSession(const std::optional<RepCounterConfig>& config) override;
  void stopSession() override;
  void ingestLandmarksBuffer(const std::vector<double>& landmarks) override;
  void ingestLandmarksBufferWithExercise(
      const std::vector<double>& landmarks,
      const std::string& exercise) override;
  double getRepCount() override;
  RepPhase getCurrentPhase() override;
  RepCounterState getState() override;
  void resetReps() override;

 private:
  RepCounterRustBridge rust_;
  double upThresholdDeg_ = 150.0;
  double downThresholdDeg_ = 90.0;
};

} // namespace margelo::nitro::repcounter
