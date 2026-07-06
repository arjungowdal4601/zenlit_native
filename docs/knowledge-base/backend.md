# Backend Knowledge Base

This file separates connected Supabase remote facts from local files. Do not assume a local migration exists remotely until the remote migration list confirms it.

## Connected Remote State

Read-only Supabase connector checks during this setup showed the remote public schema currently has these tables:

| Table | Notes |
| --- | --- |
| `profiles` | Public identity, email, required onboarding fields, optional completion marker, and push settings columns |
| `profile_basics_drafts` | Reinstall-safe draft storage for unfinished Profile Basics |
| `social_links` | Optional profile enrichment: bio, avatar/banner URLs, and socials |
| `posts` | Feed post content and optional image URL |
| `feedback` | User feedback and optional image URL |
| `locations` | Stored location coordinates for Radar |
| `messages` | Direct messages between users |

Remote view:

- `locations_current`

Remote RPCs from generated types:

- `authorize_chat_channel`
- `check_email_available`
- `check_username_available`
- `expire_stale_locations`
- `generate_username_suggestions`
- `get_unread_counts_direct`
- `get_unread_message_counts`
- `mark_direct_delivered`
- `mark_direct_read`
- `mark_messages_delivered`
- `mark_messages_read`

Local edge function source:

- `supabase/functions/send-push-notification/index.ts`
- `supabase/functions/update-conversation-anonymity/index.ts`

Storage buckets referenced by local migrations and app services:

- `profile-images`
- `post-images`
- `feedback-images`

## Local Migration Files

Local migrations are in `supabase/migrations/`. They include profile, social links, posts, feedback, location, messaging, push-notification cleanup, and onboarding draft support.

The local file `supabase/migrations/20260520090000_create_profile_basics_drafts.sql` creates `profile_basics_drafts` with:

- `id` linked to `auth.users.id`
- `display_name`
- `user_name`
- `date_of_birth`
- `gender`
- `updated_at`
- RLS policies that allow authenticated users to read, create, update, and delete only their own draft

`profile_basics_drafts` is required for reinstall-safe onboarding drafts. Read-only checks confirmed it exists in the active remote project.

## Known Local-vs-Remote Drift

No known onboarding schema drift in the active remote project as of July 6, 2026.

Read-only checks confirmed these remote migrations are applied:

- `20260520090000_create_profile_basics_drafts`
- `20260603175834_harden_profile_basics_drafts`
- `20260705161204_add_optional_profile_completion`

The remote schema includes `profile_basics_drafts` and `profiles.optional_profile_completed_at`.

## RLS Notes

Current table policies are designed around user-owned rows:

- Profiles and social links are owned by the authenticated user id.
- Posts are public to read and user-owned for writes.
- Feedback is user-owned.
- Locations are user-owned for writes and scoped for nearby discovery.
- Messages are limited to sender/receiver visibility and updates.
- Draft onboarding basics are user-owned in both the active remote project and local migration.

When editing policies, keep test accounts and onboarding recovery in mind. A user must be able to read their own partial draft and own profile during auth handoff.

## Type Generation

Generated database types are stored in `supabase/types.ts` and imported through `src/lib/types.ts`.

After an approved backend migration task, regenerate types from the same target project/environment that the app uses. Do not manually add types for a remote table that has not actually been applied.

## Safe Backend Workflow

1. Inspect current remote tables and migrations.
2. Add or edit local migration files.
3. Apply migrations only after explicit approval for backend changes.
4. Regenerate Supabase types from the target project.
5. Update services and tests.
6. Update this backend knowledge base with the new remote state.

This documentation/testing pass intentionally did not apply Supabase migrations or mutate the remote project.
