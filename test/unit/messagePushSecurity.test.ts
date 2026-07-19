import fs from 'fs';
import path from 'path';

const migrationPath = path.resolve(
  __dirname,
  '../../supabase/migrations/20260710124200_harden_message_push_dispatch.sql',
);
const edgeFunctionPath = path.resolve(
  __dirname,
  '../../supabase/functions/send-push-notification/index.ts',
);

const migrationSource = fs.readFileSync(migrationPath, 'utf8');
const migrationSql = migrationSource.replace(/\s+/g, ' ').trim();
const edgeFunctionSource = fs.readFileSync(edgeFunctionPath, 'utf8');

describe('message and push security contracts', () => {
  it('makes message mutation server-controlled and authorizes only nearby inserts', () => {
    expect(migrationSql).toContain(
      'REVOKE INSERT, UPDATE, DELETE ON TABLE public.messages FROM PUBLIC, anon, authenticated',
    );
    expect(migrationSql).toContain(
      'GRANT INSERT (id, sender_id, receiver_id, text) ON TABLE public.messages TO authenticated',
    );
    expect(migrationSql).not.toMatch(/GRANT INSERT \([^)]*created_at/);
    expect(migrationSql).toContain(
      'DROP POLICY IF EXISTS "Users can update message status" ON public.messages',
    );
    expect(migrationSql).toContain(
      'DROP POLICY IF EXISTS "Users can send nearby messages" ON public.messages',
    );
    expect(migrationSql).toContain('(SELECT auth.uid()) = sender_id');
    expect(migrationSql).toContain('AND sender_id <> receiver_id');
    expect(migrationSql).toContain('AND (SELECT public.is_user_nearby(receiver_id))');
    expect(migrationSql).not.toMatch(/CREATE POLICY [^;]+ FOR UPDATE/);
  });

  it('keeps delivery and read state behind the authenticated owner-bound RPCs', () => {
    expect(migrationSql).toContain(
      'REVOKE ALL ON FUNCTION public.mark_messages_delivered(uuid) FROM PUBLIC, anon',
    );
    expect(migrationSql).toContain(
      'REVOKE ALL ON FUNCTION public.mark_messages_read(uuid) FROM PUBLIC, anon',
    );
    expect(migrationSql).toContain(
      'GRANT EXECUTE ON FUNCTION public.mark_messages_delivered(uuid) TO authenticated',
    );
    expect(migrationSql).toContain(
      'GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated',
    );
  });

  it('serializes rate checks and leases failed or stale retry attempts', () => {
    expect(migrationSql).toContain(
      'CREATE OR REPLACE FUNCTION public.claim_push_notification_dispatch',
    );
    expect(migrationSql).toContain('SECURITY DEFINER');
    expect(migrationSql).toContain("SET search_path = ''");
    expect(migrationSql).toContain('pg_catalog.pg_advisory_xact_lock');
    expect(migrationSql.indexOf('pg_catalog.pg_advisory_xact_lock')).toBeLessThan(
      migrationSql.indexOf('SELECT count(*)::integer'),
    );
    expect(migrationSql).toContain("outcome IN ('claimed', 'sent', 'skipped', 'failed')");
    expect(migrationSql).toContain('claim_token = claim_token_next');
    expect(migrationSql).toContain('attempt_count = d.attempt_count + 1');
    expect(migrationSql).toContain(
      'REVOKE ALL ON FUNCTION public.claim_push_notification_dispatch(uuid, integer, integer) FROM PUBLIC, anon, authenticated',
    );
    expect(migrationSql).toContain(
      'GRANT EXECUTE ON FUNCTION public.claim_push_notification_dispatch(uuid, integer, integer) TO service_role',
    );
  });

  it('uses the atomic claim RPC and claim token for every terminal state', () => {
    expect(edgeFunctionSource).toMatch(
      /\.rpc\(\s*"claim_push_notification_dispatch"/,
    );
    expect(edgeFunctionSource).not.toContain(
      '.select("message_id", { count: "exact", head: true })',
    );
    expect(edgeFunctionSource).toContain('.eq("claim_token", activeClaimToken)');
    expect(edgeFunctionSource).toContain('{ outcome: "failed", sent_at: null');
    expect(edgeFunctionSource).toContain('AbortSignal.timeout(EXPO_REQUEST_TIMEOUT_MS)');
  });
});
