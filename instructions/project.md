RoomMate — Enhanced SRS & Implementation Blueprint
1. Summary

Project: RoomMate — Online room & flat rental platform (Nepal)
Stack: Next.js (frontend) + Supabase (Auth, Postgres, Storage, Realtime)
Users: Tenant (searcher), Owner (lists rooms/flats), Admin (manual approval)
Core constraints from you: photos only, single-occupancy listings (rooms or whole flats), text-only chat (simple), manual admin approval, fixed tech stack, no monetization, no AI features, no mobile app for now.

2. High-level features (MVP)

Sign up / Login (multi-role sign up: Tenant or Owner)

Owner Dashboard: Create / Edit / Delete listing + upload photos → sends to admin for manual approval

Listing public page (only approved listings visible)

Tenant Search page: filters including area boundary & price sorting

Bookmarking: not required (you said no) — omitted

Messaging: simple text chat (realtime via Supabase Realtime or Postgres LISTEN/NOTIFY) between tenant and owner (only after owner contact info or in-app message)

Admin Dashboard: view pending listings → approve/reject → manage users & listings (basic)

Basic analytics for admin (counts: total listings, pending, approved) — small dashboard widget

3. Functional requirements (detailed)
3.1 Authentication / Authorization

Sign up: email + password, choose role (tenant or owner).

Supabase Auth used. Email verification optional (recommended: enable for owners).

Roles stored in users table and Supabase auth metadata.

Role-based access control (RLS + policies).

3.2 Listings

Owners can create listings with fields below. When created, status = pending.

Admin must manually change to approved for public visibility.

Listing fields (required):

id (uuid)

owner_id (references users)

title (string)

description (text)

price_per_month (numeric)

currency (default NPR)

address_line (text)

area_name (string) — e.g., Baneshwor

latitude, longitude (optional, for future map)

area_boundary_id (optional) — for boundary filter (see DB)

is_owner_occupied (boolean)

water_availability (enum: continuous, timed, no)

parking (enum: none, bike_only, car_only, bike_and_car)

allowed_for (enum/set): couples, students, girls_only, boys_only, any

listing_type: room or flat

photos (stored in Storage with references in listing_photos table)

created_at, updated_at

status: pending, approved, rejected, archived

rejection_reason (text, optional)

3.3 Search & Filtering

Search by area_name (text), area boundary match (see 3.3.1), price range, listing_type.

Sorting: price ascending/descending.

Pagination.

3.3.1 Area boundary

For MVP: allow selected area_name options (pre-seeded neighborhoods). Owners select the area dropdown.

Later: polygon-based boundary search using lat/lon; for now we’ll store area_id and query equality.

3.4 Messaging

Simple text-only realtime chat using Supabase Realtime (or a messages table with RLS and realtime subscriptions).

Only tenant ↔ owner messages allowed when either party initiates (no group chat).

Messages: id, thread_id, sender_id, receiver_id, content, created_at, is_read.

3.5 Admin Dashboard

List pending listings, inspect photos & details, approve/reject with optional rejection reason.

Manage users (suspend/reactivate).

View simple stats.

4. Non-functional requirements

Performance: Listing load < 1s for single listing; search response < 2s for page-size 20.

Security:

RLS for row-level enforcement.

Supabase Auth with secure password rules (min 8 chars recommended).

Input validation & server-side checks.

File upload validation (restrict types to images, max size e.g., 5 MB each).

Scalability: Design DB indexes on (status, area_name, price_per_month).

Availability: Aim for 99% SLA from hosting (Vercel + Supabase).

Usability: Responsive UI for desktop and mobile browsers.

Privacy: Do not expose owner email/phone publicly until they opt-in (or show contact via in-app request).

5. Database design (Postgres SQL for Supabase)

Below are the main table DDLs (simplified):

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


Indexes:

create index on public.listings (status, area_name);
create index on public.listings (price_per_month);

6. Row-Level Security (RLS) — example policies

Enable RLS on listings and messages and write policies:

-- enable RLS
alter table public.listings enable row level security;
alter table public.messages enable row level security;

-- Owners can insert listings where owner_id = auth.uid()
create policy "owners_insert_own_listings" on public.listings
  for insert using (auth.role() = 'authenticated') with check (owner_id = auth.uid());

-- Owners can update/delete only their listings (but cannot change status to approved)
create policy "owners_manage_own" on public.listings
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid() and status <> 'approved');

-- Admin can update status
create policy "admin_manage_all" on public.listings
  for update using (exists (select 1 from auth.users u where u.id = auth.uid() and u.role = 'admin')) with check (true);

-- Public select only approved listings for anonymous users
create policy "public_select_approved" on public.listings
  for select using (status = 'approved');

-- Messages: only participants can insert/select
create policy "messages_participants" on public.messages
  for insert using (sender_id = auth.uid()) with check (sender_id = auth.uid() and (receiver_id is not null));
create policy "messages_select_participants" on public.messages
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());


