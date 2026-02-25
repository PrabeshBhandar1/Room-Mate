-- ============================================================================
-- RoomMate - Complete Database Schema with RLS Policies, Functions & Triggers
-- ============================================================================
-- Run this ENTIRE file in your Supabase SQL Editor to set up the database
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING POLICIES (Clean slate)
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

DROP POLICY IF EXISTS "owners_insert_own_listings" ON public.listings;
DROP POLICY IF EXISTS "owners_manage_own" ON public.listings;
DROP POLICY IF EXISTS "owners_delete_own" ON public.listings;
DROP POLICY IF EXISTS "admin_manage_all" ON public.listings;
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.listings;
DROP POLICY IF EXISTS "public_select_approved" ON public.listings;
DROP POLICY IF EXISTS "Public can view approved listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can view their own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can insert their own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can delete their own listings" ON public.listings;

DROP POLICY IF EXISTS "messages_participants_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;

DROP POLICY IF EXISTS "public_view_photos_approved" ON public.listing_photos;
DROP POLICY IF EXISTS "owners_manage_photos" ON public.listing_photos;
DROP POLICY IF EXISTS "Public can view photos of approved listings" ON public.listing_photos;
DROP POLICY IF EXISTS "Owners can view their own listing photos" ON public.listing_photos;
DROP POLICY IF EXISTS "Owners can insert photos for their listings" ON public.listing_photos;
DROP POLICY IF EXISTS "Owners can delete their listing photos" ON public.listing_photos;
DROP POLICY IF EXISTS "Admins can manage all photos" ON public.listing_photos;

-- ============================================================================
-- STEP 2: CREATE TABLES (Consolidated)
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  role text NOT NULL CHECK (role IN ('tenant','owner','admin')),
  phone text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Owner Verification Requests table
CREATE TABLE IF NOT EXISTS public.owner_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('citizenship', 'passport', 'license')),
  document_url text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE (owner_id)
);

-- Listings table (with amenities and flat specific fields)
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price_per_month numeric NOT NULL,
  currency text DEFAULT 'NPR',
  address_line text,
  area_name text,
  latitude double precision,
  longitude double precision,
  is_owner_occupied boolean DEFAULT false,
  water_availability text CHECK (water_availability IN ('continuous','timed','no')),
  parking text CHECK (parking IN ('none','bike_only','car_only','bike_and_car')),
  allowed_for text,
  listing_type text CHECK (listing_type IN ('room','flat')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','archived')),
  rejection_reason text,
  
  -- Amenities (New)
  amenities text[], -- Array: wifi, garden, heating, air_conditioning, security, kitchen
  
  -- Flat specific fields (New)
  num_bedrooms integer,
  num_kitchens integer,
  num_bathrooms integer,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.listings.amenities IS 'Array of amenities: wifi, garden, heating, air_conditioning, security, kitchen';
COMMENT ON COLUMN public.listings.num_bedrooms IS 'Number of bedrooms (only for flats)';
COMMENT ON COLUMN public.listings.num_kitchens IS 'Number of kitchens (only for flats)';
COMMENT ON COLUMN public.listings.num_bathrooms IS 'Number of bathrooms (only for flats)';


-- Listing photos table
CREATE TABLE IF NOT EXISTS public.listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  order_num int DEFAULT 0
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Areas table (for dropdown)
CREATE TABLE IF NOT EXISTS public.areas (
  id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name text UNIQUE NOT NULL
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_listings_status_area ON public.listings (status, area_name);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings (price_per_month);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON public.listings (owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_amenities ON public.listings USING GIN (amenities); -- Improve access for array
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages (receiver_id);

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES (Non-Recursive)
-- ============================================================================

-- ----------------------------
-- USERS TABLE POLICIES
-- ----------------------------

-- Allow users to view their own profile (Non-recursive)
CREATE POLICY "Users can view their own profile" 
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

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

-- Allow admins to view all users (Simplified to avoid recursion)
-- Requires that admin user's own profile is accessible via "view own profile"
CREATE POLICY "Admins can view all users" 
ON public.users
FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to update any user profile (needed to set is_verified)
CREATE POLICY "admin_update_users"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ----------------------------
-- LISTINGS TABLE POLICIES
-- ----------------------------

-- Public can view approved listings
CREATE POLICY "Public can view approved listings" 
ON public.listings
FOR SELECT
USING (status = 'approved');

-- Owners can view their own listings (any status)
CREATE POLICY "Owners can view their own listings" 
ON public.listings
FOR SELECT
USING (owner_id = auth.uid());

-- Owners can insert their own listings
CREATE POLICY "Owners can insert their own listings" 
ON public.listings
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Owners can update their own listings (but not change status to approved)
CREATE POLICY "Owners can update their own listings" 
ON public.listings
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid() AND status != 'approved');

-- Owners can delete their own listings
CREATE POLICY "Owners can delete their own listings" 
ON public.listings
FOR DELETE
USING (owner_id = auth.uid());

-- Admins can manage all listings (Non-recursive check)
CREATE POLICY "Admins can manage all listings" 
ON public.listings
FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- ----------------------------
-- LISTING PHOTOS TABLE POLICIES
-- ----------------------------

-- Public can view photos of approved listings
CREATE POLICY "Public can view photos of approved listings" 
ON public.listing_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings l 
    WHERE l.id = listing_id AND l.status = 'approved'
  )
);

