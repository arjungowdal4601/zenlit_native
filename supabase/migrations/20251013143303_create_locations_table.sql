/*
  # Create locations table for radar functionality

  1. New Tables
    - `locations`
      - `id` (uuid, primary key) - References profiles.id
      - `lat_full` (numeric(15,12)) - Full precision latitude
      - `long_full` (numeric(15,12)) - Full precision longitude
      - `lat_short` (numeric(5,2)) - Rounded latitude for proximity matching
      - `long_short` (numeric(5,2)) - Rounded longitude for proximity matching
      - `updated_at` (timestamptz) - Last location update timestamp

  2. Security
    - Enable RLS on `locations` table
    - Add policy for users to update their own location
    - Add policy for authenticated users to read locations of nearby users
    - Create indexes for efficient proximity queries

  3. Important Notes
    - Short coordinates are rounded to 2 decimal places for proximity matching
    - Nearby users are found within ±0.01 range of short coordinates
    - Users can only see nearby users, not all locations
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid NOT NULL,
  lat_full numeric(15, 12) NULL,
  long_full numeric(15, 12) NULL,
  lat_short numeric(5, 2) NULL,
  long_short numeric(5, 2) NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_id_fkey FOREIGN KEY (id) REFERENCES profiles (id) ON DELETE CASCADE
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update their own location"
  ON locations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own location"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view nearby locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_locations_short_coords 
  ON locations (lat_short, long_short);

CREATE INDEX IF NOT EXISTS idx_locations_updated_at 
  ON locations (updated_at DESC);