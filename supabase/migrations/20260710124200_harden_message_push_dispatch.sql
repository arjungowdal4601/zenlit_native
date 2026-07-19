/*
  Make message identity/content immutable to Data API callers and keep message
  delivery/read state changes behind the existing auth-bound RPCs. Push claims
  are leased and serialized per sender so retries cannot race the rate limit or
  let an expired worker overwrite a newer attempt.
*/

-- Remove every historical client-side message mutation policy that can exist
-- across the live migration history or a clean local replay.
DROP POLICY IF EXISTS "Users can update message status" ON public.messages;
DROP POLICY IF EXISTS "Users can update lifecycle of received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update received message status" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to others" ON public.messages;
DROP POLICY IF EXISTS "Users can send nearby messages" ON public.messages;

-- Table-level grants override column-level revokes, so remove both before
-- granting only the fields the app legitimately supplies on INSERT.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.messages
  FROM PUBLIC, anon, authenticated;
REVOKE INSERT (id, sender_id, receiver_id, text, created_at, delivered_at, read_at),
       UPDATE (id, sender_id, receiver_id, text, created_at, delivered_at, read_at)
  ON TABLE public.messages
  FROM PUBLIC, anon, authenticated;
GRANT INSERT (id, sender_id, receiver_id, text)
  ON TABLE public.messages TO authenticated;

CREATE POLICY "Users can send nearby messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND sender_id <> receiver_id
    AND (SELECT public.is_user_nearby(receiver_id))
  );

-- Delivery/read transitions remain available only through the existing
-- functions, which derive the viewer from auth.uid() and scope receiver_id.
REVOKE ALL ON FUNCTION public.mark_messages_delivered(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_messages_read(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_delivered(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid)
  TO authenticated;

ALTER TABLE public.push_notification_dispatches
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS claim_token uuid DEFAULT pg_catalog.gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS last_error text;

UPDATE public.push_notification_dispatches
SET claim_token = pg_catalog.gen_random_uuid()
WHERE claim_token IS NULL;

ALTER TABLE public.push_notification_dispatches
  ALTER COLUMN claim_token SET DEFAULT pg_catalog.gen_random_uuid(),
  ALTER COLUMN claim_token SET NOT NULL,
  DROP CONSTRAINT IF EXISTS push_notification_dispatches_outcome_check,
  DROP CONSTRAINT IF EXISTS push_notification_dispatches_attempt_count_check;

ALTER TABLE public.push_notification_dispatches
  ADD CONSTRAINT push_notification_dispatches_outcome_check
    CHECK (outcome IN ('claimed', 'sent', 'skipped', 'failed')),
  ADD CONSTRAINT push_notification_dispatches_attempt_count_check
    CHECK (attempt_count > 0);

CREATE OR REPLACE FUNCTION public.claim_push_notification_dispatch(
  p_message_id uuid,
  p_max_per_minute integer DEFAULT 10,
  p_stale_after_seconds integer DEFAULT 60
)
RETURNS TABLE (
  claim_status text,
  claim_token uuid,
  attempt_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  sender_id_from_message uuid;
  receiver_id_from_message uuid;
  claimed_at_existing timestamptz;
  outcome_existing text;
  attempt_count_existing integer;
  has_existing boolean := false;
  recent_count integer := 0;
  claim_token_next uuid;
  attempt_count_next integer;
  now_at timestamptz := clock_timestamp();
BEGIN
  IF p_max_per_minute < 1 OR p_max_per_minute > 100 THEN
    RAISE EXCEPTION 'Push limit must be between 1 and 100'
      USING ERRCODE = '22023';
  END IF;

  IF p_stale_after_seconds < 1 OR p_stale_after_seconds > 300 THEN
    RAISE EXCEPTION 'Stale claim window must be between 1 and 300 seconds'
      USING ERRCODE = '22023';
  END IF;

  SELECT m.sender_id, m.receiver_id
  INTO sender_id_from_message, receiver_id_from_message
  FROM public.messages AS m
  WHERE m.id = p_message_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::uuid, 0;
    RETURN;
  END IF;

  -- This transaction-scoped lock serializes the rate check and claim write for
  -- one sender. Hash collisions only serialize unrelated senders; they cannot
  -- weaken authorization or the rate limit.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(sender_id_from_message::text, 0)
  );

  SELECT d.outcome, d.claimed_at, d.attempt_count
  INTO outcome_existing, claimed_at_existing, attempt_count_existing
  FROM public.push_notification_dispatches AS d
  WHERE d.message_id = p_message_id
  FOR UPDATE;
  has_existing := FOUND;

  IF has_existing AND outcome_existing IN ('sent', 'skipped') THEN
    RETURN QUERY
      SELECT 'already_processed'::text, NULL::uuid, attempt_count_existing;
    RETURN;
  END IF;

  IF has_existing
     AND outcome_existing = 'claimed'
     AND claimed_at_existing > now_at - (p_stale_after_seconds * interval '1 second') THEN
    RETURN QUERY SELECT 'in_progress'::text, NULL::uuid, attempt_count_existing;
    RETURN;
  END IF;

  SELECT count(*)::integer
  INTO recent_count
  FROM public.push_notification_dispatches AS d
  WHERE d.sender_id = sender_id_from_message
    AND d.claimed_at >= now_at - interval '1 minute';

  IF recent_count >= p_max_per_minute THEN
    RETURN QUERY
      SELECT 'rate_limited'::text, NULL::uuid, COALESCE(attempt_count_existing, 0);
    RETURN;
  END IF;

  claim_token_next := pg_catalog.gen_random_uuid();

  IF has_existing THEN
    UPDATE public.push_notification_dispatches AS d
    SET sender_id = sender_id_from_message,
        receiver_id = receiver_id_from_message,
        claimed_at = now_at,
        sent_at = NULL,
        outcome = 'claimed',
        attempt_count = d.attempt_count + 1,
        claim_token = claim_token_next,
        last_error = NULL
    WHERE d.message_id = p_message_id
    RETURNING d.attempt_count INTO attempt_count_next;
  ELSE
    INSERT INTO public.push_notification_dispatches (
      message_id,
      sender_id,
      receiver_id,
      claimed_at,
      sent_at,
      outcome,
      attempt_count,
      claim_token,
      last_error
    )
    VALUES (
      p_message_id,
      sender_id_from_message,
      receiver_id_from_message,
      now_at,
      NULL,
      'claimed',
      1,
      claim_token_next,
      NULL
    );
    attempt_count_next := 1;
  END IF;

  RETURN QUERY SELECT 'claimed'::text, claim_token_next, attempt_count_next;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_push_notification_dispatch(uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_notification_dispatch(uuid, integer, integer)
  TO service_role;

COMMENT ON FUNCTION public.claim_push_notification_dispatch(uuid, integer, integer) IS
  'Atomically rate-limits and leases one push dispatch to the service role.';
