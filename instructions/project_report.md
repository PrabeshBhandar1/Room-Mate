# RoomMate — Project Report

## Online Room & Flat Rental Platform for Nepal

**Technology Stack:** Next.js 16 | React 19 | Supabase | Tailwind CSS v4 | Vercel

---

## Abstract

RoomMate is a web-based rental platform designed specifically for Nepal that streamlines how tenants find rooms or full flats and how property owners list their properties. Built using Next.js and Supabase (Auth, PostgreSQL, Storage, Realtime), the system provides secure, role-based authentication for three user types — Tenants, Owners, and Admins — along with an efficient workflow for property listing, admin moderation, advanced search with filters, and real-time messaging.

The platform targets the Kathmandu Valley rental market, covering 20 pre-seeded neighborhoods including Baneshwor, Koteshwor, Lalitpur, Bhaktapur, Thamel, Patan, and more. Property owners can create detailed listings with photos, pricing in NPR, and amenity information. Every listing undergoes manual admin approval before becoming publicly visible, ensuring quality and preventing misuse. Tenants can search approved listings by area, filter by price range and property type (room or flat), sort by price, and directly message property owners through a secure, real-time in-app chat system. The responsive, mobile-first design ensures seamless access across desktop and mobile browsers, while Row Level Security (RLS) policies, input validation, and HTTPS enforcement protect user data and platform integrity.

---

## Acknowledgement

We would like to express our sincere gratitude to all those who contributed to the successful development of the RoomMate project.

We extend our heartfelt thanks to our project supervisor for their valuable guidance, continuous support, and constructive feedback throughout the entire development process. Their expertise in web application development and their vision for addressing real-world rental challenges in Nepal were instrumental in shaping this project.

We are grateful to the open-source communities behind Next.js, React, Supabase, and Tailwind CSS for providing robust, well-documented frameworks and tools that formed the technical foundation of this platform. Special thanks to Vercel and Supabase for their generous free-tier hosting and backend-as-a-service infrastructure that made deployment and scaling possible.

We also appreciate the feedback and insights from our peers and potential end-users in the Kathmandu Valley who helped shape the platform's features, usability, and design decisions. Their real-world perspectives on the rental challenges in Nepal were invaluable.

Finally, we are thankful to our families and friends for their encouragement and understanding throughout this project.

---

## 1. Introduction

### 1.1 Background

The rental market in Nepal, particularly in the Kathmandu Valley, has been growing rapidly due to urbanization, internal migration, and the increasing student population in the capital. Despite this growth, the process of finding a room or flat remains largely informal and unstructured. Tenants typically rely on scattered social media posts (Facebook groups, Hamrobazaar), word-of-mouth referrals, and physical "To Let" signs placed by property owners. Property owners, on the other hand, lack a dedicated, trustworthy platform to reach potential renters efficiently.

This fragmented approach leads to significant challenges: tenants waste time scrolling through unverified listings, owners struggle to find reliable tenants, and neither party has a secure communication channel. The absence of a moderation system means fake, outdated, and misleading listings proliferate, eroding trust in the rental ecosystem.

### 1.2 Project Overview

**RoomMate** is a modern, web-based rental platform that addresses these challenges by providing a centralized, secure, and transparent marketplace for rooms and flats in Nepal. The platform is built on a cutting-edge technology stack:

| Component       | Technology                                             |
|-----------------|--------------------------------------------------------|
| Frontend        | Next.js 16 with React 19                               |
| Styling         | Tailwind CSS v4 with PostCSS                           |
| Authentication  | Supabase Auth (email/password with role selection)     |
| Database        | Supabase PostgreSQL with Row Level Security (RLS)      |
| File Storage    | Supabase Storage (listing photos)                      |
| Real-time Chat  | Supabase Realtime subscriptions                        |
| Notifications   | Sonner toast library                                   |
| Deployment      | Vercel (automatic CI/CD from GitHub)                   |
| Code Quality    | ESLint, Prettier, React Compiler (babel plugin)        |

