/*
  Mirror the client compressor's 550 KiB limit at the Storage boundary and
  restrict public image buckets to supported raster formats.
*/

UPDATE storage.buckets
SET
  file_size_limit = 563200,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
WHERE id IN ('profile-images', 'post-images', 'feedback-images');

DROP POLICY IF EXISTS "Authenticated users can upload feedback images"
  ON storage.objects;
DROP POLICY IF EXISTS "Users can upload feedback images"
  ON storage.objects;

CREATE POLICY "Users can upload feedback images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
