-- Admin User Setup Script
-- Run this in Supabase SQL Editor to create an admin user

-- Step 1: First, create a user through Supabase Auth UI or API
-- Email: admin@roommate.com
-- Password: (your secure password)

-- Step 2: After creating the auth user, update their profile to admin role
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users table

-- Find the user ID first:
SELECT id, email FROM auth.users WHERE email = 'admin@roommate.com';

-- Update the profile to admin role (replace the UUID with actual user ID)
UPDATE profiles 
SET 
    role = 'admin',
    display_name = 'Admin User'
WHERE id = 'USER_ID_HERE';

-- Verify the admin user
SELECT 
    p.id,
    p.email,
    p.role,
    p.display_name,
    p.created_at
FROM profiles p
WHERE p.role = 'admin';

-- Alternative: If you want to update an existing owner to admin
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
