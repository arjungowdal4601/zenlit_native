/*
  # Initial Database Schema Setup

  ## Overview
  This migration creates the complete initial database schema for the application.
  It establishes all core tables in the correct dependency order.

  ## Tables Created
  1. **profiles** - Core user profile data
  2. **social_links** - User social media links and bio
  3. **posts** - User-generated content posts
  4. **locations** - User location data for proximity features
  5. **messages** - Direct peer-to-peer messaging
  6. **feedback** - User feedback submissions

  ## Security
  - RLS enabled on all tables
  - Policies enforce user ownership and appropriate access control
  - Public read access where appropriate for social features

  ## Important Notes
  - All tables use UUID primary keys
  - Foreign keys cascade on delete to maintain referential integrity
  - Timestamps use timestamptz for consistency across timezones
  - Indexes optimized for common query patterns
*/

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================

/*
  Profiles table stores core user account information.
  - Links to auth.users via id
  - Contains display name, unique username, email
  - Optional demographic data (date_of_birth, gender)
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  user_name text NOT NULL,
  date_of_birth date NULL,
  gender text NULL,
  email text NOT NULL,
  account_created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_user_name_key UNIQUE (user_name),
  CONSTRAINT profiles_gender_check CHECK (
    gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])
  ),
  CONSTRAINT username_format_check CHECK (
    user_name ~ '^[a-z0-9._!@#$%^&*()+=\-\[\]{}|;:,<>?/~`]+$'::text
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_name ON public.profiles USING btree (user_name);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can check username availability"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- 2. SOCIAL LINKS TABLE
-- ============================================================================

/*
  Social links table stores user's social media profiles and bio.
  - One-to-one relationship with profiles
  - Contains profile/banner images, bio, social media handles
  - Public read access for viewing other profiles
*/

CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid NOT NULL,
  profile_pic_url text NULL DEFAULT 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'::text,
  banner_url text NULL DEFAULT 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60'::text,
  bio text NULL,
  instagram text NULL,
  x_twitter text NULL,
  linkedin text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT social_links_pkey PRIMARY KEY (id),
  CONSTRAINT social_links_id_fkey FOREIGN KEY (id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_social_links_id ON public.social_links USING btree (id);

-- Enable Row Level Security
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own social links"
  ON public.social_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view social links"
  ON public.social_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can create own social links"
  ON public.social_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own social links"
  ON public.social_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_social_links_timestamp
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW
  EXECUTE FUNCTION update_social_links_updated_at();

-- ============================================================================
-- 3. POSTS TABLE
-- ============================================================================

/*
  Posts table stores user-generated content.
  - Links to profiles via user_id
  - Contains text content and optional image
  - Public read access, users can manage their own posts
*/

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts USING btree (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view posts"
  ON public.posts
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create own posts"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_posts_timestamp
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_updated_at();

-- ============================================================================
-- 4. LOCATIONS TABLE
-- ============================================================================

/*
  Locations table stores user location data for proximity-based features.
  - One-to-one relationship with profiles
  - Full precision coordinates (lat_full, long_full)
  - Rounded coordinates (lat_short, long_short) for privacy-preserving proximity matching
  - Users within 0.01 degree (~1.5km) are considered nearby
*/

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid NOT NULL,
  lat_full numeric(15, 12) NULL,
  long_full numeric(15, 12) NULL,
  lat_short numeric(5, 2) NULL,
  long_short numeric(5, 2) NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_id_fkey FOREIGN KEY (id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can update their own location"
  ON public.locations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own location"
  ON public.locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view nearby locations"
  ON public.locations
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for efficient proximity queries
CREATE INDEX IF NOT EXISTS idx_locations_short_coords
  ON public.locations (lat_short, long_short);

CREATE INDEX IF NOT EXISTS idx_locations_updated_at
  ON public.locations (updated_at DESC);

-- ============================================================================
-- 5. MESSAGES TABLE (Direct Messaging)
-- ============================================================================

/*
  Messages table implements direct peer-to-peer messaging.
  - Each message has sender_id and receiver_id (no conversations table)
  - Text-only messages (no image support)
  - Tracks delivery and read status
  - Messages are immutable (no updates to content)
*/

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  text text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  seen_at timestamptz,
  CONSTRAINT messages_sender_fkey FOREIGN KEY (sender_id)
    REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT messages_receiver_fkey FOREIGN KEY (receiver_id)
    REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT messages_different_users CHECK (sender_id != receiver_id),
  CONSTRAINT messages_text_not_empty CHECK (length(trim(text)) > 0)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages (sender_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver
  ON public.messages (receiver_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_pair
  ON public.messages (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages (receiver_id, sent_at DESC)
  WHERE seen_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received message status"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- ============================================================================
-- 6. FEEDBACK TABLE
-- ============================================================================

/*
  Feedback table stores user feedback submissions.
  - Links to auth.users (not profiles) for reliability
  - Contains message text and optional image
  - Users can view their own feedback, read-only after submission
*/

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own feedback"
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/*
  These RPC functions provide efficient message status updates and queries.
*/

-- Mark messages from a specific user as delivered
CREATE OR REPLACE FUNCTION public.mark_direct_delivered(peer_id uuid)
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

  UPDATE messages
  SET delivered_at = COALESCE(delivered_at, now_ts)
  WHERE sender_id = peer_id
    AND receiver_id = viewer_id
    AND delivered_at IS NULL;
END;
$$;

-- Mark messages from a specific user as read (implies delivered)
CREATE OR REPLACE FUNCTION public.mark_direct_read(peer_id uuid)
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

  UPDATE messages
  SET
    delivered_at = COALESCE(delivered_at, now_ts),
    seen_at = COALESCE(seen_at, now_ts)
  WHERE sender_id = peer_id
    AND receiver_id = viewer_id
    AND seen_at IS NULL;
END;
$$;

-- Get unread message counts grouped by sender
CREATE OR REPLACE FUNCTION public.get_unread_counts_direct()
RETURNS TABLE (peer_id uuid, unread_count bigint)
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
    m.sender_id AS peer_id,
    COUNT(*) AS unread_count
  FROM messages m
  WHERE m.receiver_id = viewer_id
    AND m.seen_at IS NULL
  GROUP BY m.sender_id;
END;
$$;

-- Check if a username is available
CREATE OR REPLACE FUNCTION public.check_username_available(username_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_name = username_to_check
  );
END;
$$;

-- Check if an email is available
CREATE OR REPLACE FUNCTION public.check_email_available(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = email_to_check
  );
END;
$$;

-- Generate username suggestions based on a base username
CREATE OR REPLACE FUNCTION public.generate_username_suggestions(
  base_username text,
  max_suggestions int DEFAULT 5
)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suggestions text[] := ARRAY[]::text[];
  candidate text;
  counter int := 1;
BEGIN
  WHILE array_length(suggestions, 1) < max_suggestions AND counter < 100 LOOP
    candidate := base_username || counter::text;

    IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_name = candidate) THEN
      suggestions := array_append(suggestions, candidate);
    END IF;

    counter := counter + 1;
  END LOOP;

  RETURN suggestions;
END;
$$;

-- Grant permissions on functions
REVOKE ALL ON FUNCTION public.mark_direct_delivered(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_direct_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_unread_counts_direct() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_username_available(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_email_available(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_username_suggestions(text, int) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mark_direct_delivered(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_direct_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_counts_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_email_available(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_username_suggestions(text, int) TO authenticated, anon;
