#include <android/log.h>
#include <fbjni/fbjni.h>
#include <jni.h>

#include "NitroRepCounterOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  __android_log_print(ANDROID_LOG_DEBUG, "NitroRepCounter", "JNI_OnLoad(): initializing native module");
  return facebook::jni::initialize(vm, []() {
    __android_log_print(ANDROID_LOG_DEBUG, "NitroRepCounter", "JNI_OnLoad(): registering native bindings");
    margelo::nitro::repcounter::registerAllNatives();
    __android_log_print(ANDROID_LOG_DEBUG, "NitroRepCounter", "JNI_OnLoad(): native bindings registration complete");
  });
}
