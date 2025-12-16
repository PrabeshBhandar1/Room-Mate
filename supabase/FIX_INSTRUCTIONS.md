# 🔧 RLS Policy Fix - IMPORTANT

## Issue
Sign up was failing with error: **"new row violates row-level security policy for table 'users'"**

## Root Cause
The `users` table was missing an INSERT policy that allows new users to create their own profile during signup.

## Solution
Run the following SQL command in your Supabase SQL Editor:

```sql
create policy "Users can insert their own profile" on public.users
  for insert with check (auth.uid() = id);
```

## Steps to Apply Fix

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL command above
4. Click **Run** or press `Ctrl+Enter`
5. You should see: "Success. No rows returned"

## Verification
After applying the fix:
1. Try signing up as a Tenant
2. Try signing up as an Owner
3. Both should work without errors

## Note
The `schema.sql` file has been updated with this fix, so if you recreate the database in the future, this policy will be included automatically.
