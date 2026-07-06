/*
  # Cleanup profile data when an Auth user is deleted

  Deleting an auth.users row does not automatically remove public profile data
  in this schema because public.profiles.id is not a foreign key to auth.users.id.
  Keep the cleanup scoped to rows owned by the deleted auth user id so old dummy
  profiles without auth rows are not affected.
*/

CREATE OR REPLACE FUNCTION public.cleanup_profile_on_auth_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.profile_basics_drafts WHERE id = OLD.id;
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_profile_on_auth_user_delete() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS cleanup_profile_on_auth_user_delete ON auth.users;

CREATE TRIGGER cleanup_profile_on_auth_user_delete
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_profile_on_auth_user_delete();
