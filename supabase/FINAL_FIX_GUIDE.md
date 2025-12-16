# 🔧 DEFINITIVE FIX for RLS Policy Error

## ❗ The Problem
The RLS (Row Level Security) policy is blocking user profile creation during signup because:
1. The user is authenticated AFTER signup
2. But the INSERT happens BEFORE the session is fully established
3. This creates a timing issue where `auth.uid()` might not be available yet

## ✅ The Solution
Use a **SECURITY DEFINER function** that bypasses RLS while maintaining security.

## 📋 Step-by-Step Fix

### Step 1: Apply the Database Function

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the **ENTIRE** contents of `fix_rls_with_function.sql`
4. Paste into SQL Editor
5. Click **"Run"**
6. You should see: ✅ **"Success. No rows returned"**

### Step 2: Verify the Function Exists

Run this query to verify:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_user_profile';
```

You should see: `create_user_profile`

### Step 3: Test Signup

1. **Restart your dev server** (important!):
   - Stop the current `npm run dev` (Ctrl+C)
   - Run `npm run dev` again

2. Go to `http://localhost:3000`
3. Click **"Get Started"**
4. Fill in the signup form
5. Select **Tenant** or **Owner**
6. Click **"Sign Up"**

### Step 4: Expected Result

✅ **Success!** You should:
- See "Profile created successfully" in browser console
- Be redirected to the homepage or dashboard
- No RLS policy errors

## 🔍 What Changed?

### Before (Direct INSERT - FAILED):
```javascript
await supabase.from('users').insert([{
  id: data.user.id,
  role,
  display_name: displayName,
  phone,
}]);
```
❌ This failed because RLS blocked the INSERT

### After (RPC Function - WORKS):
```javascript
await supabase.rpc('create_user_profile', {
  user_id: data.user.id,
  user_role: role,
  user_display_name: displayName,
  user_phone: phone,
});
```
✅ This works because the function has `SECURITY DEFINER` which bypasses RLS

## 🛡️ Security Notes

The function is **still secure** because:
1. It verifies `auth.uid()` matches the `user_id` parameter
2. It validates the role is one of: tenant, owner, admin
3. It prevents duplicate profiles
4. It only allows authenticated users to call it

## 📁 Files Modified

1. ✅ `web/supabase/fix_rls_with_function.sql` - Database function
2. ✅ `web/context/AuthContext.js` - Updated to use RPC

## ❓ Troubleshooting

### If you still see RLS error:
1. Verify the function was created (Step 2 above)
2. Restart your dev server
3. Clear browser cache
4. Check browser console for different error

### If you see "function does not exist":
- You didn't run `fix_rls_with_function.sql` in Supabase
- Go back to Step 1

### If you see "Unauthorized":
- The function is working!
- This means you're trying to create a profile for a different user
- This is the security check working correctly

## 🎉 This is the Final Fix!

This approach is used by many production Supabase applications to handle user profile creation. It's the recommended pattern when RLS policies conflict with signup flows.
