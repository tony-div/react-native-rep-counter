#ifndef REP_COUNTER_CORE_H
#define REP_COUNTER_CORE_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct LandmarkFfi {
  float x;
  float y;
  float z;
  float visibility;
} LandmarkFfi;

typedef struct RepCounterStateFfi {
  uint32_t reps;
  int32_t phase;
} RepCounterStateFfi;

void* rc_new(void);
void rc_free(void* ptr);
void rc_reset_reps(void* ptr);
RepCounterStateFfi rc_step(
  void* ptr,
  const LandmarkFfi* landmarks_ptr,
  size_t landmarks_len,
  const char* exercise_label
);

#ifdef __cplusplus
}
#endif

#endif