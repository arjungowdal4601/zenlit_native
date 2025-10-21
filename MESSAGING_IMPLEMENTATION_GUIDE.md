# Messaging Feature Implementation Guide

## Overview
This guide explains the complete proximity-based anonymous messaging system that has been implemented.

---

## How It Works

### 1. **Message Initiation** (From Radar Page Only)
- Users can only start conversations from the **Radar page**
- When viewing nearby users, click the message icon on their profile card
- This creates a conversation and navigates to the chat screen
- The **Messages page** is ONLY for viewing existing conversations with message history

### 2. **Proximity-Based Anonymity** (1.5km Radius)
The system uses `lat_short` and `long_short` (rounded to 2 decimal places) for proximity calculations:

**When users are NEARBY (≤ 1.5km):**
- Distance between `lat_short` and `long_short` is ≤ 0.01
- Conversations show as **NON-ANONYMOUS**
- Full profile visible: name, profile picture, clickable profile
- Users can message each other

**When users are FAR (> 1.5km):**
- Distance between `lat_short` and `long_short` is > 0.01
- Conversations automatically become **ANONYMOUS**
- Profile hidden: shows "Anonymous", generic avatar, no profile access
- Chat history remains accessible but identity is hidden
- Users can still send messages

**When users become NEARBY again:**
- Anonymity automatically removed
- Full profiles become visible again
- All previous messages remain intact

---

## Database Schema

### Tables

#### `conversations`
```sql
id                    uuid PRIMARY KEY
user_a_id             uuid NOT NULL (FK to profiles)
user_b_id             uuid NOT NULL (FK to profiles)
is_anonymous_for_a    boolean DEFAULT false
is_anonymous_for_b    boolean DEFAULT false
last_message_at       timestamptz
created_at            timestamptz
last_read_at_a        timestamptz
last_read_at_b        timestamptz
```

#### `messages`
```sql
id                uuid PRIMARY KEY
conversation_id   uuid NOT NULL (FK to conversations)
sender_id         uuid NOT NULL (FK to profiles)
text              text NOT NULL
created_at        timestamptz
delivered_at      timestamptz
read_at           timestamptz
```

### Database Functions

#### `check_users_nearby(user_id_1, user_id_2)`
- Returns `boolean`
- Checks if two users are within 1.5km (0.01 lat/long_short difference)
- Returns `false` if either location is missing or null

#### `update_conversation_anonymity_by_id(conv_id)`
- Updates anonymity flags for a single conversation
- Called automatically when locations change
- Sets `is_anonymous_for_a` and `is_anonymous_for_b` based on proximity

#### `update_user_conversations_anonymity(target_user_id)`
- Updates all conversations for a specific user
- Called by the trigger when location changes

### Automatic Trigger

**`trigger_update_conversations_on_location_change`**
- Fires on `INSERT` or `UPDATE` to `locations` table
- Automatically updates conversation anonymity when any user's location changes
- Ensures real-time anonymity updates without manual intervention

---

## Implementation Steps

### Step 1: Apply Database Migration

You need to run the migration SQL file in your Supabase dashboard:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Create a new query
3. Copy the contents of `supabase/migrations/20251021153000_fix_messaging_complete.sql`
4. Paste and click **Run**
5. Verify success message appears

**What this migration does:**
- Creates proximity check functions
- Creates anonymity update functions
- Creates automatic trigger for location changes
- Updates all existing conversations with correct anonymity state

### Step 2: Enable Realtime (if not already enabled)

In Supabase Dashboard → **Database** → **Replication**:
- Enable realtime for `conversations` table
- Enable realtime for `messages` table

This ensures:
- Real-time anonymity updates when users move
- Real-time message delivery
- Real-time conversation list updates

### Step 3: Verify Code Changes

The following files have been updated:

**`src/components/messaging/ChatHeader.tsx`**
- Now properly disables profile navigation when anonymous
- Shows "Anonymous" label for accessibility
- Removes click ripple effect when anonymous

**`app/messages/[id].tsx`**
- Added realtime listener for conversation updates
- Automatically updates anonymity state when conversation changes
- Updates UI immediately when user becomes anonymous/non-anonymous

**`app/messages/index.tsx`**
- Already properly handles realtime conversation updates
- Refreshes conversation list when anonymity flags change

**`src/components/SocialProfileCard.tsx`**
- Message initiation from profile cards works correctly
- Creates conversation and navigates to chat

