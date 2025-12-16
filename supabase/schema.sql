-- Database Schema for RoomMate

-- users table (additional profile fields stored here)
create table public.users (
  id uuid primary key references auth.users(id),
  display_name text,
  role text not null check (role in ('tenant','owner','admin')),
  phone text,
  created_at timestamptz default now()
);

-- listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id),
  title text not null,
  description text,
  price_per_month numeric not null,
  currency text default 'NPR',
  address_line text,
  area_name text,
  latitude double precision,
  longitude double precision,
  is_owner_occupied boolean default false,
  water_availability text check (water_availability in ('continuous','timed','no')),
  parking text check (parking in ('none','bike_only','car_only','bike_and_car')),
  allowed_for text, -- e.g. 'couples,students' (or use jsonb)
  listing_type text check (listing_type in ('room','flat')),
  status text default 'pending' check (status in ('pending','approved','rejected','archived')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- images (one row per photo)
create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  storage_path text not null, -- e.g., 'listings/<listing_id>/photo1.jpg'
  order_num int default 0
);

-- messages (simple chat)
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  sender_id uuid references public.users(id),
  receiver_id uuid references public.users(id),
  content text not null,
  created_at timestamptz default now(),
  is_read boolean default false
);

-- Indexes
create index on public.listings (status, area_name);
create index on public.listings (price_per_month);

-- RLS Policies

-- Enable RLS
alter table public.listings enable row level security;
alter table public.messages enable row level security;
alter table public.users enable row level security;
alter table public.listing_photos enable row level security;

-- Users policies
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.users
  for insert with check (auth.uid() = id);

-- Listings policies

-- Owners can insert listings where owner_id = auth.uid()
create policy "owners_insert_own_listings" on public.listings
  for insert with check (auth.uid() = owner_id);

-- Owners can update/delete only their listings (but cannot change status to approved)
create policy "owners_manage_own" on public.listings
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid() and status <> 'approved');

create policy "owners_delete_own" on public.listings
  for delete using (owner_id = auth.uid());

-- Admin can manage all listings
create policy "admin_manage_all" on public.listings
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Public select only approved listings
create policy "public_select_approved" on public.listings
  for select using (status = 'approved');

-- Messages policies
-- Only participants can insert/select
create policy "messages_participants_insert" on public.messages
  for insert with check (sender_id = auth.uid() and (receiver_id is not null));

create policy "messages_select_participants" on public.messages
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());

-- Listing Photos policies
-- Public can view photos of approved listings
create policy "public_view_photos_approved" on public.listing_photos
  for select using (exists (select 1 from public.listings l where l.id = listing_id and l.status = 'approved'));

-- Owners can manage photos of their listings
create policy "owners_manage_photos" on public.listing_photos
  for all using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));
