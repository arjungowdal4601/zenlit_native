# Migration Cleanup Instructions

The following old migration files should be deleted. They have been replaced by the new consolidated migrations.

## Files to Delete (24 old files)

1. `20251012110915_drop_all_tables.sql`
2. `20251012111821_drop_postgis_extension.sql`
3. `20251012114523_create_profiles_table.sql`
4. `20251012120001_create_social_links_table.sql`
5. `20251012120002_create_posts_table.sql`
6. `20251012120003_create_storage_buckets.sql`
7. `20251012120727_create_social_links_table.sql`
8. `20251012120759_create_posts_table.sql`
9. `20251012120834_create_storage_buckets.sql`
10. `20251012133943_create_feedback_table.sql`
11. `20251012133957_create_feedback_storage_bucket.sql`
12. `20251012135030_remove_feedback_status_column.sql`
13. `20251013143303_create_locations_table.sql`
14. `20251013165442_create_conversations_table.sql`
15. `20251013165458_create_messages_table.sql`
16. `20251013174633_insert_dummy_data_corrected.sql`
17. `20251018190000_add_message_status_and_unread.sql`
18. `20251020153000_reconcile_conversations_anonymity_and_messages_image.sql`
19. `20251021113116_restore_conversation_messaging_fixed_v3.sql`
20. `20251021120114_simplify_messaging_system_v3.sql`
21. `20251021131000_remove_image_url_from_messages.sql`
22. `20251021145000_direct_messaging.sql`
23. `20251021153000_fix_messaging_complete.sql`
24. `20251021210000_restore_conversation_messaging.sql`

## Files to Keep (3 new consolidated files)

1. `20250101000000_initial_schema.sql` - Complete database schema
2. `20250101000001_storage_buckets.sql` - Storage bucket configuration
3. `20250101000002_seed_data_optional.sql` - Optional test data

## Manual Deletion Commands

Run these commands from the project root to delete all old migration files:

```bash
cd supabase/migrations
rm 20251012110915_drop_all_tables.sql
rm 20251012111821_drop_postgis_extension.sql
rm 20251012114523_create_profiles_table.sql
rm 20251012120001_create_social_links_table.sql
rm 20251012120002_create_posts_table.sql
rm 20251012120003_create_storage_buckets.sql
rm 20251012120727_create_social_links_table.sql
rm 20251012120759_create_posts_table.sql
rm 20251012120834_create_storage_buckets.sql
rm 20251012133943_create_feedback_table.sql
rm 20251012133957_create_feedback_storage_bucket.sql
rm 20251012135030_remove_feedback_status_column.sql
rm 20251013143303_create_locations_table.sql
rm 20251013165442_create_conversations_table.sql
rm 20251013165458_create_messages_table.sql
rm 20251013174633_insert_dummy_data_corrected.sql
rm 20251018190000_add_message_status_and_unread.sql
rm 20251020153000_reconcile_conversations_anonymity_and_messages_image.sql
rm 20251021113116_restore_conversation_messaging_fixed_v3.sql
rm 20251021120114_simplify_messaging_system_v3.sql
rm 20251021131000_remove_image_url_from_messages.sql
rm 20251021145000_direct_messaging.sql
rm 20251021153000_fix_messaging_complete.sql
rm 20251021210000_restore_conversation_messaging.sql
```

Or use this single command:

```bash
cd supabase/migrations && rm 202510*.sql 202512*.sql
```
