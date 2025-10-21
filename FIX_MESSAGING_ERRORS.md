# Fix Messaging Errors - Complete Guide

## Problem
The messaging feature is showing 404 errors because the database schema is outdated. The app code expects a conversation-based messaging system, but the database still has the old direct messaging structure.

## Solution
Apply the migration file that restores the correct database schema.

---

## Step-by-Step Fix

### 1. Open Supabase Dashboard

Go to: **https://supabase.com/dashboard/project/yxucgloawhbpjuweoipt**

(You should already be logged in with your Supabase account)

### 2. Open SQL Editor

- Click **"SQL Editor"** in the left sidebar
- Click **"New query"** button

### 3. Copy and Run Migration

**Copy the entire SQL below and paste it into the SQL Editor:**

```sql
-- ============================================================================
-- Restore Conversation-Based Messaging with Proximity Anonymity
-- ============================================================================

-- Drop old direct messaging structures
DROP INDEX IF EXISTS public.idx_messages_receiver;
DROP INDEX IF EXISTS public.idx_messages_sender_receiver;
DROP INDEX IF EXISTS public.idx_messages_unread_receiver;
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update lifecycle of received messages" ON public.messages;

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL,
  user_b_id uuid NOT NULL,
  is_anonymous_for_a boolean DEFAULT false NOT NULL,
  is_anonymous_for_b boolean DEFAULT false NOT NULL,
  last_message_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_read_at_a timestamptz,
  last_read_at_b timestamptz,
  CONSTRAINT conversations_user_a_fkey FOREIGN KEY (user_a_id)
    REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT conversations_user_b_fkey FOREIGN KEY (user_b_id)
    REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT conversations_different_users CHECK (user_a_id != user_b_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_pair
  ON public.conversations (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));

CREATE INDEX IF NOT EXISTS idx_conversations_user_a
  ON public.conversations (user_a_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_b
  ON public.conversations (user_b_id, last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "Users can create conversations they are part of" ON public.conversations;
CREATE POLICY "Users can create conversations they are part of"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id)
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Migrate messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN conversation_id uuid;
  END IF;
END $$;

-- Migrate existing messages
DO $$
DECLARE
  msg_record RECORD;
  conv_id uuid;
  user_a uuid;
  user_b uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'receiver_id'
  ) THEN
    FOR msg_record IN
      SELECT DISTINCT sender_id, receiver_id
      FROM public.messages
      WHERE receiver_id IS NOT NULL AND conversation_id IS NULL
    LOOP
      user_a := LEAST(msg_record.sender_id, msg_record.receiver_id);
      user_b := GREATEST(msg_record.sender_id, msg_record.receiver_id);

      SELECT id INTO conv_id FROM public.conversations
      WHERE user_a_id = user_a AND user_b_id = user_b;

      IF conv_id IS NULL THEN
        INSERT INTO public.conversations (user_a_id, user_b_id, is_anonymous_for_a, is_anonymous_for_b)
        VALUES (user_a, user_b, false, false) RETURNING id INTO conv_id;
      END IF;

      UPDATE public.messages SET conversation_id = conv_id
      WHERE (sender_id = msg_record.sender_id AND receiver_id = msg_record.receiver_id)
         OR (sender_id = msg_record.receiver_id AND receiver_id = msg_record.sender_id);
    END LOOP;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_fkey') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_conversation_fkey
      FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.messages WHERE conversation_id IS NULL) THEN
    ALTER TABLE public.messages ALTER COLUMN conversation_id SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_receiver_fkey') THEN
    ALTER TABLE public.messages DROP CONSTRAINT messages_receiver_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'receiver_id'
  ) THEN
    ALTER TABLE public.messages DROP COLUMN receiver_id;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread
  ON public.messages (conversation_id, created_at) WHERE read_at IS NULL;

-- Update RLS policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update received message status" ON public.messages;
CREATE POLICY "Users can update received message status"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id <> auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
    )
  )
  WITH CHECK (
    sender_id <> auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
    )
  );

-- Create RPC functions
CREATE OR REPLACE FUNCTION public.mark_conversation_delivered(conv_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  viewer_id uuid := auth.uid();
  conv conversations%ROWTYPE;
  now_ts timestamptz := now();
BEGIN
  IF viewer_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO conv FROM conversations WHERE id = conv_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF conv.user_a_id = viewer_id OR conv.user_b_id = viewer_id THEN
    UPDATE messages SET delivered_at = COALESCE(messages.delivered_at, now_ts)
    WHERE conversation_id = conv_id AND sender_id <> viewer_id AND delivered_at IS NULL;
  ELSE RAISE EXCEPTION 'Not authorized'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(conv_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  viewer_id uuid := auth.uid();
  conv conversations%ROWTYPE;
  now_ts timestamptz := now();
BEGIN
  IF viewer_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO conv FROM conversations WHERE id = conv_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF conv.user_a_id = viewer_id THEN
    UPDATE messages SET delivered_at = COALESCE(messages.delivered_at, now_ts),
        read_at = COALESCE(messages.read_at, now_ts)
    WHERE conversation_id = conv_id AND sender_id <> viewer_id AND (delivered_at IS NULL OR read_at IS NULL);
    UPDATE conversations SET last_read_at_a = GREATEST(COALESCE(last_read_at_a, '1970-01-01'::timestamptz), now_ts)
    WHERE id = conv_id;
  ELSIF conv.user_b_id = viewer_id THEN
    UPDATE messages SET delivered_at = COALESCE(messages.delivered_at, now_ts),
        read_at = COALESCE(messages.read_at, now_ts)
    WHERE conversation_id = conv_id AND sender_id <> viewer_id AND (delivered_at IS NULL OR read_at IS NULL);
    UPDATE conversations SET last_read_at_b = GREATEST(COALESCE(last_read_at_b, '1970-01-01'::timestamptz), now_ts)
    WHERE id = conv_id;
  ELSE RAISE EXCEPTION 'Not authorized'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_counts()
RETURNS TABLE (conversation_id uuid, unread_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE viewer_id uuid := auth.uid();
BEGIN
  IF viewer_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  RETURN QUERY
  SELECT c.id, COUNT(m.id)::integer AS unread_count
  FROM conversations c LEFT JOIN messages m ON m.conversation_id = c.id
   AND m.sender_id <> viewer_id
   AND m.created_at > COALESCE(
        CASE WHEN c.user_a_id = viewer_id THEN c.last_read_at_a
          WHEN c.user_b_id = viewer_id THEN c.last_read_at_b ELSE NULL END,
        '1970-01-01'::timestamptz)
  WHERE c.user_a_id = viewer_id OR c.user_b_id = viewer_id GROUP BY c.id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_delivered(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_unread_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_conversation_delivered(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_counts() TO authenticated;
```

