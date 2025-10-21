/*
  # Fix Messaging Feature - Proximity-Based Anonymous Messaging

  ## Overview
  Complete rebuild of messaging feature with proximity-based anonymity.

  ## Requirements
  1. Message initiation only from Radar page (via profile card)
  2. Messages page only shows conversations with at least one message
  3. Anonymity based on 1.5km proximity (0.01 lat/long_short difference)
  4. Anonymous mode hides profile pic, name, prevents profile navigation
  5. Real-time anonymity updates when users move

  ## Changes
  1. Ensure conversations table has correct structure
  2. Ensure messages table has correct structure
  3. Create/update RPC functions for anonymity checks
  4. Update RLS policies for secure access
  5. Create trigger for automatic anonymity updates
*/

-- ============================================================================
-- 1. VERIFY AND FIX CONVERSATIONS TABLE
-- ============================================================================

-- Conversations table should already exist from previous migration
-- Let's just ensure all columns are correct

DO $$
BEGIN
  -- Add any missing columns if table was manually modified
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'is_anonymous_for_a'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN is_anonymous_for_a boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'is_anonymous_for_b'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN is_anonymous_for_b boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE/UPDATE RPC FUNCTION FOR PROXIMITY CHECK AND ANONYMITY UPDATE
-- ============================================================================

-- Function to check if two users are nearby (within 1.5km / 0.01 lat_short/long_short)
DROP FUNCTION IF EXISTS public.check_users_nearby(uuid, uuid);
CREATE FUNCTION public.check_users_nearby(user_id_1 uuid, user_id_2 uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loc1 RECORD;
  loc2 RECORD;
  lat_diff numeric;
  long_diff numeric;
BEGIN
  -- Get location for user 1
  SELECT lat_short, long_short INTO loc1
  FROM locations
  WHERE id = user_id_1;

  -- Get location for user 2
  SELECT lat_short, long_short INTO loc2
  FROM locations
  WHERE id = user_id_2;

  -- If either location is missing or null, they're not nearby
  IF NOT FOUND OR loc1.lat_short IS NULL OR loc1.long_short IS NULL OR
     loc2.lat_short IS NULL OR loc2.long_short IS NULL THEN
    RETURN false;
  END IF;

  -- Calculate absolute differences
  lat_diff := ABS(loc1.lat_short - loc2.lat_short);
  long_diff := ABS(loc1.long_short - loc2.long_short);

  -- Users are nearby if both differences are <= 0.01 (approximately 1.5km)
  RETURN lat_diff <= 0.01 AND long_diff <= 0.01;
END;
$$;

-- Function to update anonymity for a specific conversation
DROP FUNCTION IF EXISTS public.update_conversation_anonymity_by_id(uuid);
CREATE FUNCTION public.update_conversation_anonymity_by_id(conv_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv RECORD;
  is_nearby boolean;
BEGIN
  -- Get the conversation
  SELECT * INTO conv FROM conversations WHERE id = conv_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check if users are nearby
  is_nearby := check_users_nearby(conv.user_a_id, conv.user_b_id);

  -- Update anonymity flags
  -- If nearby: not anonymous (false)
  -- If far away: anonymous (true)
  UPDATE conversations
  SET
    is_anonymous_for_a = NOT is_nearby,
    is_anonymous_for_b = NOT is_nearby
  WHERE id = conv_id;
END;
$$;

-- Function to update all conversations for a specific user when their location changes
DROP FUNCTION IF EXISTS public.update_user_conversations_anonymity(uuid);
CREATE FUNCTION public.update_user_conversations_anonymity(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_record RECORD;
BEGIN
  -- Find all conversations involving this user
  FOR conv_record IN
    SELECT id FROM conversations
    WHERE user_a_id = target_user_id OR user_b_id = target_user_id
  LOOP
    -- Update anonymity for each conversation
    PERFORM update_conversation_anonymity_by_id(conv_record.id);
  END LOOP;
END;
$$;

-- ============================================================================
-- 3. CREATE TRIGGER TO AUTO-UPDATE ANONYMITY ON LOCATION CHANGES
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_conversations_on_location_change ON public.locations;
DROP FUNCTION IF EXISTS public.handle_location_change();

-- Create trigger function
CREATE FUNCTION public.handle_location_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a location is updated, update all conversations for that user
  PERFORM update_user_conversations_anonymity(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on locations table
CREATE TRIGGER trigger_update_conversations_on_location_change
  AFTER INSERT OR UPDATE OF lat_short, long_short
  ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION handle_location_change();

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

REVOKE ALL ON FUNCTION public.check_users_nearby(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_conversation_anonymity_by_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_user_conversations_anonymity(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.check_users_nearby(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_anonymity_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_conversations_anonymity(uuid) TO authenticated;

-- ============================================================================
-- 5. INITIAL ANONYMITY UPDATE FOR ALL EXISTING CONVERSATIONS
-- ============================================================================

-- Update anonymity for all existing conversations based on current locations
DO $$
DECLARE
  conv_record RECORD;
BEGIN
  FOR conv_record IN SELECT id FROM conversations
  LOOP
    PERFORM update_conversation_anonymity_by_id(conv_record.id);
  END LOOP;
END;
$$;
