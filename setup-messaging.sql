-- Messaging System Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Create messages table
DROP TABLE IF EXISTS public.messages CASCADE;
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'alert', 'appointment', 'medication')),
  is_read BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- 2. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
DROP POLICY IF EXISTS "users_can_view_their_messages" ON public.messages;
CREATE POLICY "users_can_view_their_messages" ON public.messages 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "users_can_send_messages" ON public.messages;
CREATE POLICY "users_can_send_messages" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "users_can_update_their_messages" ON public.messages;
CREATE POLICY "users_can_update_their_messages" ON public.messages 
  FOR UPDATE USING (auth.uid() = receiver_id);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);

-- 5. Add some sample messages for testing (using placeholder IDs)
-- Note: Replace these UUIDs with actual user IDs from your auth.users table
-- You can find real user IDs by running: SELECT id, email FROM auth.users;

-- Uncomment and modify these lines with real user IDs:
/*
INSERT INTO public.messages (sender_id, receiver_id, content, message_type, is_urgent) VALUES
  ('YOUR_DOCTOR_USER_ID_HERE', 'YOUR_PATIENT_USER_ID_HERE', 'Hello! I noticed your blood pressure reading was elevated today. Please make sure to take your medication as prescribed and avoid high-sodium foods.', 'alert', true),
  ('YOUR_DOCTOR_USER_ID_HERE', 'YOUR_PATIENT_USER_ID_HERE', 'Your latest vital readings look much better! Keep up the good work with your medication routine.', 'text', false),
  ('YOUR_PATIENT_USER_ID_HERE', 'YOUR_DOCTOR_USER_ID_HERE', 'Thank you doctor. I have been taking my medications on time. Should I schedule a follow-up appointment?', 'text', false);
*/

-- 6. Verify the setup
SELECT 'Messages table setup complete!' as status;

-- Check the table structure (using standard SQL instead of \d command)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get your user IDs for testing (copy these to use in sample messages above)
SELECT id, email, raw_user_meta_data->>'role' as role 
FROM auth.users 
ORDER BY created_at DESC;

-- Check sample messages (if any were inserted)
SELECT 
  m.content,
  m.message_type,
  m.is_urgent,
  m.created_at,
  sender.email as sender_email,
  receiver.email as receiver_email
FROM messages m
LEFT JOIN auth.users sender ON m.sender_id = sender.id
LEFT JOIN auth.users receiver ON m.receiver_id = receiver.id
ORDER BY m.created_at DESC;