-- Owners can view photos of their own listings
CREATE POLICY "Owners can view their own listing photos" 
ON public.listing_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings l 
    WHERE l.id = listing_id AND l.owner_id = auth.uid()
  )
);

-- Owners can insert photos for their own listings
CREATE POLICY "Owners can insert photos for their listings" 
ON public.listing_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listings l 
    WHERE l.id = listing_id AND l.owner_id = auth.uid()
  )
);

-- Owners can delete photos from their own listings
CREATE POLICY "Owners can delete their listing photos" 
ON public.listing_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.listings l 
    WHERE l.id = listing_id AND l.owner_id = auth.uid()
  )
);

-- Admins can manage all photos
CREATE POLICY "Admins can manage all photos" 
ON public.listing_photos
FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- ----------------------------
-- MESSAGES TABLE POLICIES
-- ----------------------------

-- Users can view messages where they are sender or receiver
CREATE POLICY "Users can view their own messages" 
ON public.messages
FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Users can send messages (as sender)
CREATE POLICY "Users can send messages" 
ON public.messages
FOR INSERT
WITH CHECK (sender_id = auth.uid() AND receiver_id IS NOT NULL);

-- Users can update their own messages (for read status)
CREATE POLICY "Users can update their received messages" 
ON public.messages
FOR UPDATE
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

-- ----------------------------
-- AREAS TABLE POLICIES
-- ----------------------------

-- Everyone can view areas
CREATE POLICY "Everyone can view areas" 
ON public.areas
FOR SELECT
USING (true);

-- ============================================================================
-- STEP 6: CREATE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on listings
DROP TRIGGER IF EXISTS set_updated_at ON public.listings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, display_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user profile creation (Optional helper for secure creation)
-- Can be called via RPC if needed, but direct Insert is also allowed by policy
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid,
  user_role text,
  user_display_name text,
  user_phone text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create profile for another user';
  END IF;
  
  IF user_role NOT IN ('tenant', 'owner', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: must be tenant, owner, or admin';
  END IF;

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
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text, text) TO authenticated;

