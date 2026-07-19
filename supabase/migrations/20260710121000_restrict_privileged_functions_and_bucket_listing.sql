/*
  Remove client execution rights from maintenance/trigger functions and stop
  public storage buckets from exposing object listings. Public object URLs keep
  working because bucket publicity, not a broad storage.objects SELECT policy,
  controls public downloads.
*/

DROP FUNCTION IF EXISTS public.expire_stale_locations(integer);
DROP FUNCTION IF EXISTS public.authorize_chat_channel(text, uuid);
DROP FUNCTION IF EXISTS public.get_unread_counts_direct();
DROP FUNCTION IF EXISTS public.mark_direct_delivered(uuid);
DROP FUNCTION IF EXISTS public.mark_direct_read(uuid);

REVOKE EXECUTE ON FUNCTION public.get_unread_message_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unread_message_counts() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_messages_delivered(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_delivered(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_messages_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated;

ALTER FUNCTION public.send_message_notification()
  SET search_path = public, extensions, pg_temp;
REVOKE ALL ON FUNCTION public.send_message_notification()
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Feedback images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view feedback images" ON storage.objects;
