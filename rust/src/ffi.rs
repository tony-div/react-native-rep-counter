use crate::{Exercise, Landmark, Phase, RepCounter, LANDMARK_COUNT};
use core::ffi::CStr;
use core::slice;

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct LandmarkFfi {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub visibility: f32,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct RepCounterStateFfi {
    pub reps: u32,
    pub phase: i32,
}

#[inline]
fn phase_to_i32(phase: Phase) -> i32 {
    match phase {
        Phase::Unknown => 0,
        Phase::Up => 1,
        Phase::Down => 2,
    }
}

#[inline]
fn string_to_exercise(ptr: *const core::ffi::c_char) -> Exercise {
    if ptr.is_null() {
        return Exercise::Unknown;
    }
    let cstr = unsafe { CStr::from_ptr(ptr) };
    let s = cstr.to_string_lossy();
    Exercise::from_str(&s)
}

#[unsafe(no_mangle)]
pub extern "C" fn rc_new() -> *mut RepCounter {
    eprintln!("[RepCounter] rc_new() called");
    let rc = RepCounter::new();
    Box::into_raw(Box::new(rc))
}

#[unsafe(no_mangle)]
pub extern "C" fn rc_free(ptr: *mut RepCounter) {
    eprintln!("[RepCounter] rc_free() called with ptr={:?}", ptr);
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn rc_reset_reps(ptr: *mut RepCounter) {
    if ptr.is_null() {
        return;
    }
    let rc = unsafe { &mut *ptr };
    rc.reset_reps();
}

#[unsafe(no_mangle)]
pub extern "C" fn rc_step(
    ptr: *mut RepCounter,
    landmarks_ptr: *const LandmarkFfi,
    landmarks_len: usize,
    exercise_label: *const core::ffi::c_char,
) -> RepCounterStateFfi {
    eprintln!("[RepCounter] rc_step() called with ptr={:?}, landmarks_len={}", ptr, landmarks_len);
    if ptr.is_null() {
        eprintln!("[RepCounter] rc_step() - ptr is null!");
        return RepCounterStateFfi { reps: 0, phase: 0 };
    }

    let rc = unsafe { &mut *ptr };
    let exercise = string_to_exercise(exercise_label);
    eprintln!("[RepCounter] rc_step() - exercise={:?}", exercise);

    if landmarks_ptr.is_null() || landmarks_len < LANDMARK_COUNT {
        eprintln!("[RepCounter] rc_step() - invalid landmarks, returning current state");
        let s = rc.state();
        return RepCounterStateFfi {
            reps: s.reps,
            phase: phase_to_i32(s.phase),
        };
    }

    let lm_ffi = unsafe { slice::from_raw_parts(landmarks_ptr, landmarks_len) };

    let mut frame = [Landmark {
        x: 0.0,
        y: 0.0,
        z: 0.0,
        visibility: 1.0,
    }; LANDMARK_COUNT];

    for (dst, src) in frame.iter_mut().zip(lm_ffi.iter().take(LANDMARK_COUNT)) {
        *dst = Landmark {
            x: src.x,
            y: src.y,
            z: src.z,
            visibility: src.visibility,
        };
    }

    let s = rc.step(&frame, exercise);
    RepCounterStateFfi {
        reps: s.reps,
        phase: phase_to_i32(s.phase),
    }
}