-- Helper function for Admin dashboard (Bypass RLS for specific lookups if needed)
CREATE OR REPLACE FUNCTION public.get_user_info(user_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  phone TEXT,
  role TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Should add a check here if only admins should call this
  -- IF (SELECT role FROM public.users WHERE id = auth.uid()) != 'admin' THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  
  RETURN QUERY
  SELECT u.id, u.display_name, u.phone, u.role
  FROM public.users u
  WHERE u.id = user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_info(UUID) TO authenticated;


-- Admin Stats Helper Function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
SECURITY DEFINER -- Essential to bypass RLS for aggregate counts
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
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated; 

-- ============================================================================
-- STEP 7: SEED INITIAL DATA
-- ============================================================================

-- Insert area names (for dropdown)
INSERT INTO public.areas (name) VALUES
  ('Baneshwor'),
  ('Koteshwor'),
  ('Maitidevi'),
  ('Putalisadak'),
  ('Lalitpur'),
  ('Bhaktapur'),
  ('Thamel'),
  ('Lazimpat'),
  ('Boudha'),
  ('Kalanki'),
  ('Balaju'),
  ('Chabahil'),
  ('Jorpati'),
  ('Maharajgunj'),
  ('New Baneshwor'),
  ('Patan'),
  ('Pulchowk'),
  ('Sanepa'),
  ('Satdobato'),
  ('Swayambhu')
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- OPTIONAL: ADMIN USER CREATION INSTRUCTIONS
-- ============================================================================
/*
To create an ADMIN user:
1. Sign up a new user via your app (e.g., admin@roommate.com)
2. Run this SQL command (replace USER_ID_HERE with the user's UUID from auth.users):

   UPDATE public.users 
   SET role = 'admin' 
   WHERE id = 'USER_ID_HERE';

*/

-- ============================================================================
-- OWNER VERIFICATIONS: RLS POLICIES
-- ============================================================================

ALTER TABLE public.owner_verifications ENABLE ROW LEVEL SECURITY;

-- Owners can insert their own verification request (only if none exists)
CREATE POLICY "owner_verifications_insert_own" ON public.owner_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can view their own verification request
CREATE POLICY "owner_verifications_select_own" ON public.owner_verifications
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Admins can view all verification requests
CREATE POLICY "owner_verifications_select_admin" ON public.owner_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update (approve/reject) verification requests
CREATE POLICY "owner_verifications_update_admin" ON public.owner_verifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- OWNER VERIFICATIONS: ADMIN RPC FUNCTIONS
-- ============================================================================

-- Approve an owner verification request
-- Sets is_verified = true on the user and marks the request as approved
CREATE OR REPLACE FUNCTION approve_owner_verification(verification_id uuid)
RETURNS void AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Check caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.owner_verifications
  WHERE id = verification_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  -- Update verification record
  UPDATE public.owner_verifications
  SET status = 'approved', reviewed_at = now(), rejection_reason = NULL
  WHERE id = verification_id;

  -- Set owner as verified
  UPDATE public.users
  SET is_verified = true
  WHERE id = v_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject an owner verification request
CREATE OR REPLACE FUNCTION reject_owner_verification(verification_id uuid, reason text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Check caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  UPDATE public.owner_verifications
  SET status = 'rejected', reviewed_at = now(), rejection_reason = reason
  WHERE id = verification_id;

  -- Ensure is_verified is false on user
  UPDATE public.users
  SET is_verified = false
  WHERE id = (SELECT owner_id FROM public.owner_verifications WHERE id = verification_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin helper: get all pending owner verification requests with owner info
CREATE OR REPLACE FUNCTION get_pending_owner_verifications()
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  owner_name text,
  owner_email text,
  full_name text,
  document_type text,
  document_url text,
  note text,
  status text,
  rejection_reason text,
  submitted_at timestamptz
) AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    ov.id,
    ov.owner_id,
    u.display_name AS owner_name,
    au.email AS owner_email,
    ov.full_name,
    ov.document_type,
    ov.document_url,
    ov.note,
    ov.status,
    ov.rejection_reason,
    ov.submitted_at
  FROM public.owner_verifications ov
  JOIN public.users u ON u.id = ov.owner_id
  JOIN auth.users au ON au.id = ov.owner_id
  ORDER BY ov.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

