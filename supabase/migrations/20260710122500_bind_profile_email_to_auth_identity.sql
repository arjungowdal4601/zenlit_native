/*
  Bind public.profiles.email to the mailbox verified by Supabase Auth. Client
  code is not an authorization boundary, so direct Data API writes must not be
  able to choose a different email or probe the unique constraint with one.
*/

CREATE OR REPLACE FUNCTION public.bind_profile_email_to_auth_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
  verified_email text;
BEGIN
  -- Preserve trusted administrative/service-role maintenance paths.
  IF caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT u.email
  INTO verified_email
  FROM auth.users AS u
  WHERE u.id = caller_id;

  IF verified_email IS NULL THEN
    RAISE EXCEPTION 'Authenticated email is unavailable';
  END IF;

  NEW.id := caller_id;
  NEW.email := verified_email;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.bind_profile_email_to_auth_identity()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bind_profile_email_to_auth_identity ON public.profiles;
CREATE TRIGGER bind_profile_email_to_auth_identity
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.bind_profile_email_to_auth_identity();

COMMENT ON FUNCTION public.bind_profile_email_to_auth_identity() IS
  'For client-originated writes, derives profiles.id/email from Supabase Auth.';
