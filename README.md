🏠 RoomMate – Online Room Rental Platform

RoomMate is a modern web-based rental room management system designed for Nepal. It connects tenants, house owners (landlords), and admins through a secure and transparent digital platform. The system eliminates dependency on brokers and enables direct communication using real-time chat.

🚀 Features
👤 User Roles

Tenant

Search and filter rooms

View verified listings

Contact owners via real-time chat

Request booking and schedule visits

Owner (Landlord)

Add, edit, and delete room listings

Upload room images

Communicate with tenants

Manage booking requests

Admin (Mandatory Role)

Verify and approve room listings

Manage users (tenants & owners)

Moderate chats and listings

Ensure platform security and trust

💬 Real-Time Chat System

Built using Supabase Realtime

One-to-one chat between tenant and owner

Instant message delivery

Secure access using Row Level Security (RLS)

Admin view-only access for moderation

🛠️ Technology Stack
Frontend

Next.js (App Router)

Tailwind CSS

Backend (BaaS)

Supabase

Authentication (Email/Password)

PostgreSQL Database

Storage (Room Images)

Realtime (Chat System)

🗂️ Database Tables
users

id (uuid)

name

email

phone

role (admin / owner / tenant)

listings

id

owner_id

title

rent

location

facilities[]

images[]

status (pending / approved / rejected)

created_at

chat_rooms

id

listing_id

owner_id

tenant_id

created_at

messages

id

chat_room_id

sender_id

message

created_at

🔐 Security

Supabase Row Level Security (RLS) enabled

Role-based access control

Only approved listings are visible publicly

Chat access restricted to participants and admin
