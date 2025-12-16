# Supabase Setup

1. **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2. **Run Schema Script**: Copy the content of `schema.sql` and run it in the Supabase SQL Editor.
3. **Create Storage Bucket**:
   - Go to "Storage" in Supabase dashboard.
   - Create a new bucket named `listing-photos`.
   - Ensure it is a public bucket (or handle access via policies).
4. **Environment Variables**:
   - Copy `.env.local.example` to `.env.local` (create it if not exists).
   - Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Seed Data
You can insert initial data using the SQL editor.
Example for Admin User:
```sql
-- First sign up a user in the app or via Auth UI
-- Then update their role to admin
update public.users set role = 'admin' where id = 'USER_UUID_HERE';
```