**Click the "Run" button** (or press Ctrl+Enter)

You should see: **"Success. No rows returned"**

### 4. Enable Realtime

- Click **"Database"** → **"Replication"** in the left sidebar
- Find `conversations` table → Toggle **"Realtime"** to **ON**
- Find `messages` table → Toggle **"Realtime"** to **ON**

### 5. Verify Tables

- Click **"Table Editor"** in the left sidebar
- Verify you see:
  - ✅ `conversations` table (with columns: id, user_a_id, user_b_id, is_anonymous_for_a, is_anonymous_for_b, etc.)
  - ✅ `messages` table (with columns: id, conversation_id, sender_id, text, created_at, delivered_at, read_at)

### 6. Test the App

- **Reload your application** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
- All 404 errors should be gone
- Try starting a conversation from the radar
- Send a message
- Messages should appear in real-time

---

## What This Fix Does

✅ Creates the `conversations` table with anonymity tracking
✅ Migrates any existing messages to conversation-based structure
✅ Adds RPC functions for marking messages as delivered/read
✅ Updates RLS policies for secure access
✅ Removes old direct messaging columns
✅ Enables real-time messaging

---

## Still Having Issues?

If errors persist after applying the migration:

1. **Clear browser cache** and reload
2. **Check Console** for new errors (press F12)
3. **Verify migration succeeded** - Go to SQL Editor and run:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name IN ('conversations', 'messages');
   ```
   You should see both tables listed.

4. **Check Realtime is ON** - Both `conversations` and `messages` should show "Enabled" in Database → Replication