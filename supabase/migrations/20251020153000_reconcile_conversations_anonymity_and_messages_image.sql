-- Reconcile schema drift: add anonymity flags to conversations and image_url to messages
-- This migration aligns the database with application expectations and existing RPCs

BEGIN;

-- Add anonymity flags to conversations (if missing)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_anonymous_for_a boolean NOT NULL DEFAULT false;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_anonymous_for_b boolean NOT NULL DEFAULT false;

-- Ensure existing rows have non-null values (in case columns existed without NOT NULL)
UPDATE public.conversations
  SET is_anonymous_for_a = COALESCE(is_anonymous_for_a, false),
      is_anonymous_for_b = COALESCE(is_anonymous_for_b, false)
WHERE true;

-- Add image_url to messages used by get_conversation_metadata
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_url text;

COMMIT;