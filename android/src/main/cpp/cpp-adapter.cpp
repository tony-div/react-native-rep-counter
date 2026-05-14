#include <jni.h>
#include <fbjni/fbjni.h>
#include "NitroRepCounterOnLoad.hpp"
#include "NitroRepCounterRegistration.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, []() {
    margelo::nitro::repcounter::registerAllNatives();
    margelo::nitro::repcounter::registerHybridRepCounter();
  });
}
