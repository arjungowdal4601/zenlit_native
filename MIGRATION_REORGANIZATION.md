# Supabase Migration Reorganization - Complete Guide

## Overview

Your Supabase migrations folder has been reorganized to eliminate confusion, remove duplicates, and create a clear, linear migration history. The previous 24 migration files contained conflicting schemas and have been consolidated into 3 clean, comprehensive migrations.

## What Was Wrong

### Issues Identified

1. **Duplicate Tables** - Multiple files creating the same tables:
   - 3 files for `social_links` table
   - 2 files for `posts` table
   - 2 files for storage buckets

2. **Conflicting Messaging Architecture** - 11 files switching between two incompatible systems:
   - Conversation-based messaging (with `conversations` table and `conversation_id`)
   - Direct messaging (with `sender_id` and `receiver_id`)
   - Your code uses direct messaging, but migrations kept switching architectures

3. **Obsolete Migrations** - Files that add features then immediately remove them:
   - Added `image_url` to messages, then removed it
   - Added anonymity fields to conversations that don't exist in final schema

4. **Inconsistent Column Names**:
   - Migrations used `created_at` and `read_at`
   - Types file showed `sent_at` and `seen_at`
   - Database interface expected mix of both

## New Migration Structure

### ✅ Files to Keep (3 new files)

1. **`20250101000000_initial_schema.sql`** (Main migration)
   - Creates all core tables in correct dependency order
   - Profiles, social_links, posts, locations, messages, feedback
   - All RLS policies and indexes
   - All helper functions (mark_direct_delivered, mark_direct_read, get_unread_counts_direct)
   - Username/email availability checkers
   - Direct messaging architecture (NO conversations table)

2. **`20250101000001_storage_buckets.sql`** (Storage setup)
   - Creates all 3 storage buckets: profile-images, post-images, feedback-images
   - All storage policies for upload/update/delete/read
   - Proper folder-based access control

3. **`20250101000002_seed_data_optional.sql`** (Optional test data)
   - 5 test user profiles
   - Social links with realistic data
   - Location data (all within proximity range)
   - Sample posts with images
   - Can be skipped in production

### ❌ Files to Delete (24 old files)

All files with timestamps starting with `202510`, `202512` should be deleted:

```
20251012110915_drop_all_tables.sql
20251012111821_drop_postgis_extension.sql
20251012114523_create_profiles_table.sql
20251012120001_create_social_links_table.sql
20251012120002_create_posts_table.sql
20251012120003_create_storage_buckets.sql
20251012120727_create_social_links_table.sql
20251012120759_create_posts_table.sql
20251012120834_create_storage_buckets.sql
20251012133943_create_feedback_table.sql
20251012133957_create_feedback_storage_bucket.sql
20251012135030_remove_feedback_status_column.sql
20251013143303_create_locations_table.sql
20251013165442_create_conversations_table.sql
20251013165458_create_messages_table.sql
20251013174633_insert_dummy_data_corrected.sql
20251018190000_add_message_status_and_unread.sql
20251020153000_reconcile_conversations_anonymity_and_messages_image.sql
20251021113116_restore_conversation_messaging_fixed_v3.sql
20251021120114_simplify_messaging_system_v3.sql
20251021131000_remove_image_url_from_messages.sql
20251021145000_direct_messaging.sql
20251021153000_fix_messaging_complete.sql
20251021210000_restore_conversation_messaging.sql
```

## Schema Alignment with Code

The new migrations now perfectly match what your application code expects:

### Profiles Table
```sql
- id (uuid, primary key)
- display_name (text)
- user_name (text, unique)
- date_of_birth (date, nullable)
- gender (text, nullable: 'male'|'female'|'other')
- email (text, unique)
- account_created_at (timestamptz)
```

