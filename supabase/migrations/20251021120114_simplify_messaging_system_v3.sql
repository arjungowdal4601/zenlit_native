/*
  # Simplify Messaging System - Remove Conversations Table

  ## Overview
  This migration simplifies the messaging system by removing the conversations table
  and all associated anonymity logic. Messages are now direct peer-to-peer communication
  between users, with proximity filtering handled at the application layer.

  ## Changes
  1. Drop all existing policies and constraints on messages table
  2. Drop conversations table and all related triggers/functions
  3. Modify messages table to replace conversation_id with receiver_id
  4. Create RPC functions for marking messages as delivered/read based on user pairs
  5. Create RPC function to get unread counts by sender
  6. Update RLS policies for direct user-to-user messaging

  ## New Schema
  Messages table now contains:
  - id: unique identifier
  - sender_id: who sent the message
  - receiver_id: who receives the message (replaces conversation_id)
  - text: message content
  - created_at: timestamp when message was sent
  - delivered_at: timestamp when message was delivered
  - read_at: timestamp when message was read

  ## Security
  - RLS enabled on messages table
  - Users can only view messages where they are sender or receiver
  - Users can only send messages as themselves
  - Messages are immutable (no updates or deletes after creation)
*/

-- ============================================================================
-- 1. DROP EXISTING POLICIES ON MESSAGES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update received message status" ON public.messages;

-- ============================================================================
-- 2. DROP EXISTING CONVERSATIONS AND RELATED OBJECTS
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_update_conversations_on_location_change ON public.locations;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_location_change();
DROP FUNCTION IF EXISTS public.update_user_conversations_anonymity(uuid);
DROP FUNCTION IF EXISTS public.update_conversation_anonymity_by_id(uuid);
DROP FUNCTION IF EXISTS public.check_users_nearby(uuid, uuid);
DROP FUNCTION IF EXISTS public.mark_conversation_delivered(uuid);
DROP FUNCTION IF EXISTS public.mark_conversation_read(uuid);
DROP FUNCTION IF EXISTS public.get_unread_counts();

-- ============================================================================
-- 3. BACKUP AND MODIFY MESSAGES TABLE
-- ============================================================================

-- Add receiver_id column (nullable initially)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'receiver_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN receiver_id uuid;
  END IF;
END $$;

-- Populate receiver_id from conversations table before dropping it
-- For each message, set receiver_id to the other user in the conversation
UPDATE public.messages m
SET receiver_id = (
  SELECT CASE 
    WHEN c.user_a_id = m.sender_id THEN c.user_b_id
    WHEN c.user_b_id = m.sender_id THEN c.user_a_id
    ELSE NULL
  END
  FROM public.conversations c
  WHERE c.id = m.conversation_id
)
WHERE receiver_id IS NULL AND conversation_id IS NOT NULL;

-- Delete any messages that couldn't find a receiver (orphaned messages)
DELETE FROM public.messages WHERE receiver_id IS NULL;

-- Make receiver_id NOT NULL after populating
ALTER TABLE public.messages 
  ALTER COLUMN receiver_id SET NOT NULL;

-- Drop the foreign key constraint on conversation_id
ALTER TABLE public.messages 
  DROP CONSTRAINT IF EXISTS messages_conversation_fkey;

-- Drop conversation_id column
ALTER TABLE public.messages 
  DROP COLUMN IF EXISTS conversation_id;

-- Drop conversations table
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Add foreign key constraint for receiver_id
ALTER TABLE public.messages
  ADD CONSTRAINT messages_receiver_fkey 
  FOREIGN KEY (receiver_id) REFERENCES profiles (id) ON DELETE CASCADE;

-- Add check constraint to ensure sender and receiver are different
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_different_users'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_different_users 
      CHECK (sender_id != receiver_id);
  END IF;
END $$;

-- Ensure text is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_text_not_empty'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_text_not_empty 
      CHECK (length(trim(text)) > 0);
  END IF;
END $$;

-- ============================================================================
-- 4. CREATE INDEXES FOR EFFICIENT QUERYING
-- ============================================================================

-- Drop old indexes
DROP INDEX IF EXISTS public.idx_messages_conversation;
DROP INDEX IF EXISTS public.idx_messages_sender;
DROP INDEX IF EXISTS public.idx_messages_conversation_unread;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
  ON public.messages (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_created 
  ON public.messages (receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_pair
  ON public.messages (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages (receiver_id, created_at DESC)
  WHERE read_at IS NULL;

-- ============================================================================
-- 5. CREATE NEW RLS POLICIES
-- ============================================================================

-- Users can view messages where they are sender or receiver
CREATE POLICY "Users can view their own messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages as themselves
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- 6. CREATE RPC FUNCTIONS FOR MESSAGE STATUS UPDATES
-- ============================================================================

-- Mark messages from a specific user as delivered
CREATE OR REPLACE FUNCTION public.mark_messages_delivered(other_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_id uuid := auth.uid();
  now_ts timestamptz := now();
BEGIN
  IF viewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Mark all undelivered messages from other_user_id to viewer as delivered
  UPDATE messages
  SET delivered_at = COALESCE(delivered_at, now_ts)
  WHERE sender_id = other_user_id
    AND receiver_id = viewer_id
    AND delivered_at IS NULL;
END;
$$;

-- Mark messages from a specific user as read (implies delivered)
CREATE OR REPLACE FUNCTION public.mark_messages_read(other_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_id uuid := auth.uid();
  now_ts timestamptz := now();
BEGIN
  IF viewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Mark all unread messages from other_user_id to viewer as read and delivered
  UPDATE messages
  SET 
    delivered_at = COALESCE(delivered_at, now_ts),
    read_at = COALESCE(read_at, now_ts)
  WHERE sender_id = other_user_id
    AND receiver_id = viewer_id
    AND read_at IS NULL;
END;
$$;

-- Get unread message counts grouped by sender
CREATE OR REPLACE FUNCTION public.get_unread_message_counts()
RETURNS TABLE (sender_id uuid, unread_count bigint)
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
    m.sender_id,
    COUNT(*) AS unread_count
  FROM messages m
  WHERE m.receiver_id = viewer_id
    AND m.read_at IS NULL
  GROUP BY m.sender_id;
END;
$$;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

REVOKE ALL ON FUNCTION public.mark_messages_delivered(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_messages_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_unread_message_counts() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mark_messages_delivered(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_message_counts() TO authenticated;
