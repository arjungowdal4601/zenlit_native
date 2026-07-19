/*
  Reconcile policy/function drift found while validating the live profile
  hardening. This migration is intentionally idempotent so clean replays and
  existing projects converge on the same boundary.
*/

DROP POLICY IF EXISTS "Anonymous users can check username availability"
  ON public.profiles;
DROP POLICY IF EXISTS "Anyone can check username availability"
  ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can view all profiles"
  ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view public profile columns"
  ON public.profiles;

CREATE POLICY "Authenticated users can view public profile columns"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, display_name, user_name, account_created_at)
  ON TABLE public.profiles TO authenticated;

DROP FUNCTION IF EXISTS public.check_email_available(text);
DROP FUNCTION IF EXISTS public.check_username_available(text);
DROP FUNCTION IF EXISTS public.generate_username_suggestions(text, integer);
