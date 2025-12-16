# IMPORTANT: Run This SQL First!

## Problem
The admin pages need to fetch owner information, but RLS policies prevent joining the `users` table.

## Solution
Create a SECURITY DEFINER function that bypasses RLS to fetch user info.

## SQL to Run in Supabase

**Go to Supabase Dashboard → SQL Editor → New Query**

Copy and paste this SQL:

```sql
-- Create a function that admins can call to get user info (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_info(user_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  phone TEXT,
  role TEXT
) 
SECURITY DEFINER -- This makes the function run with owner privileges (bypasses RLS)
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.display_name, u.phone, u.role
  FROM public.users u
  WHERE u.id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_info(UUID) TO authenticated;
```

Click **Run** to execute.

## What This Does
- Creates a function `get_user_info(user_id)` that returns user details
- Uses `SECURITY DEFINER` to bypass RLS restrictions
- Allows admins to fetch owner information when reviewing listings
- Safe because it only returns specific fields (not sensitive data like passwords)

## After Running
1. Refresh your admin dashboard
2. Owner names and phone numbers should now display correctly
3. All property details will be visible on the listing detail page

## Files Updated
- ✅ `web/app/admin/dashboard/page.js` - Now fetches owner data separately
- ✅ `web/app/admin/listing/[id]/page.js` - Added missing fields and owner data
- ✅ `web/next.config.mjs` - Added Supabase image domain

## Test It
1. Navigate to `/admin/dashboard`
2. Check that owner names appear in pending listings
3. Click "View Details" on a listing
4. Verify all fields display:
   - ✅ Owner name and phone
   - ✅ Address
   - ✅ Water availability
   - ✅ Parking
   - ✅ Allowed for
   - ✅ Owner occupied
   - ✅ All other property details
