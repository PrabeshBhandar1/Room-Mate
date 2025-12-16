# 📦 Supabase Storage Bucket Setup Guide

## Complete Setup for Listing Photos Storage

Follow these steps to set up the storage bucket for property listing images.

---

## 📋 Step 1: Create Storage Bucket

1. Open your **Supabase Dashboard**
2. Go to **Storage** (in the left sidebar)
3. Click **"New bucket"** button
4. Configure the bucket:
   - **Name**: `listing-photos`
   - **Public bucket**: ✅ **Check this box** (images need to be publicly accessible)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/webp`
5. Click **"Create bucket"**

---

## 🔒 Step 2: Set Up Storage Policies (RLS)

After creating the bucket, you need to add policies for who can upload/view photos.

### Go to Storage Policies:
1. In **Storage**, click on the `listing-photos` bucket
2. Click **"Policies"** tab
3. Click **"New policy"**

### Policy 1: Public Read Access (Anyone can view photos)

Click **"For full customization"** and create this policy:

**Policy Name**: `Public can view listing photos`

**Allowed operation**: `SELECT`

**Target roles**: `public`

**Policy definition**:
```sql
true
```

Click **"Review"** → **"Save policy"**

---

### Policy 2: Owners Can Upload Photos

Click **"New policy"** again:

**Policy Name**: `Owners can upload photos`

**Allowed operation**: `INSERT`

**Target roles**: `authenticated`

**Policy definition**:
```sql
true
```

Click **"Review"** → **"Save policy"**

---

### Policy 3: Owners Can Delete Their Photos

Click **"New policy"** again:

**Policy Name**: `Owners can delete their photos`

**Allowed operation**: `DELETE`

**Target roles**: `authenticated`

**Policy definition**:
```sql
(bucket_id = 'listing-photos'::text)
```

Click **"Review"** → **"Save policy"**

---

## ✅ Step 3: Verify Bucket Setup

Run this test to verify the bucket is working:

1. Go to **Storage** → `listing-photos` bucket
2. Try uploading a test image manually
3. If successful, you should see the image
4. Try accessing the image URL (should be publicly accessible)

---

## 🗄️ Step 4: Database Setup

Make sure your database has all required tables and columns.

### Run This Complete SQL:

Go to **SQL Editor** and run:

```sql
-- 1. Add amenities column (if not exists)
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS amenities text[];

-- 2. Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'listings', 'listing_photos', 'messages', 'areas');

-- 3. Verify listing_photos table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listing_photos';
```

**Expected Results:**
- Should show 5 tables: users, listings, listing_photos, messages, areas
- listing_photos should have: id, listing_id, storage_path, order_num

---

## 🧪 Step 5: Test the Complete Flow

1. **Log in as an Owner**
2. Go to **"Create New Listing"**
3. Fill in all required fields
4. **Upload 1-8 photos**
5. Click **"Create Listing"**
6. Check if:
   - ✅ Listing is created
   - ✅ Photos are uploaded to `listing-photos` bucket
   - ✅ Photo records are created in `listing_photos` table
   - ✅ You're redirected to dashboard with success message

---

## 📁 Bucket Structure

After uploading, your bucket will have this structure:

```
listing-photos/
├── <listing-id-1>/
│   ├── 1733123456789_0.jpg
│   ├── 1733123456789_1.jpg
│   └── 1733123456789_2.jpg
├── <listing-id-2>/
│   ├── 1733123456790_0.jpg
│   └── 1733123456790_1.jpg
```

Each listing gets its own folder (using listing ID).

---

## 🔍 Troubleshooting

### Error: "new row violates row-level security policy"
- Make sure you ran the storage policies (Step 2)
- Verify the bucket is set to **Public**

### Error: "Failed to upload"
- Check file size (should be < 5MB)
- Verify file is an image (jpg, png, webp)
- Check browser console for detailed error

### Photos not showing
- Verify bucket is **Public**
- Check the storage path in `listing_photos` table
- Try accessing the image URL directly

---

## ✅ Checklist

Before creating a listing, verify:

- [ ] `listing-photos` bucket created
- [ ] Bucket is set to **Public**
- [ ] Storage policies added (3 policies)
- [ ] `amenities` column added to listings table
- [ ] All tables exist (users, listings, listing_photos, messages, areas)
- [ ] Test upload works manually in Supabase Storage

---

## 🎉 You're Ready!

Once all checkboxes are complete, your storage is fully configured and ready to accept listing photos!

**Next**: Try creating a test listing with photos to verify everything works end-to-end.
