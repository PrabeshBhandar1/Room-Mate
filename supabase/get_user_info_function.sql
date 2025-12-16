-- Create get_user_info function if it doesn't exist
-- This allows fetching user info without RLS restrictions
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_user_info(user_id uuid)
RETURNS TABLE (
    id uuid,
    display_name text,
    phone text,
    role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.display_name, u.phone, u.role
    FROM public.users u
    WHERE u.id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_info(uuid) TO authenticated;
