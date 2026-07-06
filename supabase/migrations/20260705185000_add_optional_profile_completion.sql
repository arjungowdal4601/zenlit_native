/*
  # Add explicit optional profile completion

  `social_links` content is optional profile data, not onboarding state. Keep a
  small durable marker on profiles so skipping Complete Profile does not require
  writing an empty social_links row.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS optional_profile_completed_at timestamptz NULL;

UPDATE public.profiles AS profiles
SET optional_profile_completed_at = COALESCE(
  profiles.optional_profile_completed_at,
  social_links.updated_at,
  social_links.created_at,
  profiles.account_created_at,
  now()
)
FROM public.social_links AS social_links
WHERE social_links.id = profiles.id
  AND profiles.optional_profile_completed_at IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE user_name !~ '^[a-z0-9._]+$'
  ) THEN
    RAISE EXCEPTION 'Cannot tighten profiles username constraint while invalid usernames exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profile_basics_drafts
    WHERE user_name IS NOT NULL
      AND user_name !~ '^[a-z0-9._]+$'
  ) THEN
    RAISE EXCEPTION 'Cannot tighten profile draft username constraint while invalid usernames exist';
  END IF;
END $$;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS username_format_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT username_format_check
  CHECK (user_name ~ '^[a-z0-9._]+$');

ALTER TABLE public.profile_basics_drafts
  DROP CONSTRAINT IF EXISTS profile_basics_drafts_username_format_check;

ALTER TABLE public.profile_basics_drafts
  ADD CONSTRAINT profile_basics_drafts_username_format_check
  CHECK (user_name IS NULL OR user_name ~ '^[a-z0-9._]+$');
