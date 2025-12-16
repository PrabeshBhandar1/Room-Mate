# 🚀 Complete Supabase Setup Guide

## ⚠️ IMPORTANT: Fresh Start Required

To ensure no conflicts, we need to **reset your database** and apply the complete schema.

## 📋 Step-by-Step Instructions

### 1. **Reset Your Database (IMPORTANT)**

In your Supabase Dashboard:
1. Go to **Database** → **Tables**
2. Delete these tables if they exist (in this order):
   - `messages`
   - `listing_photos`
   - `listings`
   - `users`
   - `areas`

**OR** use SQL to drop them:
```sql
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.listing_photos CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.areas CASCADE;
```

### 2. **Apply Complete Schema**

1. Open **SQL Editor** in Supabase Dashboard
2. Copy the **ENTIRE** contents of `schema_all.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. Wait for completion (should take 5-10 seconds)
6. You should see: ✅ **"Success"**

### 3. **Verify Setup**

Run these verification queries in SQL Editor:

```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check policies (should see many)
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check areas (should see 20 areas)
SELECT * FROM public.areas;
```

### 4. **Test Authentication**

1. Go to your app: `http://localhost:3000`
2. Click **"Get Started"**
3. Fill in the signup form
4. Select **Tenant** or **Owner**
5. Click **"Sign Up"**
6. ✅ Should work without errors!

## 🔍 What's Included in schema_all.sql

### ✅ Tables
- `users` - User profiles with roles
- `listings` - Property listings
- `listing_photos` - Photos for listings
- `messages` - Chat messages
- `areas` - Area names for dropdown (20 pre-populated)

### ✅ RLS Policies (Complete)
- **Users**: Insert, Select, Update (own profile)
- **Listings**: Full CRUD for owners, view for public
- **Photos**: Manage for owners, view for public
- **Messages**: Send/receive for participants
- **Areas**: Public read access

### ✅ Functions & Triggers
- Auto-update `updated_at` timestamp on listings

### ✅ Indexes
- Optimized queries for listings, messages

### ✅ Seed Data
- 20 area names pre-populated

## 🎯 Expected Results

After applying `schema_all.sql`:

✅ **Signup works** (Tenant & Owner)
✅ **Login works** (redirects based on role)
✅ **Dashboards accessible** (Owner & Admin)
✅ **No RLS policy errors**
✅ **No missing table errors**

## ❓ Troubleshooting

### If signup still fails:
1. Check browser console for exact error
2. Verify `.env.local` has correct Supabase credentials
3. Ensure you ran the ENTIRE `schema_all.sql` file
4. Try clearing browser cache and cookies

### If you see "table already exists":
- That's OK! The schema uses `CREATE TABLE IF NOT EXISTS`
- The important part is the policies get recreated

## 📞 Need Help?

If you still see errors after following these steps, share:
1. The exact error message from browser console
2. Screenshot of the error
3. Confirmation that you ran the complete `schema_all.sql`
