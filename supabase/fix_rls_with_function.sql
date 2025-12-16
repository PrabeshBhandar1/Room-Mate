-- ============================================================================
-- CRITICAL FIX: RLS Policy Issue for User Profile Creation
-- ============================================================================
-- This script creates a secure function to handle user profile creation
-- that bypasses RLS while maintaining security
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing policies on users table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- ============================================================================
-- STEP 2: Create function to handle user profile creation (SECURITY DEFINER)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid,
  user_role text,
  user_display_name text,
  user_phone text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Verify that the calling user is the same as the user_id
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create profile for another user';
  END IF;

  -- Validate role
  IF user_role NOT IN ('tenant', 'owner', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: must be tenant, owner, or admin';
  END IF;

  -- Insert the user profile
  INSERT INTO public.users (id, role, display_name, phone)
  VALUES (user_id, user_role, user_display_name, user_phone)
  RETURNING json_build_object(
    'id', id,
    'role', role,
    'display_name', display_name,
    'phone', phone,
    'created_at', created_at
  ) INTO result;

  RETURN result;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'User profile already exists';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating user profile: %', SQLERRM;
END;
$$;

-- ============================================================================
-- STEP 3: Recreate RLS policies for users table
-- ============================================================================

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.users
FOR DELETE
USING (auth.uid() = id);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" 
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users" 
ON public.users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- ============================================================================
-- STEP 4: Grant execute permission on the function
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text, text) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- The function is now ready to use from your application
-- Instead of directly inserting into users table, call this function
-- ============================================================================
