/*
  # Create Feedback Images Storage Bucket

  1. Storage Bucket
    - Create `feedback-images` bucket for storing feedback photo attachments
    
  2. Security Policies
    - Users can upload their own feedback images
    - Images are publicly readable
    - Users can only upload to their own user folder
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-images', 'feedback-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload feedback images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Feedback images are publicly accessible"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'feedback-images');

CREATE POLICY "Users can delete their own feedback images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'feedback-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
