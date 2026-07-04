/*
  # Harden profile basics drafts

  Keeps the remote follow-up migration in local history after applying the
  onboarding draft table fix. The trigger function gets a fixed search_path,
  and policies use SELECT auth.uid() so Postgres can cache the auth lookup.
*/

CREATE OR REPLACE FUNCTION public.update_profile_basics_drafts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Users can view own profile basics draft"
  ON public.profile_basics_drafts;
DROP POLICY IF EXISTS "Users can create own profile basics draft"
  ON public.profile_basics_drafts;
DROP POLICY IF EXISTS "Users can update own profile basics draft"
  ON public.profile_basics_drafts;
DROP POLICY IF EXISTS "Users can delete own profile basics draft"
  ON public.profile_basics_drafts;

CREATE POLICY "Users can view own profile basics draft"
  ON public.profile_basics_drafts
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can create own profile basics draft"
  ON public.profile_basics_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile basics draft"
  ON public.profile_basics_drafts
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can delete own profile basics draft"
  ON public.profile_basics_drafts
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = id);