Note: Supabase's auth.role() and auth.uid() usage may require policy functions or checks depending on your auth metadata setup. Use auth.uid() to tie rows to authenticated user's id. Admin detection can be a column on users table (role='admin') or stored in auth.users.app_metadata.

7. File storage & photos

Use Supabase Storage: bucket listing-photos.

Path format: listings/<listing_id>/<uuid>.jpg.

Validate images client-side and server-side: MIME type image/*, max 5 MB (or as desired), limit to max 8 photos per listing.

Generate signed public URL for approved listings; for pending or rejected, either private or blocked.

8. API / Next.js routes (pages & API endpoints)
Pages (Next.js)

/ — homepage with search bar and featured approved listings

/search — search results with filters (area, price sort)

/listing/[id] — listing detail page (photos carousel, specs, contact/Message owner)

/owner/dashboard — list owner’s listings + create listing

/owner/listing/new — form to create listing

/admin/dashboard — approve/reject listings

/auth/* — sign in / sign up via Supabase

API endpoints (Next.js API routes) — server-side where needed

POST /api/listings — create listing (owner) — validate inputs, create DB row, upload photos

PUT /api/listings/:id — update listing (owner)

GET /api/listings — search listings (filters & sort)

GET /api/listings/:id — get listing details (only if approved or owner/admin)

POST /api/messages — send message

GET /api/messages?thread_id=... — get messages for a thread

Prefer using Supabase client directly in Next.js, or create thin server-side APIs for additional validation.

9. Frontend component plan (UI/UX)

Clean responsive design: header with search, location dropdown, price sort.

Listing card: primary photo, price, area_name, brief specs icons (water, parking, allowed_for tag)

Listing detail: photo carousel, full description, specs grid, contact button (opens chat modal)

Owner form: stepper form — Basic info → Photos → Confirm → Submit (status pending)

Admin UI: grid of pending listing cards with Approve/Reject buttons and modal to view photos in full.

Design notes:

Keep mobile-first but desktop-friendly.

Use accessible forms and alt text for photos.

Use clear CTAs: “Message Owner”, “Owner Contact” (if allowed).

10. Validation & business rules

Owner can create unlimited listings (for MVP). Admin can suspend.

Every listing must have at least 1 photo and at most 8 photos.

Listing cannot be published (status=approved) without admin action.

Price must be positive; area_name must be one of seeded options.

Allowed_for field must be non-conflicting (e.g., girls_only disallows boys_only simultaneously).

11. Testing & Acceptance Criteria (MVP)
Unit / Integration tests

Auth: sign up/in flows for both roles.

Listings: owner can create, update, delete their listings; new listing status = pending.

Search: results only show approved listings.

Admin: approve listing changes status → becomes visible.

Messages: only participants can read/insert messages.

Storage: photo uploads only allowed if image and within size limit; photo accessible only after approval.

Acceptance tests (manual)

Owner signs up → creates listing with photos → listing appears in admin pending queue.

Admin approves listing → listing becomes visible in search & listing page.

Tenant searches area “Baneshwor” and sorts by price → results ordered correctly.

Tenant sends a message to owner → owner receives message in owner dashboard.

Unauthorized user cannot access owner dashboard pages.

12. Security & Privacy checklist

Enforce HTTPS (Vercel + Supabase serve over HTTPS).

Sanitize and validate all inputs to avoid SQL injection (Supabase client uses parameterized queries).

Limit file types and sizes — check MIME & extension.

Account enumeration prevention: standard auth behaviour for sign-in errors.

Rate-limit message posting (to prevent spam).

Audit logs for admin actions (approve/reject).

13. Deployment & infra (recommended)

Frontend: Vercel (Next.js) — automatic CI/CD from repo.

Backend: Supabase (Auth, DB, Storage).

Domain: configure DNS to Vercel.

Environment secrets: Supabase URL, API Key (use service role only server-side).

Backups: schedule DB backups in Supabase.

14. MVP checklist (prioritized)

Must-have (MVP)

Auth (tenant & owner) with roles

Listing creation & photo upload (pending)

Admin approve/reject listings

Search & price sorting (area dropdown)

Listing detail page with photo carousel

Simple text messaging (basic)

RLS policies and basic security hardening



15. Deliverables for a dev sprint (suggested tasks you can hand off)

Set up Supabase project & seed admin user + area list. (DB tables + RLS)

Implement Auth flows in Next.js.

Implement owner listing form with photo upload to Supabase Storage.

Admin panel: pending listings review (with photo viewer).

Public search & listing pages.

Messaging: basic Realtime using Supabase Realtime client.

Testing: unit & integration tests for core flows.

Deployment to Vercel.

16. Extra: Sample UI copy / microcopy

Listing CTA: “Request contact” / “Message Owner” (opens chat modal)

Owner form hint: “Add at least 1 photo (max 8).jpg/png. Keep images clear.”

Admin approve popup: “Approve listing? This will make the listing public.”