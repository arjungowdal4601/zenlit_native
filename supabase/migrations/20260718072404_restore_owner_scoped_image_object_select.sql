/*
  Storage upload inserts return the created object metadata, so authenticated
  clients need SELECT access to their own UID folder. Public image URLs remain
  available through the public buckets, while object listings stay owner-only.
*/

DROP POLICY IF EXISTS "Users can view own image objects"
  ON storage.objects;

CREATE POLICY "Users can view own image objects"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('profile-images', 'post-images', 'feedback-images')
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
