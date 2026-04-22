# AGENTS.md

## Scope
- This project is `react-native-rep-counter/`, a Nitro module for counting exercise reps.
- Uses Rust for performance-critical rep counting logic.
- Peer dependencies: `react-native-nitro-modules`, `react-native-exercise-recognition`, `react-native-pose-landmarks`.

## Key Files
- `rust/src/lib.rs` - Rust rep counting implementation with per-exercise thresholds
- `rust/src/ffi.rs` - FFI bindings for C++ bridge
- `cpp/rust/RepCounterRustBridge.cpp` - C++ wrapper calling Rust FFI
- `src/specs/RepCounter.nitro.ts` - Nitro module spec
- `example/App.tsx` - Example app with HUD

## When to Build

### Run `npm run android` / full build:
- Native code changes (Rust, C++, Kotlin, Swift)
- New native dependencies added
- Gradle build files modified
- New npm packages with native code installed

### JS/TS edits only - NO build needed:
- Changes to `example/App.tsx` (or other TSX files)
- Changes to Nitro spec files (`.nitro.ts`) - regenerate specs only
- TypeScript edits

### Generate Nitro Specs (no build):
```bash
cd react-native-rep-counter && npm run specs
```

## Build Commands
- Generate specs: `npm run specs`
- Typecheck: `npm run typecheck`
- Build example: Run from `example/` - `npm run android`
- Build Rust locally: `cd rust && cargo build --release --target <triple>`

## Non-Obvious Gotchas
- Rust `Cargo.toml` crate-type must be `["staticlib"]` only for Android (no cdylib)
- Prebuilt Rust binaries in `android/prebuilt/` - CMakeLists.txt checks prebuilt first, falls back to building
- Exercise labels passed as strings from C++ to Rust via FFI
- Example assets must include MediaPipe models and classifier model