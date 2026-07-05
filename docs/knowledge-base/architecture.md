# Architecture Knowledge Base

This file documents the current structure. It is not a redesign plan and does not imply runtime code should be reorganized in this pass.

## App Shape

Zenlit is an Expo Router app. The current product direction is web-first, native-ready: ship the browser MVP on Vercel now while keeping core logic and reusable UI portable for future native apps. Screens live in `app/`, shared UI and services live in `src/`, and Supabase migrations/functions live in `supabase/`.

The main app tabs are:

- Radar: `app/radar.tsx`
- Feed: `app/feed.tsx`
- Create: `app/create.tsx`
- Chat: `app/messages/index.tsx`
- Profile: `app/profile/index.tsx`

Bottom navigation is rendered by `src/components/Navigation.tsx`, but only after `app/_layout.tsx` confirms the authenticated user can access the main app.

## Route Map

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `app/index.tsx` | Minimal Get Started screen |
| `/auth` | `app/auth/index.tsx` | Email entry and OTP request |
| `/auth/signup` | `app/auth/signup.tsx` | Auth variant route kept for compatibility |
| `/auth/verify-otp` | `app/auth/verify-otp.tsx` | OTP verification handoff |
| `/onboarding/profile/basic` | `app/onboarding/profile/basic.tsx` | Mandatory Profile Basics, Step 1 of 2 |
| `/onboarding/profile/complete` | `app/onboarding/profile/complete.tsx` | Optional Profile Details, Step 2 of 2 |
| `/onboarding/recovery` | `app/onboarding/recovery.tsx` | Recovery for incomplete or ambiguous setup |
| `/radar` | `app/radar.tsx` | Home screen and first proximity entry |
| `/feed` | `app/feed.tsx` | Feed |
| `/create` | `app/create.tsx` | Post creation |
| `/messages` | `app/messages/index.tsx` | Chat list |
| `/messages/[id]` | `app/messages/[id].tsx` | Direct message thread |
| `/profile` | `app/profile/index.tsx` | Current user profile |
| `/profile/[id]` | `app/profile/[id].tsx` | Public profile |
| `/edit-profile` | `app/edit-profile.tsx` | Edit current profile |
| `/feedback` | `app/feedback.tsx` | Feedback form |
| `/notification-settings` | `app/notification-settings.tsx` | Notification preferences |
| `/terms` | `app/terms.tsx` | Draft Terms of Service |
| `/privacy` | `app/privacy.tsx` | Draft Privacy Policy |

## Onboarding And Auth Boundary

The onboarding decision is centralized:

- `src/services/onboardingService.ts` reads Supabase state and writes onboarding profile data.
- `src/utils/onboardingState.ts` evaluates raw profile, draft, and optional detail records.
- `src/utils/authNavigation.ts` exposes app route helpers for layout and screen handoffs.
- `app/_layout.tsx` gates startup, auth changes, main app access, and bottom navigation.

Do not add separate final route decisions inside onboarding screens. Screens should save or skip data, call the shared resolver, and route using the shared route helper.

Current onboarding states:

- Guest user
- Authenticated user while setup is being checked
- Profile Basics required
- Optional Profile Details available
- Fully onboarded
- Recovery

Required basics are `display_name`, `user_name`, `date_of_birth`, and `gender`. Optional details are stored separately and must not block Radar.

## First Radar Entry

Radar is the home screen after onboarding. Location permission is requested in context on Radar, not during Get Started, OTP, or profile setup.

Radar-specific gates are separate from onboarding:

- Permission needed
- Permission denied
- Visibility off
- Discovery-ready state

Do not route back into onboarding because location permission is denied or Radar visibility is off.

## Web Shell Direction

Current launch work should optimize the browser app:

- Vercel deploys the Expo web export from `dist/`.
- `app.json` keeps `web.output` as `single` because authenticated dynamic routes need SPA refresh behavior.
- Mobile Safari and mobile Chrome are the first browser QA targets.
- Native app store, native push, and native build pipeline work stays future/traction-gated.

## Shared Boundaries

| Area | Change Here |
| --- | --- |
| Auth and root route gating | `app/_layout.tsx`, `src/utils/authNavigation.ts` |
| Onboarding state rules | `src/utils/onboardingState.ts` |
| Profile basics save/skip/resolve calls | `src/services/onboardingService.ts` |
| Field validation | `src/utils/profileValidation.ts` |
| Social username/link parsing | `src/constants/socialPlatforms.ts` |
| Supabase client setup | `src/lib/supabase.ts` |
| Bottom tab labels and active route behavior | `src/components/Navigation.tsx` |
| Radar location/visibility UI | `app/radar.tsx`, `src/contexts/VisibilityContext.tsx` |
| Messaging data | `src/services/messagingService.ts`, `src/contexts/MessagingContext.tsx` |
| Profile data | `src/services/profileService.ts`, `src/contexts/ProfileContext.tsx` |
| Storage uploads | `src/services/storageService.ts` |

## Files Worth Future Splitting

These files are functional but large enough that future feature work should consider smaller units:

- `app/messages/[id].tsx`
- `app/edit-profile.tsx`
- `app/onboarding/profile/basic.tsx`
- `app/onboarding/profile/complete.tsx`
- `app/radar.tsx`

Keep future splits behavior-preserving and covered by tests. Avoid moving runtime code only for cosmetic organization.
