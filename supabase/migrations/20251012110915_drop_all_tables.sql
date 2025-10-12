/*
  # Drop All Tables

  ## Overview
  This migration removes all application tables from the database.

  ## Tables Dropped
  - feedback
  - messages
  - threads
  - follows
  - likes
  - comments
  - posts
  - social_links
  - profiles

  ## Note
  Tables are dropped in reverse order of dependencies to avoid foreign key constraint violations.
  The spatial_ref_sys table (PostGIS system table) is NOT dropped.
*/

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS social_links CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_thread_last_message() CASCADE;
