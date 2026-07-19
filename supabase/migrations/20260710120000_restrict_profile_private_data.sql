/*
  Keep public profile identity fields queryable by signed-in app users while
  preventing anonymous and cross-account reads of private profile data.

  Private fields remain available to their owner through an auth.uid()-scoped
  function. This preserves onboarding and notification settings without
  granting table-wide access to email, birth date, gender, push tokens, or
  notification preferences.
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

CREATE OR REPLACE FUNCTION public.get_my_private_profile()
RETURNS TABLE (
  id uuid,
  display_name text,
  user_name text,
  date_of_birth date,
  gender text,
  email text,
  account_created_at timestamptz,
  expo_push_token text,
  notification_enabled boolean,
  notification_preferences jsonb,
  last_token_update timestamptz,
  optional_profile_completed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id,
    p.display_name,
    p.user_name,
    p.date_of_birth,
    p.gender,
    p.email,
    p.account_created_at,
    p.expo_push_token,
    p.notification_enabled,
    p.notification_preferences,
    p.last_token_update,
    p.optional_profile_completed_at
  FROM public.profiles AS p
  WHERE p.id = (SELECT auth.uid())
$$;

REVOKE ALL ON FUNCTION public.get_my_private_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;

DROP FUNCTION IF EXISTS public.check_email_available(text);
DROP FUNCTION IF EXISTS public.check_username_available(text);
DROP FUNCTION IF EXISTS public.generate_username_suggestions(text, integer);

COMMENT ON FUNCTION public.get_my_private_profile() IS
  'Returns the authenticated user''s own private profile fields only.';
