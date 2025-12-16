# Add Amenities Feature - Setup Guide

## Database Update Required

Before using the new amenities feature, you need to add the `amenities` column to your database.

### Step 1: Run SQL Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this SQL:

```sql
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS amenities text[];
```

3. Click **"Run"**
4. You should see: ✅ "Success. No rows returned"

### Step 2: Verify

Run this to verify the column was added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' AND column_name = 'amenities';
```

You should see:
- `column_name`: amenities
- `data_type`: ARRAY

### What's New

The listing form now includes a **multi-select amenities section** with:

- 📶 WiFi
- 🌳 Garden
- 🔥 Heating
- ❄️ Air Conditioning
- 🔒 Security
- 🍳 Kitchen

Owners can select multiple amenities by clicking the buttons. Selected amenities are highlighted in primary color.

### How It Works

1. Amenities are stored as a PostgreSQL array (`text[]`)
2. Owners can select/deselect by clicking
3. Data is saved when the listing is created
4. Can be used for filtering listings later

That's it! The amenities feature is now ready to use. 🎉
