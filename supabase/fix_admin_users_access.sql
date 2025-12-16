-- Solution: Temporarily disable RLS for admin queries by using a SECURITY DEFINER function
-- This allows admins to fetch user data without RLS blocking them

-- Create a function that admins can call to get user info (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_info(user_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  phone TEXT,
  role TEXT
) 
SECURITY DEFINER -- This makes the function run with the privileges of the owner (bypasses RLS)
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

-- Test the function (replace with actual user ID)
-- SELECT * FROM public.get_user_info('some-uuid-here');