---

## Testing the Messaging Feature

### Test 1: Basic Messaging Between Nearby Users

1. **Setup:** Have two users (A and B) set locations within 1.5km
2. **Action:** User A opens Radar page and sees User B's profile
3. **Expected:** User A clicks message icon on B's profile card
4. **Expected:** Conversation screen opens, showing B's name and profile picture
5. **Action:** User A sends a message
6. **Expected:** Message appears immediately for both users
7. **Expected:** Conversation appears in Messages page for both users

### Test 2: Anonymity When Users Move Apart

1. **Setup:** Users A and B have an active conversation (within 1.5km)
2. **Action:** User B moves their location to > 1.5km away
3. **Expected:** Conversation automatically becomes anonymous for both users
4. **Expected:** User A sees "Anonymous" instead of B's name
5. **Expected:** Profile picture becomes generic avatar
6. **Expected:** Clicking on name/avatar does nothing (no navigation)
7. **Expected:** Chat history remains fully accessible
8. **Expected:** Users can still send new messages

### Test 3: Anonymity Removed When Users Become Nearby Again

1. **Setup:** Users A and B have anonymous conversation (> 1.5km apart)
2. **Action:** User B moves location back within 1.5km of User A
3. **Expected:** Conversation automatically becomes non-anonymous
4. **Expected:** B's real name and profile picture appear again
5. **Expected:** Clicking profile navigates to B's profile page
6. **Expected:** All previous messages remain intact

### Test 4: Messages Page Only Shows Conversations With Messages

1. **Action:** User A initiates conversation with User B from Radar
2. **Expected:** Conversation appears in Messages page for User A
3. **Expected:** Conversation does NOT appear in Messages page for User B (no messages sent yet)
4. **Action:** User A sends a message
5. **Expected:** Conversation now appears in Messages page for User B
6. **Expected:** Both users can see the conversation in their Messages page

### Test 5: Message Initiation Only From Radar

1. **Setup:** Users A and B are nearby
2. **Action:** User A opens Messages page
3. **Expected:** No button to start new conversation
4. **Expected:** Only existing conversations visible
5. **Action:** User A opens Radar page
6. **Expected:** User B's profile card shows message icon
7. **Action:** User A clicks message icon
8. **Expected:** Conversation screen opens immediately

---

## Troubleshooting

### Issue: Anonymity not updating automatically
**Solution:**
- Verify realtime is enabled for `conversations` table
- Check that location updates are actually changing `lat_short` and `long_short`
- Verify the trigger exists: Run `SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_conversations_on_location_change';`

### Issue: Profile navigation still works when anonymous
**Solution:**
- Clear app cache and reload
- Verify `ChatHeader.tsx` has the updated code with `disabled={isAnonymous || !profileId}`

### Issue: Conversations not appearing in Messages page
**Solution:**
- Verify at least one message has been sent in the conversation
- Check that `getUserConversations()` is being called correctly
- Verify RLS policies allow the user to view their conversations

### Issue: Location-based features not working
**Solution:**
- Ensure users have granted location permission
- Verify location data exists in `locations` table
- Check that `lat_short` and `long_short` are not NULL
- Verify visibility is enabled in the app

---

## Important Notes

### Proximity Calculation
- Uses `lat_short` and `long_short` (2 decimal places)
- 0.01 difference ≈ 1.5km at most latitudes
- This is intentional for efficient SQL queries
- Some accuracy is traded for performance

### Anonymity is Bidirectional
- When users are far apart, BOTH see each other as anonymous
- When users are nearby, BOTH see each other's full profiles
- No asymmetric anonymity (one user anonymous, other not)

### Message Persistence
- Messages are NEVER deleted when anonymity changes
- Full chat history always available
- Only the display of identity changes

### Real-time Updates
- Anonymity updates happen automatically via database trigger
- Frontend receives updates via Supabase realtime subscriptions
- No manual refresh needed

---

## Summary

The messaging system is now fully implemented with:
✅ Message initiation only from Radar page
✅ Messages page shows conversation history only
✅ Automatic proximity-based anonymity (1.5km radius)
✅ Real-time anonymity updates when users move
✅ Anonymous mode hides all identity information
✅ Profile navigation blocked when anonymous
✅ Chat history always accessible
✅ Bidirectional anonymity enforcement

The system works entirely automatically through database triggers and realtime subscriptions. No manual intervention or API calls needed for anonymity updates!
