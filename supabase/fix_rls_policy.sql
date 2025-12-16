-- Fix for RLS Policy Issue: Allow users to insert their own profile during signup

-- Add INSERT policy for users table
create policy "Users can insert their own profile" on public.users
  for insert with check (auth.uid() = id);
