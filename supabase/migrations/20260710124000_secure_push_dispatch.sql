/*
  Replace the database trigger that called the Edge Function with the public
  anon key. Push dispatch is now initiated by an authenticated sender and is
  bound server-side to a fresh message owned by that sender.
*/

DROP TRIGGER IF EXISTS on_message_insert_notify ON public.messages;
DROP FUNCTION IF EXISTS public.send_message_notification();

CREATE TABLE IF NOT EXISTS public.push_notification_dispatches (
  message_id uuid PRIMARY KEY REFERENCES public.messages(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  outcome text NOT NULL DEFAULT 'claimed'
    CHECK (outcome IN ('claimed', 'sent', 'skipped'))
);

CREATE INDEX IF NOT EXISTS idx_push_dispatch_sender_claimed_at
  ON public.push_notification_dispatches(sender_id, claimed_at DESC);

ALTER TABLE public.push_notification_dispatches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.push_notification_dispatches
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.push_notification_dispatches TO service_role;
