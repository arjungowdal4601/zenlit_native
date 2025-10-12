/*
  # Create posts table

  1. New Tables
    - `posts`
      - `id` (uuid, primary key) - Unique post identifier
      - `user_id` (uuid, required) - Foreign key to profiles.id
      - `content` (text, required) - Post content/text
      - `image_url` (text, optional) - URL to post image if attached
      - `created_at` (timestamptz) - Post creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `posts` table
    - Add policy for authenticated users to view all posts
    - Add policy for authenticated users to create their own posts
    - Add policy for authenticated users to update their own posts
    - Add policy for authenticated users to delete their own posts

  3. Indexes
    - Index on user_id for faster user-specific queries
    - Index on created_at for chronological sorting

  4. Constraints
    - Foreign key constraint linking to profiles table with CASCADE delete
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts USING btree (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all posts
CREATE POLICY "Anyone can view posts"
  ON public.posts
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Users can create their own posts
CREATE POLICY "Users can create own posts"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_posts_timestamp
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_updated_at();
