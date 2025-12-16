# 🔧 Fix: Infinite Recursion Error

## 🔴 The Problem

Error: **"infinite recursion detected in policy for relation 'users'"** (Code: 42P17)

### Root Cause:
The RLS policy for admins was checking the `users` table to see if someone is an admin, which triggered the same policy again, creating infinite recursion:

```sql
-- BAD: This causes recursion
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u  -- ❌ Queries users table again!
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);
```

## ✅ The Solution

Use a **direct subquery with LIMIT** to prevent recursion.

---

## 📋 Apply the Fix

### Step 1: Run SQL Fix

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy **ALL** contents from `fix_infinite_recursion.sql`
3. Paste and click **"Run"**
4. Should see: ✅ "Success"

### Step 2: Verify Policies

Run this to check policies:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';
```

You should see:
- `Users can view their own profile`
- `Users can update their own profile`
- `Users can delete their own profile`
- `Admins can view all users`

### Step 3: Test

1. **Clear browser cache** (important!)
2. **Refresh the page** (Ctrl+Shift+R)
3. Try logging in as Owner
4. ✅ Should load dashboard without errors

---

## 🔍 What Changed

### Before (Recursive):
```sql
-- This caused infinite loop
EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() AND u.role = 'admin'
)
```

### After (Non-Recursive):
```sql
-- This works without recursion
auth.uid() = id 
OR 
(SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
```

The `LIMIT 1` and direct subquery prevent the recursion.

---

## 🎯 Expected Results

After applying the fix:

✅ **Login works** (no infinite recursion)
✅ **Profile loads** (can fetch user data)
✅ **Dashboard accessible** (Owner/Admin)
✅ **No 500 errors**

---

## ❓ Troubleshooting

### If you still see the error:
1. **Clear browser cache completely**
2. **Restart dev server**: Stop (Ctrl+C) and run `npm run dev` again
3. **Check SQL was applied**: Run verification query from Step 2
4. **Try incognito mode** to rule out caching

### If you see "permission denied":
- The policies are working!
- Make sure you're logged in
- Check that your user has the correct role in the database

---

## 📝 Technical Notes

**Why did this happen?**
- RLS policies can reference other tables
- But referencing the SAME table creates recursion
- PostgreSQL detects this and throws error 42P17

**How does the fix work?**
- The subquery with `LIMIT 1` is evaluated once
- It doesn't trigger the policy again
- This breaks the recursive loop

---

## ✅ This Fix is Final

This is a well-known PostgreSQL RLS pattern. After applying this, the infinite recursion will be permanently resolved.
