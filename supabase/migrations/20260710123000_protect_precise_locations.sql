/*
  Keep precise coordinates out of both persistent storage and client-readable
  tables. Clients receive only nearby user IDs through auth-scoped RPCs and
  subscribe to an ID-only presence table for refresh signals.
*/

UPDATE public.locations
SET lat_full = null,
    long_full = null
WHERE lat_full IS NOT NULL OR long_full IS NOT NULL;

DROP POLICY IF EXISTS "Users can view nearby locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can view all locations" ON public.locations;

REVOKE SELECT ON TABLE public.locations FROM PUBLIC, anon, authenticated;
GRANT SELECT (id) ON TABLE public.locations TO authenticated;

CREATE POLICY "Users can view own location row"
  ON public.locations
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE OR REPLACE FUNCTION public.get_nearby_user_ids(include_self boolean DEFAULT false)
RETURNS TABLE (user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH viewer AS (
    SELECT lat_short, long_short
    FROM public.locations
    WHERE id = (SELECT auth.uid())
      AND lat_short IS NOT NULL
      AND long_short IS NOT NULL
  )
  SELECT location.id AS user_id
  FROM public.locations AS location
  CROSS JOIN viewer
  WHERE location.lat_short IS NOT NULL
    AND location.long_short IS NOT NULL
    AND (include_self OR location.id <> (SELECT auth.uid()))
    AND abs(location.lat_short - viewer.lat_short) <= 0.01
    AND abs(location.long_short - viewer.long_short) <= 0.01
$$;

CREATE OR REPLACE FUNCTION public.is_user_nearby(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.locations AS viewer
    JOIN public.locations AS target ON target.id = target_user_id
    WHERE viewer.id = (SELECT auth.uid())
      AND viewer.lat_short IS NOT NULL
      AND viewer.long_short IS NOT NULL
      AND target.lat_short IS NOT NULL
      AND target.long_short IS NOT NULL
      AND abs(target.lat_short - viewer.lat_short) <= 0.01
      AND abs(target.long_short - viewer.long_short) <= 0.01
  )
$$;

REVOKE ALL ON FUNCTION public.get_nearby_user_ids(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_nearby_user_ids(boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.is_user_nearby(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user_nearby(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.location_presence (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.location_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can observe location presence"
  ON public.location_presence;
CREATE POLICY "Authenticated users can observe location presence"
  ON public.location_presence
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE ALL ON TABLE public.location_presence FROM PUBLIC, anon, authenticated;
GRANT SELECT (id) ON TABLE public.location_presence TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_location_presence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.location_presence WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- The row is an ID-only change signal. Keep it even when visibility turns
  -- off so the UPDATE event tells clients to re-run the protected RPC.
  INSERT INTO public.location_presence (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_location_presence()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_location_presence ON public.locations;
CREATE TRIGGER sync_location_presence
  AFTER INSERT OR UPDATE OR DELETE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_location_presence();

INSERT INTO public.location_presence (id)
SELECT id
FROM public.locations
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'location_presence'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.location_presence;
  END IF;
END
$$;