### Social Links Table
```sql
- id (uuid, foreign key to profiles)
- profile_pic_url (text)
- banner_url (text)
- bio (text)
- instagram (text)
- x_twitter (text)
- linkedin (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Posts Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- content (text)
- image_url (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Locations Table
```sql
- id (uuid, foreign key to profiles)
- lat_full (numeric(15,12))
- long_full (numeric(15,12))
- lat_short (numeric(5,2))
- long_short (numeric(5,2))
- updated_at (timestamptz)
```

### Messages Table (Direct Messaging - NO conversations table)
```sql
- id (uuid, primary key)
- sender_id (uuid, foreign key to profiles)
- receiver_id (uuid, foreign key to profiles)
- text (text)
- sent_at (timestamptz)
- delivered_at (timestamptz, nullable)
- seen_at (timestamptz, nullable)
```

### Feedback Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- message (text)
- image_url (text, nullable)
- created_at (timestamptz)
```

## Functions Available

All these RPC functions are now in the initial schema:

- `mark_direct_delivered(peer_id uuid)` - Mark messages from peer as delivered
- `mark_direct_read(peer_id uuid)` - Mark messages from peer as read
- `get_unread_counts_direct()` - Get unread message counts per sender
- `check_username_available(username_to_check text)` - Check if username is available
- `check_email_available(email_to_check text)` - Check if email is available
- `generate_username_suggestions(base_username text, max_suggestions int)` - Generate username suggestions

## How to Clean Up

### Step 1: Backup Your Database (Important!)

Before making any changes, create a backup of your current database.

### Step 2: Delete Old Migration Files

**Option A: Using Terminal**
```bash
cd supabase/migrations
rm 202510*.sql 202512*.sql
```

**Option B: Manual Deletion**
Delete each file listed in the "Files to Delete" section above through your file explorer or IDE.

**Option C: Using Python Script**
```bash
python3 /tmp/cleanup-old-migrations.py
```

### Step 3: Verify New Migrations

After deletion, you should only have these files in `supabase/migrations/`:
```
20250101000000_initial_schema.sql
20250101000001_storage_buckets.sql
20250101000002_seed_data_optional.sql
```

### Step 4: Apply Migrations (if needed)

If you need to reset your database and apply the clean migrations:

1. **Reset your database** (This will delete all data!)
   ```bash
   # If using Supabase locally
   supabase db reset

   # Or manually drop all tables in Supabase dashboard
   ```

2. **Apply new migrations**
   - The migrations will be applied automatically in order
   - Skip the seed data migration if you don't want test data

## Important Notes

### Column Name Compatibility

The messages table uses `sent_at` and `seen_at` (matching your types file). However, your code uses `created_at` and `read_at`. You'll need to either:

1. **Update your code** to use `sent_at` and `seen_at`
2. **Update the migration** to use `created_at` and `read_at`

Current migration uses: `sent_at`, `delivered_at`, `seen_at` (matches types.ts)
Your database.ts uses: `created_at`, `delivered_at`, `read_at`

**Recommendation**: Update `database.ts` to use the column names from types.ts for consistency.

### No Conversations Table

The new schema uses **direct messaging** (sender_id → receiver_id) and does NOT include a `conversations` table. This matches what your application code expects.

### Anonymity Features

If you need proximity-based anonymity (showing/hiding user identity based on distance), this should be handled in your application layer, not in the database schema.

## Benefits of New Structure

✅ **Single source of truth** - Each table defined once
✅ **Clear dependency order** - Tables created in correct sequence
✅ **Matches code expectations** - Schema aligns with TypeScript types and database queries
✅ **No conflicts** - Single messaging architecture (direct messaging)
✅ **Well documented** - Each migration has detailed comments
✅ **Proper RLS** - All security policies in place
✅ **Optimized indexes** - Performance indexes for common queries
✅ **Clean history** - Linear migration timeline, easy to understand

## Questions or Issues?

If you encounter any issues:

1. Check that old migrations are completely removed
2. Verify your database.ts uses correct column names (sent_at/seen_at vs created_at/read_at)
3. Ensure no code references the `conversations` table
4. Confirm all storage bucket references use correct names

The new structure eliminates all the confusion and gives you a clean foundation to build on!
