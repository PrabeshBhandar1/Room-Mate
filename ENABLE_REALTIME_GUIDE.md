# How to Enable Realtime in Supabase (Updated Interface)

## Method 1: Database Settings (Recommended)

1. **Go to Supabase Dashboard**
   - Open your project at https://supabase.com/dashboard

2. **Navigate to Database**
   - Click on "Database" in the left sidebar
   - Click on "Tables" submenu

3. **Find the messages table**
   - Scroll down to find the `messages` table in the list

4. **Enable Realtime**
   - Click on the `messages` table name
   - Look for "Realtime" section in the table details
   - Toggle the switch to **ON**
   - OR click the three dots menu (⋮) next to the table name
   - Select "Enable Realtime"

## Method 2: Using SQL Editor

If you can't find the toggle, you can enable it via SQL:

1. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Run this SQL**:
```sql
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

3. **Click "Run"**

## Method 3: API Settings

1. **Go to Project Settings**
   - Click the gear icon (⚙️) at the bottom left
   - Select "API" from the menu

2. **Scroll to Realtime**
   - Look for "Realtime" section
   - Check if `messages` table is listed
   - If not, you may need to use Method 2 (SQL)

## Verify Realtime is Enabled

### Check in Dashboard:
1. Go to Database → Tables
2. Click on `messages` table
3. Look for a "Realtime" badge or indicator showing it's enabled

### Check in Code:
Open browser console and look for:
```
Realtime subscription established
```

### Test It:
1. Open two browser windows
2. Log in as different users in each
3. Send a message from one
4. Message should appear instantly in the other window

## Troubleshooting

### "Realtime not available"
- Make sure you're on a Supabase plan that supports Realtime (Free tier includes it)
- Check if the table exists in your database
- Verify RLS policies allow reading messages

### Messages not appearing in real-time
- Check browser console for errors
- Verify the subscription is active
- Make sure both users are in the same conversation
- Try refreshing the page

### SQL Method Not Working
Make sure the publication exists:
```sql
-- Check if publication exists
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- If it doesn't exist, create it
CREATE PUBLICATION supabase_realtime;

-- Then add the table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

## Alternative: Polling (If Realtime Doesn't Work)

If you can't get Realtime working, you can use polling instead:

In `web/app/messages/page.js`, add this to the conversation effect:

```javascript
useEffect(() => {
    if (selectedConversation) {
        loadMessages(selectedConversation);
        
        // Poll for new messages every 3 seconds
        const interval = setInterval(() => {
            loadMessages(selectedConversation);
        }, 3000);
        
        return () => clearInterval(interval);
    }
}, [selectedConversation]);
```

This will refresh messages every 3 seconds instead of using realtime updates.

---

## Summary

**Easiest Method**: Use SQL Editor and run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

Then verify by testing with two browser windows!
