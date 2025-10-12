/*
  # Create social_links table

  1. New Tables
    - `social_links`
      - `id` (uuid, primary key) - Links to profiles.id
      - `profile_pic_url` (text, optional) - URL to user's profile picture
      - `banner_url` (text, optional) - URL to user's banner image
      - `bio` (text, optional) - User's bio/description
      - `instagram` (text, optional) - Instagram handle or URL
      - `x_twitter` (text, optional) - Twitter/X handle or URL
      - `linkedin` (text, optional) - LinkedIn profile URL
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `social_links` table
    - Add policy for authenticated users to read their own social links
    - Add policy for authenticated users to insert their own social links
    - Add policy for authenticated users to update their own social links
    - Add policy for public to read social links (for viewing other profiles)

  3. Indexes
    - Index on id for faster lookups

  4. Constraints
    - Foreign key constraint linking to profiles table with CASCADE delete
*/

-- Create social_links table
CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid NOT NULL,
  profile_pic_url text NULL DEFAULT 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'::text,
  banner_url text NULL DEFAULT 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60'::text,
  bio text NULL,
  instagram text NULL,
  x_twitter text NULL,
  linkedin text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_links_pkey PRIMARY KEY (id),
  CONSTRAINT social_links_id_fkey FOREIGN KEY (id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_social_links_id ON public.social_links USING btree (id);

-- Enable Row Level Security
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own social links
CREATE POLICY "Users can view own social links"
  ON public.social_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Public can read all social links (for viewing other profiles)
CREATE POLICY "Anyone can view social links"
  ON public.social_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Users can insert their own social links
CREATE POLICY "Users can create own social links"
  ON public.social_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own social links
CREATE POLICY "Users can update own social links"
  ON public.social_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_social_links_timestamp
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW
  EXECUTE FUNCTION update_social_links_updated_at();
