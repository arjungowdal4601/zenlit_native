# Testing Knowledge Base

Zenlit uses Jest with `jest-expo` and React Native Testing Library for the first test layer. The goal is fast confidence around routing, onboarding state, validation, and high-risk UI gates without real Supabase, real device location, push services, or image pickers.

## Commands

```bash
npm run typecheck
npm run test:unit
npm run test:ui
npm test
npm run build
npm run verify
```

`npm run verify` runs typecheck, the full Jest suite, and web export.

## Test Layout

Tests must stay outside `app/`.

| Path | Purpose |
| --- | --- |
| `test/setup/jest.setup.tsx` | Jest setup, Expo/native mocks, Supabase test double |
| `test/utils/render.tsx` | Shared React Native render exports |
| `test/unit/` | Pure logic tests |
| `test/ui/` | React Native UI and router tests |

## Current Starter Coverage

Unit:

- `test/unit/onboardingState.test.ts`: guest/checking/profile-basics/recovery/Radar routing and username ownership rules
- `test/unit/profileValidation.test.ts`: required profile basics validation
- `test/unit/socialPlatforms.test.ts`: social username/link parsing

UI/router:

- `test/ui/getStarted.test.tsx`: Get Started copy and CTA route behavior
- `test/ui/navigation.test.tsx`: bottom navigation tab labels and unread Chat accessibility copy
- `test/ui/radarGate.test.tsx`: Radar permission and visibility gated states
- `test/ui/router.test.tsx`: Expo Router smoke test with `expo-router/testing-library`

## Mock Strategy

`test/setup/jest.setup.tsx` provides default mocks for:

- AsyncStorage
- Expo notifications
- Expo location
- Expo font loading
- Expo image picker
- Expo linear gradient
- React Native safe area
- Icons
- Supabase auth, query builder, RPCs, realtime channels, and storage

Keep mocks boring and deterministic. Test files can override a mock for a scenario, but should reset changes after the test.

## When To Add Tests

Add unit tests when changing:

- Onboarding state evaluation
- Route helpers
- Profile field validation
- Social URL/username parsing
- Any pure formatter or parser

Add UI tests when changing:

- Onboarding screens
- Auth handoff screens
- Root layout gating
- Bottom navigation visibility/labels
- Radar permission or visibility states
- Error/loading/recovery copy

Add future E2E/device tests when changing:

- Real OTP sign-in flows
- Native location permission flows
- Image picker uploads
- Push notification delivery
- Supabase Realtime message delivery

E2E testing is intentionally deferred in this foundation pass.

## Router Testing

Use `expo-router/testing-library` for small route-state tests. Do not place test-only route files under `app/`; define in-memory routes inside the test.

Router tests should assert public behavior such as current pathname or visible screen output, not Expo Router internals.

## Supabase In Tests

Do not hit the real Supabase project from Jest. The shared setup mocks `src/lib/supabase`, including query chaining, auth, RPC, realtime, and storage surfaces.

If a service needs more realistic behavior, add a local test helper or override the shared mock in that test file. Keep the default mock safe for UI tests that import full screens.

## Build Output

`npm run build` can recreate `dist/`. That folder is ignored and excluded from TypeScript checks. Do not add tests or source imports from `dist/`.
