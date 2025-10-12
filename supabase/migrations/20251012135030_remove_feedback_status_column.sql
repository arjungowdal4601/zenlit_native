/*
  # Remove Status Column from Feedback Table

  1. Changes
    - Drop the `status` column from `feedback` table
    - This column is not needed for the feedback functionality
    
  2. Notes
    - This is a non-destructive change if status was never used
    - All other columns remain intact (id, user_id, message, image_url, created_at)
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'feedback' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE feedback DROP COLUMN status;
  END IF;
END $$;
