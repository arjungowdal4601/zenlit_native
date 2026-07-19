/* Allow ON CONFLICT owner updates without reopening coordinate reads. */

DROP POLICY IF EXISTS "Users can view own location row" ON public.locations;
CREATE POLICY "Users can view own location row"
  ON public.locations
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

REVOKE SELECT ON TABLE public.locations FROM PUBLIC, anon, authenticated;
GRANT SELECT (id) ON TABLE public.locations TO authenticated;