### 1.3 User Roles

The platform serves three distinct user types, each with dedicated interfaces and permissions:

1. **Tenant** — Searches and browses approved listings, views property details and photos, messages owners, and discovers rental opportunities through advanced filters.
2. **Owner** — Creates, edits, and manages property listings with photos and detailed amenity information. New listings are submitted for admin review.
3. **Admin** — Moderates the platform by reviewing pending listings, approving or rejecting them with reasons, managing users, and monitoring platform statistics.

---

## 2. Problem Statement

Finding a room or flat in Nepal — especially in the Kathmandu Valley — is a stressful, unreliable, and disorganized experience for both tenants and property owners. The current rental ecosystem suffers from the following critical problems:

### 2.1 Scattered and Fragmented Information
Rental listings are dispersed across multiple unrelated platforms — Facebook groups, classified ad websites, personal connections, and physical "To Let" signs. There is no single, dedicated platform where tenants can search comprehensively and where owners can list their properties with confidence.

### 2.2 Unverified and Misleading Listings
Existing platforms have no moderation or verification system. Outdated listings remain visible long after properties are rented, fake listings waste tenants' time, and inaccurate descriptions lead to disappointment during physical visits.

### 2.3 Lack of Advanced Search and Filtering
Tenants cannot efficiently filter properties by area, price range, property type (room vs. flat), amenities (water availability, parking), or tenant preferences. The search process is essentially a manual scroll through an unorganized feed.

### 2.4 Insecure and Unprofessional Communication
There is no dedicated, secure channel for tenant-owner communication. Personal phone numbers and contact details are often publicly exposed, raising privacy and safety concerns.

### 2.5 No Quality Control or Transparency
Without a review system, there is no accountability for listing quality. Property details are often vague, photographs may be misleading, and there is no standardized way to compare listings.

### 2.6 Resulting User Frustration
The combination of these problems creates a frustrating, time-consuming, and sometimes risky experience for everyone involved — from tenants who spend weeks searching for a suitable room to owners who receive irrelevant inquiries.

**There is a clear and pressing need for a centralized, verified, and user-friendly rental platform** that organizes the entire rental process, making it safe, efficient, and transparent for all stakeholders.

---

## 3. Objectives

The primary objectives of the RoomMate project are:

1. **To design and develop a secure, role-based rental platform** with separate, dedicated experiences for Tenants, Owners, and Admins using Next.js and Supabase.

2. **To implement a comprehensive listing management system** where Owners can create property listings with detailed information (title, description, price in NPR, location/area, water availability, parking options, allowed tenants, room/flat type) and upload up to 8 property photos — with all listings requiring manual admin approval before public visibility.

3. **To provide advanced search and filtering capabilities** enabling Tenants to search listings by area name (from 20 pre-seeded Kathmandu Valley neighborhoods), filter by price range and listing type (room/flat), and sort results by price in ascending or descending order.

4. **To enable secure, real-time messaging** between tenants and property owners through a text-only in-app chat system powered by Supabase Realtime subscriptions, eliminating the need to share personal contact information publicly.

5. **To implement a robust admin moderation workflow** where Admins can review pending listings, view property photos and details, approve or reject listings with optional rejection reasons, and monitor platform statistics.

6. **To ensure data security and privacy** through PostgreSQL Row Level Security (RLS) policies on all tables, secure authentication with Supabase Auth, input validation, file upload restrictions (image type and size limits), and HTTPS enforcement.

7. **To deliver a responsive, mobile-first user interface** that works seamlessly across desktop and mobile browsers, following modern web design principles and accessibility best practices.

8. **To deploy a production-ready application** on Vercel with Supabase backend infrastructure, configured with automatic CI/CD from GitHub, environment variable management, and optimized performance.

---

## 4. Scope

### 4.1 Features Included

The RoomMate platform encompasses the following features within its current scope:

