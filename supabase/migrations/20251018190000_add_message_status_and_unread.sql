/*
  # Message status metadata and unread count helpers

  1. Add delivered/read timestamps on messages
  2. Persist per-user last-read timestamps on conversations
  3. Provide RPC helpers for marking delivered/read and fetching unread counts
*/

-- Message lifecycle timestamps
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread
  ON messages (conversation_id, created_at)
  WHERE read_at IS NULL;

-- Per-user conversation read tracking
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_read_at_a timestamptz,
  ADD COLUMN IF NOT EXISTS last_read_at_b timestamptz;

CREATE INDEX IF NOT EXISTS idx_conversations_last_read
  ON conversations (last_read_at_a, last_read_at_b);

-- Mark conversation messages as delivered for the viewer
CREATE OR REPLACE FUNCTION public.mark_conversation_delivered(conv_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_id uuid := auth.uid();
  conv conversations%ROWTYPE;
  now_ts timestamptz := now();
BEGIN
  IF viewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO conv FROM conversations WHERE id = conv_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF conv.user_a_id = viewer_id OR conv.user_b_id = viewer_id THEN
    UPDATE messages
      SET delivered_at = COALESCE(messages.delivered_at, now_ts)
    WHERE conversation_id = conv_id
      AND sender_id <> viewer_id
      AND delivered_at IS NULL;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$;

-- Mark conversation messages as read for the viewer (implies delivered)
CREATE OR REPLACE FUNCTION public.mark_conversation_read(conv_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_id uuid := auth.uid();
  conv conversations%ROWTYPE;
  now_ts timestamptz := now();
BEGIN
  IF viewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO conv FROM conversations WHERE id = conv_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF conv.user_a_id = viewer_id THEN
    UPDATE messages
      SET delivered_at = COALESCE(messages.delivered_at, now_ts),
          read_at = COALESCE(messages.read_at, now_ts)
    WHERE conversation_id = conv_id
      AND sender_id <> viewer_id
      AND (delivered_at IS NULL OR read_at IS NULL);

    UPDATE conversations
      SET last_read_at_a = GREATEST(COALESCE(last_read_at_a, '1970-01-01'::timestamptz), now_ts)
    WHERE id = conv_id;
  ELSIF conv.user_b_id = viewer_id THEN
    UPDATE messages
      SET delivered_at = COALESCE(messages.delivered_at, now_ts),
          read_at = COALESCE(messages.read_at, now_ts)
    WHERE conversation_id = conv_id
      AND sender_id <> viewer_id
      AND (delivered_at IS NULL OR read_at IS NULL);

    UPDATE conversations
      SET last_read_at_b = GREATEST(COALESCE(last_read_at_b, '1970-01-01'::timestamptz), now_ts)
    WHERE id = conv_id;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$;

-- Fetch unread counts per conversation for the current user
CREATE OR REPLACE FUNCTION public.get_unread_counts()
RETURNS TABLE (conversation_id uuid, unread_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_id uuid := auth.uid();
BEGIN
  IF viewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    COUNT(m.id)::integer AS unread_count
  FROM conversations c
  LEFT JOIN messages m
    ON m.conversation_id = c.id
   AND m.sender_id <> viewer_id
   AND m.created_at > COALESCE(
        CASE
          WHEN c.user_a_id = viewer_id THEN c.last_read_at_a
          WHEN c.user_b_id = viewer_id THEN c.last_read_at_b
          ELSE NULL
        END,
        '1970-01-01'::timestamptz
      )
  WHERE c.user_a_id = viewer_id OR c.user_b_id = viewer_id
  GROUP BY c.id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_delivered(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_unread_counts() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mark_conversation_delivered(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_counts() TO authenticated;
