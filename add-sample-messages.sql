-- Add Sample Messages for Testing
-- Run this after the main setup-messaging.sql

-- Sample messages between users
-- Using your actual user IDs from the database

INSERT INTO public.messages (sender_id, receiver_id, content, message_type, is_urgent) VALUES
  -- Doctor to Patient (urgent alert)
  ('60cd0272-982c-48f1-8d58-4664843d4817', '1683f920-c56e-4d2a-beb5-de49d16997b4', 
   'Hello! I noticed your blood pressure reading was elevated today. Please make sure to take your medication as prescribed and avoid high-sodium foods.', 
   'alert', true),
   
  -- Doctor to Patient (normal message)
  ('60cd0272-982c-48f1-8d58-4664843d4817', '1683f920-c56e-4d2a-beb5-de49d16997b4', 
   'Your latest vital readings look much better! Keep up the good work with your medication routine.', 
   'text', false),
   
  -- Patient to Doctor (response)
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', '60cd0272-982c-48f1-8d58-4664843d4817', 
   'Thank you doctor. I have been taking my medications on time. Should I schedule a follow-up appointment?', 
   'text', false),
   
  -- Doctor to Patient (medication reminder)
  ('60cd0272-982c-48f1-8d58-4664843d4817', '1683f920-c56e-4d2a-beb5-de49d16997b4', 
   '⏰ Reminder: It''s time to take your Lisinopril 10mg. Please log it in your dashboard after taking it.', 
   'medication', false),
   
  -- Doctor to Another User (appointment)
  ('60cd0272-982c-48f1-8d58-4664843d4817', '309eb3ef-30b2-4b04-9dcf-ff0e7d087d77', 
   '📅 Appointment Update: Your follow-up appointment has been scheduled for next Tuesday at 2:00 PM.', 
   'appointment', false);

-- Verify the messages were inserted
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
