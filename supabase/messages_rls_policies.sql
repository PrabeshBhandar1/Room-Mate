-- RLS Policies for Messages Table
-- Run this in your Supabase SQL Editor

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert messages where they are the sender
CREATE POLICY "users_can_send_messages" ON public.messages
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id AND receiver_id IS NOT NULL);

-- Policy: Users can view messages where they are sender or receiver
CREATE POLICY "users_can_view_own_messages" ON public.messages
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: Users can update their own sent messages (for read receipts)
CREATE POLICY "users_can_update_messages" ON public.messages
  FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- Optional: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON public.messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
