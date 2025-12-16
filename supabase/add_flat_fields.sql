-- ============================================================================
-- Add Flat-Specific Fields to Listings Table
-- ============================================================================
-- These fields are only relevant when listing_type = 'flat'
-- ============================================================================

-- Add number of bedrooms
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS num_bedrooms integer;

-- Add number of kitchens
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS num_kitchens integer;

-- Add number of bathrooms
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS num_bathrooms integer;

-- Add comments for documentation
COMMENT ON COLUMN public.listings.num_bedrooms IS 'Number of bedrooms (only for flats)';
COMMENT ON COLUMN public.listings.num_kitchens IS 'Number of kitchens (only for flats)';
COMMENT ON COLUMN public.listings.num_bathrooms IS 'Number of bathrooms/washrooms (only for flats)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name IN ('num_bedrooms', 'num_kitchens', 'num_bathrooms');

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- Now you can store bedroom, kitchen, and bathroom counts for flat listings
-- ============================================================================
