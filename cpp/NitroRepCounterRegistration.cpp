#include "NitroRepCounterRegistration.hpp"
#include <jni.h>
#include <fbjni/fbjni.h>
#include <NitroModules/HybridObjectRegistry.hpp>
#include "JHybridHybridRepCounterSpec.hpp"

namespace margelo::nitro::repcounter {

struct JHybridRepCounterSpecImpl: public jni::JavaClass<JHybridRepCounterSpecImpl, JHybridHybridRepCounterSpec::JavaPart> {
  static constexpr auto kJavaDescriptor = "Lcom/margelo/nitro/repcounter/HybridRepCounter;";
  static std::shared_ptr<JHybridHybridRepCounterSpec> create() {
    static const auto constructorFn = javaClassStatic()->getConstructor<JHybridRepCounterSpecImpl::javaobject()>();
    jni::local_ref<JHybridHybridRepCounterSpec::JavaPart> javaPart = javaClassStatic()->newObject(constructorFn);
    return javaPart->getJHybridHybridRepCounterSpec();
  }
};

void registerHybridRepCounter() {
  HybridObjectRegistry::registerHybridObjectConstructor(
    "HybridRepCounter",
    []() -> std::shared_ptr<HybridObject> {
      return JHybridRepCounterSpecImpl::create();
    }
  );
}

}
