/*
  # Create conversations table for messaging

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `user_a_id` (uuid, foreign key to profiles)
      - `user_b_id` (uuid, foreign key to profiles)
      - `is_anonymous_for_a` (boolean) - Whether user A sees the conversation as anonymous
      - `is_anonymous_for_b` (boolean) - Whether user B sees the conversation as anonymous
      - `last_message_at` (timestamptz) - Last message timestamp for sorting
      - `created_at` (timestamptz) - Conversation creation timestamp

  2. Security
    - Enable RLS on `conversations` table
    - Add policy for users to view their own conversations
    - Add policy for users to insert conversations they are part of
    - Add policy for users to update conversations they are part of

  3. Important Notes
    - Conversations are bidirectional between two users
    - Anonymous flags control identity masking based on proximity and visibility
    - Indexes on user IDs for efficient lookup
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL,
  user_b_id uuid NOT NULL,
  is_anonymous_for_a boolean DEFAULT false,
  is_anonymous_for_b boolean DEFAULT false,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT conversations_user_a_fkey FOREIGN KEY (user_a_id) REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT conversations_user_b_fkey FOREIGN KEY (user_b_id) REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT conversations_different_users CHECK (user_a_id != user_b_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can create conversations they are part of"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id)
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_a 
  ON conversations (user_a_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_b 
  ON conversations (user_b_id, last_message_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_pair 
  ON conversations (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));