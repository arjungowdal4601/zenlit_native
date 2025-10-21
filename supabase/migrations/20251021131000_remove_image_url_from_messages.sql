/*
  # Remove image_url from messages and enforce text-only

  ## Overview
  Drops the `image_url` column from `public.messages` and removes the
  old content check constraint. It then enforces text-only messages by
  setting `text` to NOT NULL.

  ## Notes
  - Any rows with NULL `text` are updated to empty string to satisfy
    NOT NULL before altering the column.
*/

BEGIN;

-- Ensure no NULL text values remain to avoid NOT NULL violations
UPDATE public.messages
SET text = COALESCE(text, '')
WHERE text IS NULL;

-- Remove legacy constraint that referenced image_url
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_has_content;

-- Drop the image_url column
ALTER TABLE public.messages
  DROP COLUMN IF EXISTS image_url;

-- Enforce text-only messages
ALTER TABLE public.messages
  ALTER COLUMN text SET NOT NULL;

COMMIT;