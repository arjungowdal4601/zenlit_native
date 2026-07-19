/*
  Keep location writes functional without granting coordinate SELECT access.
  The caller identity is derived from the JWT, and only coarse coordinates are
  persisted. Passing two NULLs clears location visibility.
*/

CREATE OR REPLACE FUNCTION public.set_my_location(
  latitude numeric,
  longitude numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
  rounded_latitude numeric(5, 2);
  rounded_longitude numeric(5, 2);
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF (latitude IS NULL) <> (longitude IS NULL) THEN
    RAISE EXCEPTION 'Latitude and longitude must both be provided or both be NULL'
      USING ERRCODE = '22023';
  END IF;

  IF latitude IS NOT NULL THEN
    IF latitude::text IN ('NaN', 'Infinity', '-Infinity')
       OR longitude::text IN ('NaN', 'Infinity', '-Infinity')
       OR latitude < -90
       OR latitude > 90
       OR longitude < -180
       OR longitude > 180 THEN
      RAISE EXCEPTION 'Coordinates are outside the valid latitude/longitude range'
        USING ERRCODE = '22023';
    END IF;

    rounded_latitude := round(latitude, 2);
    rounded_longitude := round(longitude, 2);
  END IF;

  INSERT INTO public.locations (
    id,
    lat_full,
    long_full,
    lat_short,
    long_short,
    updated_at
  )
  VALUES (
    caller_id,
    NULL,
    NULL,
    rounded_latitude,
    rounded_longitude,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET lat_full = NULL,
      long_full = NULL,
      lat_short = EXCLUDED.lat_short,
      long_short = EXCLUDED.long_short,
      updated_at = EXCLUDED.updated_at;
END;
$$;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.locations
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.set_my_location(numeric, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_location(numeric, numeric)
  TO authenticated;

COMMENT ON FUNCTION public.set_my_location(numeric, numeric) IS
  'Sets or clears the authenticated user''s rounded location; precise coordinates are never stored.';
