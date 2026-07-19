import fs from 'fs';
import path from 'path';

const migrationPath = path.resolve(
  __dirname,
  '../../supabase/migrations/20260718072404_restore_owner_scoped_image_object_select.sql',
);
const source = fs.readFileSync(migrationPath, 'utf8');
const sql = source.replace(/\s+/g, ' ').trim();

describe('image storage SELECT policy', () => {
  it('lets authenticated users read object metadata only in their own UID folder', () => {
    expect(sql).toContain('FOR SELECT TO authenticated');
    expect(sql).toContain(
      "bucket_id IN ('profile-images', 'post-images', 'feedback-images')",
    );
    expect(sql).toContain(
      'AND (storage.foldername(name))[1] = (SELECT auth.uid())::text',
    );
  });

  it('does not restore anonymous or cross-user bucket listing', () => {
    expect(sql).not.toMatch(/\bTO (?:anon|public)\b/i);
    expect(sql).not.toMatch(/USING \( bucket_id IN \([^)]*\) \);/i);
  });
});
