import fs from 'fs';
import path from 'path';

const migrationPath = path.resolve(
  __dirname,
  '../../supabase/migrations/20260710124100_set_my_location_rpc.sql',
);
const sql = fs.readFileSync(migrationPath, 'utf8').replace(/\s+/g, ' ').trim();

describe('set_my_location migration contract', () => {
  it('keeps the RPC auth-bound and stores only rounded coordinates', () => {
    expect(sql).toContain('SECURITY DEFINER');
    expect(sql).toContain("SET search_path = ''");
    expect(sql).toContain('caller_id uuid := (SELECT auth.uid())');
    expect(sql).toContain('rounded_latitude := round(latitude, 2)');
    expect(sql).toContain('rounded_longitude := round(longitude, 2)');
    expect(sql).toContain('caller_id, NULL, NULL, rounded_latitude, rounded_longitude, now()');
    expect(sql).toContain(
      'SET lat_full = NULL, long_full = NULL, lat_short = EXCLUDED.lat_short, long_short = EXCLUDED.long_short',
    );
  });

  it('makes the RPC the only authenticated write path', () => {
    expect(sql).toContain(
      'REVOKE INSERT, UPDATE, DELETE ON TABLE public.locations FROM PUBLIC, anon, authenticated',
    );
    expect(sql).toContain(
      'REVOKE ALL ON FUNCTION public.set_my_location(numeric, numeric) FROM PUBLIC, anon, authenticated',
    );
    expect(sql).toContain(
      'GRANT EXECUTE ON FUNCTION public.set_my_location(numeric, numeric) TO authenticated',
    );
  });
});
