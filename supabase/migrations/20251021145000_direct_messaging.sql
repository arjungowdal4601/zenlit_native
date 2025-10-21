/*
  # Direct Messaging Migration

  ## Overview
  Converts the schema from conversation-centric messaging to direct peer-to-peer messaging.
  - Adds `receiver_id` to `public.messages` and backfills from `public.conversations`
  - Drops `conversation_id` from `public.messages`
  - Updates RLS policies for direct messaging
  - Removes conversation-related RPCs and drops `public.conversations`

  ## Notes
  - Backfill uses sender/conversation participants to determine receiver
  - Delivered/read timestamps remain on `messages`
*/

BEGIN;

-- 1) Add receiver_id and backfill from conversations
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_receiver_fkey'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_receiver_fkey
      FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill receiver_id using conversation participants (if conversations table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conversations'
  ) THEN
    UPDATE public.messages m
    SET receiver_id = CASE
      WHEN m.sender_id = c.user_a_id THEN c.user_b_id
      ELSE c.user_a_id
    END
    FROM public.conversations c
    WHERE m.conversation_id = c.id
      AND m.receiver_id IS NULL;
  END IF;

  -- Only enforce NOT NULL if all rows have receiver_id set
  IF NOT EXISTS (
    SELECT 1 FROM public.messages WHERE receiver_id IS NULL
  ) THEN
    ALTER TABLE public.messages
      ALTER COLUMN receiver_id SET NOT NULL;
  END IF;
END $$;

-- 2) Drop conversation_id FK and column, clean up indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_fkey'
  ) THEN
    ALTER TABLE public.messages DROP CONSTRAINT messages_conversation_fkey;
  END IF;
END $$;

-- Drop old conversation-based indexes if present
DROP INDEX IF EXISTS public.idx_messages_conversation;
DROP INDEX IF EXISTS public.idx_messages_conversation_unread;

-- Finally drop the conversation_id column
ALTER TABLE public.messages
  DROP COLUMN IF EXISTS conversation_id;

-- 3) Add useful direct messaging indexes
CREATE INDEX IF NOT EXISTS idx_messages_receiver
  ON public.messages (receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver
  ON public.messages (sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_unread_receiver
  ON public.messages (receiver_id)
  WHERE seen_at IS NULL;

-- 4) Update RLS policies for direct messaging
-- Remove legacy policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

-- Ensure RLS enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- New direct messaging policies
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.messages;
CREATE POLICY "Users can view their direct messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send direct messages" ON public.messages;
CREATE POLICY "Users can send direct messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id AND sender_id <> receiver_id);

DROP POLICY IF EXISTS "Users can update lifecycle of received messages" ON public.messages;
CREATE POLICY "Users can update lifecycle of received messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 5) Remove conversation-centric functions
DROP FUNCTION IF EXISTS public.mark_conversation_delivered(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.mark_conversation_read(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_unread_counts() CASCADE;
DROP FUNCTION IF EXISTS public.get_conversation_metadata(uuid[]) CASCADE;

-- 6) Drop conversations table
DROP TABLE IF EXISTS public.conversations CASCADE;

COMMIT;