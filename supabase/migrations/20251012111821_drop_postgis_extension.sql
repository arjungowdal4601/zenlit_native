/*
  # Drop PostGIS Extension

  ## Overview
  This migration removes the PostGIS extension and all related tables.

  ## Extensions Dropped
  - postgis (which will automatically drop spatial_ref_sys table)
*/

DROP EXTENSION IF EXISTS postgis CASCADE;
