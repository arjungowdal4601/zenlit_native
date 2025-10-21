# How to Apply the Database Migration

The messaging feature is failing because the database schema needs to be updated. Follow these steps to fix it:

## Steps to Apply Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**
   - Go to https://supabase.com/dashboard
   - Select your project: `yxucgloawhbpjuweoipt`
   - Click on "SQL Editor" in the left sidebar

2. **Copy the Migration SQL**
   - Open the file: `supabase/migrations/20251021210000_restore_conversation_messaging.sql`
   - Copy all the SQL content

3. **Run the Migration**
   - Paste the SQL into the SQL Editor
   - Click "Run" button
   - Wait for it to complete (should take 5-10 seconds)
   - You should see "Success. No rows returned" message

4. **Enable Realtime**
   - Go to "Database" → "Replication" in the left sidebar
   - Find the `conversations` table and toggle "Realtime" to ON
   - Find the `messages` table and toggle "Realtime" to ON

5. **Verify Tables**
   - Go to "Table Editor" in the left sidebar
   - You should see:
     - `conversations` table with columns: id, user_a_id, user_b_id, is_anonymous_for_a, is_anonymous_for_b, last_message_at, created_at, last_read_at_a, last_read_at_b
     - `messages` table with columns: id, conversation_id, sender_id, text, created_at, delivered_at, read_at

### Option 2: Using Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
cd /tmp/cc-agent/58981553/project
supabase db push
```

## After Migration

1. **Refresh your app** (reload the page)
2. **Test the messaging feature**:
   - Try to start a conversation from the radar
   - Send a message
   - Check if messages appear in real-time
   - Verify anonymity features work when users are beyond 1.5km

## What This Migration Does

- ✅ Creates the `conversations` table with anonymity tracking
- ✅ Migrates existing messages to conversation-based structure
- ✅ Adds RPC functions for marking messages as delivered/read
- ✅ Updates all RLS policies for secure access
- ✅ Removes old direct messaging columns and constraints

## Troubleshooting

If you see errors:
- Make sure you're logged into the correct Supabase project
- Check that the SQL Editor shows "Success" after running
- Verify Realtime is enabled on both tables
- Clear your browser cache and reload the app