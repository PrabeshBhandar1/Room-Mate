-- Add amenities column to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS amenities text[];

-- Add comment for documentation
COMMENT ON COLUMN public.listings.amenities IS 'Array of amenities: wifi, garden, heating, air_conditioning, security, kitchen';
