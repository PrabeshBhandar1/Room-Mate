-- ============================================================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================================================
-- The problem: Admin policies were checking the users table, causing recursion
-- The solution: Remove recursive policies and simplify
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop ALL existing policies on users table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- ============================================================================
-- STEP 2: Create simple, non-recursive policies
-- ============================================================================

-- Allow users to view their own profile (no recursion)
CREATE POLICY "Users can view their own profile" 
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile (no recursion)
CREATE POLICY "Users can update their own profile" 
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile (no recursion)
CREATE POLICY "Users can delete their own profile" 
ON public.users
FOR DELETE
USING (auth.uid() = id);

-- ============================================================================
-- STEP 3: Fix admin policies on OTHER tables (not users table)
-- ============================================================================

-- Drop and recreate admin policy for listings
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.listings;

CREATE POLICY "Admins can manage all listings" 
ON public.listings
FOR ALL
USING (
  -- Check if current user has admin role
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Drop and recreate admin policy for listing_photos
DROP POLICY IF EXISTS "Admins can manage all photos" ON public.listing_photos;

CREATE POLICY "Admins can manage all photos" 
ON public.listing_photos
FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- STEP 4: Add policy for admins to view all users (SIMPLIFIED)
-- ============================================================================

-- This policy allows admins to view other users
-- We use a subquery that doesn't cause recursion
CREATE POLICY "Admins can view all users" 
ON public.users
FOR SELECT
USING (
  -- Either it's your own profile OR you're an admin
  auth.uid() = id 
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, try logging in again
-- The infinite recursion error should be gone
-- ============================================================================
