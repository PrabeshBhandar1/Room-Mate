# Messages Setup Guide

## ⚠️ IMPORTANT: Run This SQL First

Before using the messaging feature, you **MUST** run the RLS policies in your Supabase SQL Editor.

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the RLS Policies
Copy and paste the contents of `web/supabase/messages_rls_policies.sql` into the SQL editor and click "Run".

This will:
- ✅ Enable Row Level Security on the messages table
- ✅ Create policies for sending messages
- ✅ Create policies for viewing messages
- ✅ Create policies for updating read status
- ✅ Add performance indexes

### Step 3: Enable Realtime (Optional but Recommended)
1. In Supabase dashboard, go to "Database" → "Replication"
2. Find the `messages` table
3. Toggle "Enable Realtime" to ON
4. This enables instant message delivery without page refresh

---

## How to Use the Messaging Feature

### For Tenants:
1. **Browse Listings**: Go to `/search` or click "Browse Listings" on homepage
2. **View Listing**: Click on any listing that interests you
3. **Message Owner**: Click the "💬 Message Owner" button
4. **Send Message**: Type your message and click "Send"

### For Owners:
1. **Check Messages**: Go to `/messages` or click on the messages link
2. **View Conversations**: See all conversations in the left sidebar
3. **Reply**: Click on a conversation and type your response

---

## Troubleshooting

### "No conversations yet" showing
- This is normal if you haven't started any conversations
- Click "Browse Listings" to find properties and message owners

### Page redirects to homepage on reload
- ✅ **FIXED**: Updated auth check to wait for user to load

### Messages not appearing in real-time
- Make sure you've enabled Realtime for the `messages` table in Supabase
- Check browser console for any errors

### "Failed to send message" error
- Make sure you've run the RLS policies SQL
- Check that the messages table exists
- Verify you're logged in

---

## Testing the Feature

### Test Scenario 1: Tenant Messages Owner
1. Create two accounts: one tenant, one owner
2. Owner creates a listing and admin approves it
3. Tenant browses to the listing
4. Tenant clicks "Message Owner"
5. Tenant sends a message
6. ✅ Message should appear in conversation

### Test Scenario 2: Owner Replies
1. Owner logs in and goes to `/messages`
2. Owner sees the conversation with unread count
3. Owner clicks on the conversation
4. Owner types and sends a reply
5. ✅ Reply should appear instantly

### Test Scenario 3: Realtime Updates
1. Open two browser windows (or use incognito)
2. Log in as tenant in one, owner in other
3. Start a conversation
4. Send messages from both sides
5. ✅ Messages should appear instantly in both windows

---

## Security Notes

### What the RLS Policies Do:
- ✅ Users can only send messages as themselves
- ✅ Users can only view their own conversations
- ✅ Users cannot read other people's messages
- ✅ Messages are tied to specific listings
- ✅ Only participants can access a conversation

### Privacy:
- Messages are private between sender and receiver
- Admin cannot see messages (unless they're a participant)
- Messages are deleted if the listing is deleted (cascade)

---

## Next Steps

After setting up:
1. ✅ Run the RLS policies SQL
2. ✅ Enable Realtime for messages table
3. ✅ Test with two accounts
4. ✅ Verify messages appear in real-time
5. ✅ Check that conversations persist after refresh

**Status**: Ready to use after running SQL! 🎉
