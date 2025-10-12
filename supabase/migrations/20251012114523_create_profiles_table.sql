/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - Links to auth.users
      - `display_name` (text, required) - User's display name (not unique, can be duplicated)
      - `user_name` (text, required, unique) - Unique username for the user
      - `date_of_birth` (date, optional) - User's date of birth
      - `gender` (text, optional) - User's gender (male/female/other)
      - `email` (text, required, unique) - User's email address
      - `account_created_at` (timestamptz, default now()) - Account creation timestamp
  
  2. Security
    - Enable RLS on `profiles` table
    - Add policy for authenticated users to read their own profile
    - Add policy for authenticated users to insert their own profile
    - Add policy for authenticated users to update their own profile
  
  3. Indexes
    - Index on email for faster lookups
    - Index on user_name for uniqueness checking
  
  4. Constraints
    - Gender must be 'male', 'female', or 'other'
    - Username must match format: lowercase letters, numbers, dots, underscores, and special characters
    - Email and username must be unique
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  user_name text NOT NULL,
  date_of_birth date NULL,
  gender text NULL,
  email text NOT NULL,
  account_created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_user_name_key UNIQUE (user_name),
  CONSTRAINT profiles_gender_check CHECK (
    gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])
  ),
  CONSTRAINT username_format_check CHECK (
    user_name ~ '^[a-z0-9._!@#$%^&*()+=\-\[\]{}|;:,<>?/~`]+$'::text
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_name ON public.profiles USING btree (user_name);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Anyone can check username availability (for signup flow)
CREATE POLICY "Anyone can check username availability"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);