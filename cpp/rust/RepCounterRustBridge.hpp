#pragma once

#include <string>
#include <vector>

namespace margelo::nitro::repcounter {

class RepCounterRustBridge {
 public:
  RepCounterRustBridge();
  ~RepCounterRustBridge();

  void startSession(double upThresholdDeg, double downThresholdDeg);
  void stopSession();
  void setExercise(const std::string& exercise);
  void ingestLandmarksBuffer(const std::vector<double>& landmarks);
  void ingestLandmarksBufferWithExercise(
      const std::vector<double>& landmarks,
      const std::string& exercise);
  int getRepCount() const;
  std::string getCurrentPhase() const;
  void resetReps();

 private:
  void* handle_ = nullptr;
  int reps_ = 0;
  int phase_ = 0;
  std::string exercise_ = "unknown";
};

} // namespace margelo::nitro::repcounter
