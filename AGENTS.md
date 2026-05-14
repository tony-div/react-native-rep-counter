# AGENTS.md

## Scope
- This project is `react-native-rep-counter/`, a TypeScript-only library for counting reps from pose landmarks.
- Core logic is in `src/repCounter.ts` and mirrors `ai/Rep Counting/rep_counter_interface.py`.
- Example app lives in `example/` and only wraps the library for UI testing.

## Key Files
- `src/repCounter.ts` - core rep counting state machine and worker queue
- `src/index.ts` - public exports
- `example/App.tsx` - live HUD with pose + exercise + reps

## Commands
- Install: `npm install`
- Typecheck: `npm run typecheck`
- Build TS output (`lib/`): `npm run typescript`

## Notes
- No native code or Nitro modules remain in this package.
- `createRepCounterWorker()` is the recommended entrypoint to avoid UI thread blocking.
