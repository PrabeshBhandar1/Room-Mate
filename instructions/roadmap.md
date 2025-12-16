# RoomMate - Implementation Roadmap

This roadmap outlines the phases for building the RoomMate platform, a room and flat rental service for Nepal.

## Phase 1: Project Initialization & Foundation
- [x] **Project Setup**
    - [x] Initialize Next.js application with javascript and Tailwind CSS.
    - [x] Configure ESLint and Prettier.
    - [x] Set up project structure (components, lib, pages/app).
- [ ] **Supabase Setup**
    - [ ] Create Supabase project.
    - [x] Define Database Schema (Users, Listings, Listing Photos, Messages).
    - [ ] Set up Storage buckets (`listing-photos`).
    - [x] Implement Row Level Security (RLS) policies for all tables.
    - [ ] Seed initial data (Area names, Admin user).

## Phase 2: Authentication & Authorization
- [x] **Auth Implementation**
    - [x] Build Sign Up page with Role selection (Tenant/Owner).
    - [x] Build Login page.
    - [x] Implement Supabase Auth integration.
    - [x] Create Auth context/hooks for user session management.
- [x] **Role-Based Access Control**
    - [x] Protect routes (e.g., `/owner/*`, `/admin/*`).
    - [x] Ensure correct redirection after login based on role.

## Phase 3: Owner Dashboard & Listings Management
- [x] **Owner Dashboard**
    - [x] Create dashboard layout for Owners.
    - [x] Display list of owner's listings with status indicators.
- [x] **Create/Edit Listing**
    - [x] Build Listing Form (Title, Description, Price, Area, Specs).
    - [x] Implement Image Upload to Supabase Storage.
    - [x] Handle "Pending" status default for new listings.
    - [x] Implement Edit and Delete functionality.

## Phase 4: Admin Dashboard
- [x] **Admin Interface**
    - [x] Create Admin Dashboard layout.
    - [x] Fetch and display "Pending" listings.
- [x] **Moderation Workflow**
    - [x] View full listing details and photos.
    - [x] Implement Approve and Reject actions.
    - [x] (Optional) Add rejection reason input.
    - [x] Basic statistics widget (Total listings, Pending, Approved).

## Phase 5: Public Search & Listing Details
- [x] **Homepage**
    - [x] Design Hero section with Search Bar.
    - [x] Display featured/recent approved listings.
- [x] **Search Functionality**
    - [x] Implement Search Results page.
    - [x] Add filters: Area (dropdown), Price range.
    - [x] Add sorting: Price (Low/High).
- [x] **Listing Detail Page**
    - [x] Display full listing information.
    - [x] Implement Photo Carousel.
    - [x] Show Owner contact info (if applicable) or Message button.

## Phase 6: Realtime Messaging System
- [x] **Chat Infrastructure**
    - [x] Set up Supabase Realtime subscriptions for messages.
    - [x] Create API/Service functions for sending/fetching messages.
- [x] **Chat UI**
    - [x] Build Chat Interface (Thread list, Message view).
    - [x] Integrate "Message Owner" button on Listing Detail page.
    - [x] Ensure only relevant parties can access chats.

## Phase 7: UI/UX Polish & Deployment
- [ ] **Refinement**
    - [ ] Improve responsive design for mobile devices.
    - [ ] Add loading states and error handling (Toasts/Alerts).
    - [ ] Enhance aesthetics (Animations, Fonts, Colors).
- [ ] **SEO & Performance**
    - [ ] Add Meta tags and Title tags.
    - [ ] Optimize image loading.
- [ ] **Deployment**
    - [ ] Deploy frontend to Vercel.
    - [ ] Verify production environment variables.
    - [ ] Final manual testing of all user flows.
