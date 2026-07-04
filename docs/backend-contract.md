# Backend Contract

This document describes the app-level backend behavior that the UI depends on today. Supabase is still the active backend; the goal of this contract is to keep product code talking to app services instead of Supabase directly, so a future migration has a smaller surface area.

## Boundary Rule

UI code in `app/`, `src/components/`, `src/hooks/`, and `src/contexts/` must not import `src/lib/supabase` or `@supabase/supabase-js`.

Allowed Supabase-facing code lives in:

- `src/lib/supabase.ts`
- `src/services/**`
- `src/utils/realtime.ts`
- tests
- `supabase/**`

## Auth

The UI should use `src/services/authService.ts`.

Required behavior:

- Report whether auth is configured with `isAuthReady()` and `getAuthConfigStatus()`.
- Resolve the authenticated user as `{ id: string; email: string | null }`.
- Start email OTP sign in and verify email OTP codes.
- Sign out locally or globally.
- Subscribe to auth changes without exposing Supabase session objects.

## Onboarding

The UI should use `src/services/onboardingService.ts` and pure helpers from `src/utils/onboardingState.ts`.

Required behavior:

- Resolve whether the user is a guest, in recovery, missing required profile basics, on optional profile details, or allowed into the main app.
- Save required profile basics and optional profile details for the authenticated user only.
- Reject writes when a supplied route/user id does not match the authenticated user.
- Route recovery users back to profile basics or the main app as appropriate.

## Profiles

The UI should use `src/services/profileService.ts` for profile reads, profile updates, social-link updates, and username availability checks.

Required behavior:

- Load the current user's profile and social links.
- Load another user's profile and social links by id.
- Update display name and social links for the authenticated user.
- Check username availability and return suggestions without putting database reads in validation utilities.

## Posts

The UI should use `src/services/postService.ts`.

Required behavior:

- Create, read, and delete posts for the authenticated user.
- Load feed posts with author profile/social metadata.
- Keep post ownership checks at the service or app-auth-service boundary.

## Locations

The UI should use `src/services/locationService.ts` for device/location permissions and `src/services/locationDbService.ts` for persisted location behavior.

Required behavior:

- Save current location for visible users.
- Clear or disable stored location when the user is not visible.
- Load nearby users using the current user's location and selected social accounts.
- Determine whether another user is nearby for messaging anonymity.

## Messaging

The UI should use `src/services/messagingService.ts`.

Required behavior:

- Load message threads and messages between the current user and another user.
- Send messages.
- Mark messages delivered and read.
- Return unread counts grouped by sender.
- Preserve anonymity decisions based on nearby status.

## Realtime

The UI should use helpers from `src/utils/realtime.ts`; screens should not call `supabase.channel()` or `supabase.removeChannel()`.

Required behavior:

- Subscribe to Radar location insert/update events.
- Subscribe to message-list insert/update events for the current user.
- Subscribe to message-list partner location updates.
- Subscribe to unread-message insert events.
- For app-level helpers, expose payloads as `{ eventType: string; new: T | null; old: T | null }`.
- Keep Supabase-specific realtime types inside `src/utils/realtime.ts`.

## Storage

The UI should use `src/services/storageService.ts`.

Required behavior:

- Upload profile images, post images, and feedback images.
- Enforce app image-size constraints before upload.
- Return public URLs for successfully uploaded images.
- Delete replaced profile/banner images when appropriate.

## Notifications

The UI should use `src/services/notificationService.ts` for database persistence and `src/hooks/useNotifications.ts` for device permission/token orchestration.

Required behavior:

- Save the Expo push token to the authenticated user's profile.
- Remove the Expo push token from the authenticated user's profile.
- Load notification enabled state and preferences.
- Update notification enabled state and merge preference changes.

## Feedback

The UI should use `src/services/feedbackService.ts`.

Required behavior:

- Require authenticated feedback submission.
- Optionally upload an attached image.
- Insert the feedback message and image URL.

## Migration Notes

This is not a generic backend adapter. If the app later migrates to Convex or another backend, replace the service implementations first, then update service tests and this contract. The UI should need little to no direct backend rewrite if this boundary is maintained.
