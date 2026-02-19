-- SECURITY DEFINER function to fetch admin dashboard stats
-- This bypasses RLS to get accurate counts of users by role
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
SECURITY DEFINER -- Essential to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_listings', (SELECT count(*) FROM public.listings),
        'pending_listings', (SELECT count(*) FROM public.listings WHERE status = 'pending'),
        'total_tenants', (SELECT count(*) FROM public.users WHERE role = 'tenant'),
        'total_owners', (SELECT count(*) FROM public.users WHERE role = 'owner')
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant access to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
