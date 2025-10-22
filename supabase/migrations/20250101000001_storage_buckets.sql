/*
  # Storage Buckets Setup

  ## Overview
  Creates all storage buckets for the application with appropriate security policies.

  ## Buckets Created
  1. **profile-images** - User profile pictures and banners
  2. **post-images** - Images attached to posts
  3. **feedback-images** - Screenshots and images attached to feedback

  ## Security
  - All buckets are public (images are publicly accessible)
  - Users can only upload/update/delete files in their own folder (user_id subfolder)
  - Folder structure: bucket/{user_id}/{filename}

  ## Important Notes
  - All buckets allow public read access for sharing
  - Write/delete operations restricted to file owners
  - File paths are enforced using storage.foldername()
*/

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

-- Profile Images Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Post Images Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Feedback Images Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-images', 'feedback-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. PROFILE IMAGES BUCKET POLICIES
-- ============================================================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to read profile images (public bucket)
CREATE POLICY "Anyone can view profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

-- ============================================================================
-- 3. POST IMAGES BUCKET POLICIES
-- ============================================================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own post images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own post images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'post-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own post images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to read post images (public bucket)
CREATE POLICY "Anyone can view post images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'post-images');

-- ============================================================================
-- 4. FEEDBACK IMAGES BUCKET POLICIES
-- ============================================================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload feedback images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own feedback images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'feedback-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to read feedback images (public bucket)
CREATE POLICY "Feedback images are publicly accessible"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'feedback-images');
