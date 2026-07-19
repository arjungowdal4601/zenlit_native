/* Remove deployed legacy RPCs that have no callers in the current app. */

DROP FUNCTION IF EXISTS public.expire_stale_locations(integer);
DROP FUNCTION IF EXISTS public.authorize_chat_channel(text, uuid);
DROP FUNCTION IF EXISTS public.get_unread_counts_direct();
DROP FUNCTION IF EXISTS public.mark_direct_delivered(uuid);
DROP FUNCTION IF EXISTS public.mark_direct_read(uuid);
