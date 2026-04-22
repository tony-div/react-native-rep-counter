pub mod ffi;

pub const LANDMARK_COUNT: usize = 33;

const NOSE: usize = 0;
const L_SHOULDER: usize = 11;
const R_SHOULDER: usize = 12;
const L_ELBOW: usize = 13;
const R_ELBOW: usize = 14;
const L_WRIST: usize = 15;
const R_WRIST: usize = 16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Phase {
    Unknown,
    Up,
    Down,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Exercise {
    BicepCurl,
    FrontRaise,
    LateralRaise,
    ShoulderPress,
    TricepExtension,
    PushUp,
    PullUp,
    BenchPressing,
    Unknown,
}

impl Exercise {
    #[inline]
    pub fn from_str(s: &str) -> Self {
        match s {
            "bicep_curl" => Exercise::BicepCurl,
            "front_raise" => Exercise::FrontRaise,
            "lateral_raise" => Exercise::LateralRaise,
            "shoulder_press" => Exercise::ShoulderPress,
            "tricep_extension" => Exercise::TricepExtension,
            "push_up" => Exercise::PushUp,
            "pull_up" => Exercise::PullUp,
            "bench_pressing" => Exercise::BenchPressing,
            _ => Exercise::Unknown,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Landmark {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub visibility: f32,
}

#[derive(Debug, Clone, Copy)]
pub struct RepCounterState {
    pub reps: u32,
    pub phase: Phase,
}

#[derive(Debug, Clone, Copy)]
pub struct RepCounter {
    reps: u32,
    phase: Phase,
}

impl Default for RepCounter {
    #[inline]
    fn default() -> Self {
        Self {
            reps: 0,
            phase: Phase::Unknown,
        }
    }
}

impl RepCounter {
    #[inline]
    pub fn new() -> Self {
        Self::default()
    }

    #[inline]
    pub fn reset_reps(&mut self) {
        self.reps = 0;
        self.phase = Phase::Unknown;
    }

    #[inline]
    pub fn reps(&self) -> u32 {
        self.reps
    }

    #[inline]
    pub fn phase(&self) -> Phase {
        self.phase
    }

    #[inline]
    pub fn state(&self) -> RepCounterState {
        RepCounterState {
            reps: self.reps,
            phase: self.phase,
        }
    }

    #[inline]
    pub fn step(&mut self, landmarks: &[Landmark], exercise: Exercise) -> RepCounterState {
        if landmarks.len() < LANDMARK_COUNT {
            return self.state();
        }

        let prev = self.phase;
        update_phase(landmarks, exercise, self);
        if prev == Phase::Down && self.phase == Phase::Up {
            self.reps = self.reps.saturating_add(1);
        }
        self.state()
    }
}

#[inline]
fn angle_between(a: &Landmark, b: &Landmark, c: &Landmark) -> f32 {
    let bax = a.x - b.x;
    let bay = a.y - b.y;
    let baz = a.z - b.z;

    let bcx = c.x - b.x;
    let bcy = c.y - b.y;
    let bcz = c.z - b.z;

    let ba_norm = (bax * bax + bay * bay + baz * baz).sqrt();
    let bc_norm = (bcx * bcx + bcy * bcy + bcz * bcz).sqrt();
    let denom = ba_norm * bc_norm + 1e-8;

    let mut cos_val = (bax * bcx + bay * bcy + baz * bcz) / denom;
    cos_val = cos_val.clamp(-1.0, 1.0);

    cos_val.acos().to_degrees()
}

#[inline]
fn r_elbow_angle(landmarks: &[Landmark]) -> f32 {
    angle_between(
        &landmarks[R_SHOULDER],
        &landmarks[R_ELBOW],
        &landmarks[R_WRIST],
    )
}

#[inline]
fn l_elbow_angle(landmarks: &[Landmark]) -> f32 {
    angle_between(
        &landmarks[L_SHOULDER],
        &landmarks[L_ELBOW],
        &landmarks[L_WRIST],
    )
}

#[inline]
fn avg_elbow_angle(landmarks: &[Landmark]) -> f32 {
    (r_elbow_angle(landmarks) + l_elbow_angle(landmarks)) / 2.0
}

fn update_phase(landmarks: &[Landmark], exercise: Exercise, rc: &mut RepCounter) {
    let r_sh_y = landmarks[R_SHOULDER].y;
    let l_sh_y = landmarks[L_SHOULDER].y;
    let r_wr_y = landmarks[R_WRIST].y;
    let l_wr_y = landmarks[L_WRIST].y;
    let nose_y = landmarks[NOSE].y;

    let wrist_y = (r_wr_y + l_wr_y) / 2.0;
    let shoulder_y = (r_sh_y + l_sh_y) / 2.0;
    let elbow = avg_elbow_angle(landmarks);

    match exercise {
        Exercise::BicepCurl => {
            if elbow < 70.0 {
                rc.phase = Phase::Up;
            } else if elbow > 145.0 {
                rc.phase = Phase::Down;
            }
        }
        Exercise::FrontRaise | Exercise::LateralRaise => {
            if wrist_y < shoulder_y {
                rc.phase = Phase::Up;
            } else if wrist_y > shoulder_y + 0.10 {
                rc.phase = Phase::Down;
            }
        }
        Exercise::ShoulderPress => {
            if wrist_y < nose_y {
                rc.phase = Phase::Up;
            } else if wrist_y > shoulder_y {
                rc.phase = Phase::Down;
            }
        }
        Exercise::TricepExtension => {
            if elbow > 155.0 {
                rc.phase = Phase::Up;
            } else if elbow < 90.0 {
                rc.phase = Phase::Down;
            }
        }
        Exercise::PushUp => {
            if elbow > 145.0 {
                rc.phase = Phase::Up;
            } else if elbow < 95.0 {
                rc.phase = Phase::Down;
            }
        }
        Exercise::PullUp => {
            if nose_y < wrist_y {
                rc.phase = Phase::Up;
            } else if nose_y > wrist_y + 0.08 {
                rc.phase = Phase::Down;
            }
        }
        Exercise::BenchPressing => {
            if elbow > 150.0 {
                rc.phase = Phase::Up;
            } else if elbow < 85.0 {
                rc.phase = Phase::Down;
            }
        }
        Exercise::Unknown => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn empty_frame() -> [Landmark; LANDMARK_COUNT] {
        [Landmark {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            visibility: 1.0,
        }; LANDMARK_COUNT]
    }

    fn frame_with(
        r_sh_x: f32, r_sh_y: f32,
        l_sh_x: f32, l_sh_y: f32,
        r_el_x: f32, r_el_y: f32,
        l_el_x: f32, l_el_y: f32,
        r_wr_x: f32, r_wr_y: f32,
        l_wr_x: f32, l_wr_y: f32,
        nose_y: f32,
    ) -> [Landmark; LANDMARK_COUNT] {
        let mut f = empty_frame();
        f[R_SHOULDER] = Landmark { x: r_sh_x, y: r_sh_y, z: 0.0, visibility: 1.0 };
        f[L_SHOULDER] = Landmark { x: l_sh_x, y: l_sh_y, z: 0.0, visibility: 1.0 };
        f[R_ELBOW] = Landmark { x: r_el_x, y: r_el_y, z: 0.0, visibility: 1.0 };
        f[L_ELBOW] = Landmark { x: l_el_x, y: l_el_y, z: 0.0, visibility: 1.0 };
        f[R_WRIST] = Landmark { x: r_wr_x, y: r_wr_y, z: 0.0, visibility: 1.0 };
        f[L_WRIST] = Landmark { x: l_wr_x, y: l_wr_y, z: 0.0, visibility: 1.0 };
        f[NOSE] = Landmark { x: 0.5, y: nose_y, z: 0.0, visibility: 1.0 };
        f
    }

    #[test]
    fn bicep_curl_transitions() {
        let mut rc = RepCounter::new();
        // straight arm (extended) = elbow angle > 145 = DOWN
        let f1 = frame_with(
            0.5, 0.5, 0.5, 0.5,
            0.5, 0.3,
            0.5, 0.3,
            0.5, 0.5,
            0.5, 0.5,
            0.5,
        );
        let s1 = rc.step(&f1, Exercise::BicepCurl);
        assert_eq!(s1.phase, Phase::Down);

        // bent arm = elbow angle < 70 = UP
        let f2 = frame_with(
            0.5, 0.5, 0.5, 0.5,
            0.3, 0.5,
            0.7, 0.5,
            0.1, 0.5,
            0.9, 0.5,
            0.5,
        );
        let s2 = rc.step(&f2, Exercise::BicepCurl);
        assert_eq!(s2.phase, Phase::Up);
        assert_eq!(s2.reps, 1);
    }

    #[test]
    fn pull_up_counts_rep() {
        let mut rc = RepCounter::new();
        let f1 = frame_with(
            0.5, 0.5, 0.5, 0.5,
            0.5, 0.3,
            0.5, 0.3,
            0.5, 0.4,
            0.5, 0.4,
            0.5,
        );
        let s1 = rc.step(&f1, Exercise::PullUp);
        assert_eq!(s1.phase, Phase::Down);
        assert_eq!(s1.reps, 0);

        let f2 = frame_with(
            0.5, 0.5, 0.5, 0.5,
            0.5, 0.3,
            0.5, 0.3,
            0.5, 0.6,
            0.5, 0.6,
            0.5,
        );
        let s2 = rc.step(&f2, Exercise::PullUp);
        assert_eq!(s2.phase, Phase::Up);
        assert_eq!(s2.reps, 1);
    }

    #[test]
    fn shoulder_press_counts_rep() {
        let mut rc = RepCounter::new();
        let f1 = frame_with(
            0.5, 0.5, 0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.6,
            0.5, 0.6,
            0.5,
        );
        let s1 = rc.step(&f1, Exercise::ShoulderPress);
        assert_eq!(s1.phase, Phase::Down);
        assert_eq!(s1.reps, 0);

        let f2 = frame_with(
            0.5, 0.5, 0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.3,
            0.5, 0.3,
            0.5,
        );
        let s2 = rc.step(&f2, Exercise::ShoulderPress);
        assert_eq!(s2.phase, Phase::Up);
        assert_eq!(s2.reps, 1);
    }

    #[test]
    fn reset_clears_reps() {
        let mut rc = RepCounter::new();
        let f = frame_with(
            0.5, 0.5, 0.5, 0.5,
            0.3, 0.3,
            0.7, 0.3,
            0.1, 0.15,
            0.9, 0.15,
            0.5,
        );
        rc.step(&f, Exercise::BicepCurl);
        rc.reset_reps();
        assert_eq!(rc.reps(), 0);
        assert_eq!(rc.phase(), Phase::Unknown);
    }
}