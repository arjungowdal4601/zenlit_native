# Backend Knowledge Base

This file separates connected Supabase remote facts from local files. Do not assume a local migration exists remotely until the remote migration list confirms it.

## Connected Remote State

Read-only Supabase connector checks during this setup showed the remote public schema currently has these tables:

| Table | Notes |
| --- | --- |
| `profiles` | Public identity, email, required onboarding fields, and push settings columns |
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

`profile_basics_drafts` is required for reinstall-safe onboarding drafts and must be applied before relying on that behavior remotely.

## Known Local-vs-Remote Drift

The connected remote migration list currently ends before the local onboarding draft migration and does not show `20260520090000_create_profile_basics_drafts`.

Local files currently include `profile_basics_drafts` in:

- `supabase/migrations/20260520090000_create_profile_basics_drafts.sql`
- `supabase/types.ts`
- `supabase/schema_public.json`

Remote generated types from the connector did not include `profile_basics_drafts`.

Do not hide this drift in app documentation. Until the migration is applied remotely, draft-backed reinstall recovery can work only against environments where that table exists.

## RLS Notes

Current table policies are designed around user-owned rows:

- Profiles and social links are owned by the authenticated user id.
- Posts are public to read and user-owned for writes.
- Feedback is user-owned.
- Locations are user-owned for writes and scoped for nearby discovery.
- Messages are limited to sender/receiver visibility and updates.
- Draft onboarding basics are user-owned only in the local migration.

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
