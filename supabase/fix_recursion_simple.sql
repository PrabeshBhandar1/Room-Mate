-- ============================================================================
-- SIMPLE FIX: Remove recursion by simplifying policies
-- ============================================================================
-- The issue: ANY reference to users table in a users policy causes recursion
-- Solution: Remove admin policies from users table entirely
-- ============================================================================

-- Drop ALL policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create ONLY simple policies without ANY subqueries
CREATE POLICY "users_select_own" 
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "users_update_own" 
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own" 
ON public.users
FOR DELETE
USING (auth.uid() = id);

-- ============================================================================
-- That's it! No admin policies on users table to avoid recursion
-- Admins can still manage everything else (listings, photos, etc.)
-- ============================================================================
