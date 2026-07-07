# State Ownership

Zenlit has several state lifetimes: auth session, persisted onboarding data, form state, local preferences, route params, and post-auth realtime UI state. That is expected. The rule is that each state source has one owner, one write surface, and limited routing authority.

## Ownership Table

| State source | Owner | Who can write | Who can route |
| --- | --- | --- | --- |
| Supabase session | `src/services/authService.ts` over Supabase Auth | Supabase Auth through `authService` | Root gate |
| Onboarding status | `src/services/onboardingService.ts` + `src/utils/onboardingState.ts` | `onboardingService` only | Root gate primarily |
| OTP email/code | `src/hooks/useVerifyOtp.ts` | OTP screen hook only | OTP can only return to `/auth` |
| Profile Basics form | `src/hooks/useProfileBasicsOnboarding.ts` | Profile Basics flow only | Can move to `/onboarding/profile/complete` after save |
| Optional profile draft | `src/contexts/OnboardingProfileDraftContext.tsx` | Complete Profile flow only | No app-wide routing |
| Get Started seen | `src/utils/getStartedPreference.ts` | Get Started/root gate | Root gate |
| Profile Basics draft table | `profile_basics_drafts` through `onboardingService` | `onboardingService` only | No direct routing |
| Route params | Expo Router route files/hooks | Current route only | No app-wide routing |
| Visibility state | `src/contexts/VisibilityContext.tsx` | Visibility/Radar domain | Not onboarding |
| Messaging realtime state | `src/contexts/MessagingContext.tsx` | Messaging domain | Not onboarding |
| Notification state | `src/hooks/useNotifications.ts` and notification services | Notification domain | Not onboarding |

## Routing Contract

Only `src/hooks/useAuthOnboardingGate.ts` decides whether a user can enter post-auth app routes such as `/radar`. It uses `resolveOnboardingState`, `evaluateOnboardingState`, and `getAuthOnboardingRedirect` as the shared authority.

Screens can protect their own inputs, but they must stay narrow:

- OTP verifies/resends codes and can return to `/auth`.
- Profile Basics saves required basics and can move to `/onboarding/profile/complete`.
- Complete Profile saves or skips the optional marker and routes from the centralized resolved state.
- Recovery retries `resolveOnboardingState` or signs out.

Do not add independent Radar access decisions inside auth, onboarding, recovery, notification, visibility, or messaging screens. Optional social links, avatar, banner, bio, location permission, and Radar visibility must not block Radar after `profiles.optional_profile_completed_at` is set.
