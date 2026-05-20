/*
  # Create profile basics drafts

  Stores authenticated users' partially completed mandatory onboarding fields so
  Profile Basics can be restored after app restart, reinstall, or interrupted
  setup before the public profiles row is complete.
*/

CREATE TABLE IF NOT EXISTS public.profile_basics_drafts (
  id uuid NOT NULL,
  display_name text NULL,
  user_name text NULL,
  date_of_birth date NULL,
  gender text NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_basics_drafts_pkey PRIMARY KEY (id),
  CONSTRAINT profile_basics_drafts_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT profile_basics_drafts_gender_check CHECK (
    gender IS NULL OR gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])
  ),
  CONSTRAINT profile_basics_drafts_username_format_check CHECK (
    user_name IS NULL OR user_name ~ '^[a-z0-9._!@#$%^&*()+=\-\[\]{}|;:,<>?/~`]+$'::text
  )
);

CREATE INDEX IF NOT EXISTS idx_profile_basics_drafts_updated_at
  ON public.profile_basics_drafts USING btree (updated_at);

ALTER TABLE public.profile_basics_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile basics draft"
  ON public.profile_basics_drafts
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can create own profile basics draft"
  ON public.profile_basics_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can update own profile basics draft"
  ON public.profile_basics_drafts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can delete own profile basics draft"
  ON public.profile_basics_drafts
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE OR REPLACE FUNCTION update_profile_basics_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profile_basics_drafts_timestamp
  ON public.profile_basics_drafts;

CREATE TRIGGER update_profile_basics_drafts_timestamp
  BEFORE UPDATE ON public.profile_basics_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_basics_drafts_updated_at();
