/*
  # Create messages table for messaging

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `sender_id` (uuid, foreign key to profiles)
      - `text` (text, nullable) - Message text content
      - `image_url` (text, nullable) - Optional image attachment
      - `created_at` (timestamptz) - Message timestamp

  2. Security
    - Enable RLS on `messages` table
    - Add policy for users to view messages in their conversations
    - Add policy for users to insert messages in their conversations
    - No update or delete policies (messages are immutable)

  3. Important Notes
    - Messages are linked to conversations
    - At least one of text or image_url must be present
    - Sender must be a participant in the conversation
    - Messages are ordered by created_at for display
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  text text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT messages_conversation_fkey FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_fkey FOREIGN KEY (sender_id) REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT messages_has_content CHECK (text IS NOT NULL OR image_url IS NOT NULL)
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user_a_id = auth.uid() OR conversations.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user_a_id = auth.uid() OR conversations.user_b_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
  ON messages (sender_id, created_at DESC);