/*
  # Create Feedback Table and Storage

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key) - Unique identifier for each feedback entry
      - `user_id` (uuid, foreign key) - References the user who submitted the feedback
      - `message` (text) - The feedback message content
      - `image_url` (text, nullable) - Optional image URL if user attached a photo
      - `created_at` (timestamptz) - Timestamp of when feedback was submitted
      
  2. Storage
    - Create `feedback-images` bucket for storing feedback attachments
    
  3. Security
    - Enable RLS on `feedback` table
    - Users can insert their own feedback
    - Only authenticated users can submit feedback
    - Feedback is read-only after submission (users cannot update/delete)
*/

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at DESC);