#### Authentication & User Management
- Email/password sign-up with role selection (Tenant or Owner)
- Email verification support
- Session management with auth context
- Role-based route protection and redirection

#### Listing Management (Owner)
- Create listings with comprehensive property details:
  - Title, description, price per month (NPR)
  - Area name (from pre-seeded dropdown)
  - Address line, latitude/longitude (optional)
  - Water availability (continuous/timed/no)
  - Parking (none/bike only/car only/bike and car)
  - Allowed tenants (couples/students/girls only/boys only/any)
  - Listing type (room/flat)
  - Owner-occupied status
- Upload up to 8 property photos (stored in Supabase Storage)
- Edit and delete own listings
- View listing status (pending/approved/rejected/archived)
- Dedicated Owner Dashboard

#### Admin Moderation
- View all pending listings with full details and photos
- Approve or reject listings with optional rejection reason
- Basic platform statistics (total listings, pending, approved counts)
- Admin Dashboard

#### Public Search & Discovery
- Homepage with hero section and recent approved listings
- Search by area name (20 pre-seeded Kathmandu Valley neighborhoods)
- Price sorting (ascending/descending)
- Listing detail pages with photo carousel
- Only approved listings visible to public

#### Messaging
- Real-time text-only chat between tenant and owner per listing
- Supabase Realtime subscriptions for instant message delivery
- Message read status tracking
- Secure — only participants can access their conversations

#### UI/UX
- Responsive, mobile-first design
- Toast notifications (using Sonner library)
- Reusable Navbar component with avatar display
- Loading states and error handling

#### Technical Infrastructure
- 5 database tables: `users`, `listings`, `listing_photos`, `messages`, `areas`
- Comprehensive RLS policies on all tables
- Database indexes for performance
- Supabase Storage for photo management
- Vercel deployment with environment variable configuration

### 4.2 Geographic Scope

The platform currently targets the **Kathmandu Valley**, with 20 pre-seeded areas:

| | | | |
|---|---|---|---|
| Baneshwor | Koteshwor | Maitidevi | Putalisadak |
| Lalitpur | Bhaktapur | Thamel | Lazimpat |
| Boudha | Kalanki | Balaju | Chabahil |
| Jorpati | Maharajgunj | New Baneshwor | Patan |
| Pulchowk | Sanepa | Satdobato | Swayambhu |

### 4.3 Application Pages

| Route | Purpose |
|-------|---------|
| `/` | Homepage with search bar and featured approved listings |
| `/search` | Search results with area filter, price sorting |
| `/listing/[id]` | Listing detail page with photo carousel and message button |
| `/auth/login` | User sign-in page |
| `/auth/signup` | User registration with role selection |
| `/auth/verify-email` | Email verification page |
| `/owner/dashboard` | Owner's listing management dashboard |
| `/owner/listing/new` | Create new listing form |
| `/admin/dashboard` | Admin moderation and statistics dashboard |
| `/messages` | Real-time messaging interface |
| `/profile` | User profile management |
| `/about` | About RoomMate page |

---

## 5. Limitations

Despite the comprehensive feature set, the RoomMate platform has the following limitations in its current version:

1. **Web-Only Platform** — RoomMate is a web application only. There is no native mobile application for iOS or Android. Users access the platform through mobile and desktop web browsers.

2. **No Monetization or Payment System** — The platform does not include any payment gateway, subscription model, premium listings, booking system, or financial transaction features.

3. **No AI or Machine Learning Features** — There are no AI-powered listing recommendations, smart matching algorithms, chatbots, automated content moderation, or predictive analytics.

4. **Text-Only Messaging** — The in-app chat is limited to plain text messages. There is no support for file sharing, image sharing within chat, voice messages, video calls, or group conversations.

5. **Manual Admin Approval Only** — All listing moderation is performed manually by administrators. There is no automated content filtering, spam detection, or image verification system.

6. **Limited Geographic Coverage** — The platform is currently designed for and seeded with only 20 neighborhoods in the Kathmandu Valley. Expanding to other cities and regions in Nepal requires additional area data and potentially different area management features.

