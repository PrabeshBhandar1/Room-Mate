-- ============================================================================
-- Complete Database Verification & Setup
-- ============================================================================
-- Run this to verify your database is ready for listing creation
-- ============================================================================

-- 1. Verify all required tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('users', 'listings', 'listing_photos', 'messages', 'areas')
ORDER BY table_name;

-- Expected: 5 tables (users, listings, listing_photos, messages, areas)

-- 2. Add amenities column if not exists
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS amenities text[];

-- 3. Verify listings table has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'listings'
ORDER BY ordinal_position;

-- Expected columns:
-- id, owner_id, title, description, price_per_month, currency, 
-- address_line, area_name, latitude, longitude, is_owner_occupied,
-- water_availability, parking, allowed_for, listing_type, status,
-- rejection_reason, created_at, updated_at, amenities

-- 4. Verify listing_photos table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'listing_photos'
ORDER BY ordinal_position;

-- Expected columns: id, listing_id, storage_path, order_num

-- 5. Check RLS policies on listings table
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'listings';

-- Expected: Multiple policies for owners and admins

-- 6. Verify areas are populated
SELECT COUNT(*) as area_count FROM public.areas;

-- Expected: At least 20 areas

-- 7. Check if create_user_profile function exists
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_user_profile';

-- Expected: 1 function

-- ============================================================================
-- If all queries return expected results, your database is ready!
-- ============================================================================