7. **No Bookmarking or Favorites** — Tenants cannot save, bookmark, or shortlist listings for later reference.

8. **No Map-Based Search** — While latitude and longitude fields exist in the database schema for future use, map-based search and property visualization on maps are not yet implemented.

9. **Single Language (English)** — The platform is available only in English. Nepali language support or multi-language capability is not currently implemented.

10. **Basic Analytics Only** — The admin dashboard provides only simple aggregate statistics (total, pending, and approved listing counts). There are no advanced analytics, reports, charts, or data export capabilities.

11. **No Property Visit Scheduling** — There is no calendar integration, scheduling system, or booking mechanism for property visits.

12. **No User Reviews or Ratings** — There is no system for tenants to rate or review properties or owners, or for owners to rate tenants.

13. **No Notification System Beyond Toasts** — There are no push notifications, email notifications, or SMS alerts for events like listing approval, new messages, or status changes.

14. **Photo Limitations** — Each listing is limited to a maximum of 8 photos. Validation is primarily client-side (MIME type and file size checks).

---

## 6. Database Schema

The application uses a PostgreSQL database (via Supabase) with the following 5 core tables:

### 6.1 Users Table
Stores user profile information linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | References `auth.users(id)` |
| `display_name` | Text | User's display name |
| `role` | Text | `tenant`, `owner`, or `admin` |
| `phone` | Text | Contact phone number |
| `created_at` | Timestamptz | Account creation time |

### 6.2 Listings Table
Core table for property listings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `owner_id` | UUID (FK) | References `users(id)` |
| `title` | Text | Listing title |
| `description` | Text | Detailed description |
| `price_per_month` | Numeric | Monthly rent in NPR |
| `currency` | Text | Default: `NPR` |
| `address_line` | Text | Street address |
| `area_name` | Text | Neighborhood name |
| `latitude` / `longitude` | Double | Coordinates (future use) |
| `is_owner_occupied` | Boolean | Owner lives on premises |
| `water_availability` | Text | `continuous`, `timed`, or `no` |
| `parking` | Text | `none`, `bike_only`, `car_only`, `bike_and_car` |
| `allowed_for` | Text | Target tenant type |
| `listing_type` | Text | `room` or `flat` |
| `status` | Text | `pending`, `approved`, `rejected`, `archived` |
| `rejection_reason` | Text | Admin's reason for rejection |
| `created_at` / `updated_at` | Timestamptz | Timestamps |

### 6.3 Listing Photos Table
Stores references to uploaded property photos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `listing_id` | UUID (FK) | References `listings(id)` |
| `storage_path` | Text | Path in Supabase Storage |
| `order_num` | Int | Display order |

### 6.4 Messages Table
Simple real-time chat messages.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `listing_id` | UUID (FK) | References `listings(id)` |
| `sender_id` | UUID (FK) | References `users(id)` |
| `receiver_id` | UUID (FK) | References `users(id)` |
| `content` | Text | Message text |
| `created_at` | Timestamptz | Sent time |
| `is_read` | Boolean | Read status |

### 6.5 Areas Table
Pre-seeded neighborhood names for dropdown selection.

| Column | Type | Description |
|--------|------|-------------|
| `id` | Int (PK) | Auto-generated |
| `name` | Text (Unique) | Area/neighborhood name |

---

## 7. Security Measures

RoomMate implements multiple layers of security:

- **Row Level Security (RLS)** on all 5 database tables with granular policies
- **Supabase Auth** with secure email/password authentication
- **Role-based access control** protecting owner and admin routes
- **Input validation** on both client-side and server-side
- **File upload validation** restricting types to images with size limits
- **HTTPS enforcement** via Vercel and Supabase infrastructure
- **Parameterized queries** through Supabase client (preventing SQL injection)
- **Privacy protection** — owner contact details not publicly exposed

---

*© 2026 RoomMate Nepal. All rights reserved.*
