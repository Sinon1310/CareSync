-- Enhanced Doctor-Patient Relationship Setup
-- This improves the original setup with better data and relationships

-- 1. Ensure profiles have roles set correctly
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"doctor"'
) 
WHERE email IN ('rodriguessinon@gmail.com', 'sinon@gmail.com');

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"patient"'
) 
WHERE email = 'sinonrodrigues1310@gmail.com';

-- 2. Update profiles table
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', email),
  COALESCE(raw_user_meta_data->>'role', 'patient'),
  created_at,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET
  role = COALESCE(EXCLUDED.role, profiles.role),
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  updated_at = NOW();

-- 3. Create or update doctor_patients table
CREATE TABLE IF NOT EXISTS public.doctor_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  UNIQUE(doctor_id, patient_id)
);

-- Enable RLS
ALTER TABLE public.doctor_patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "doctors_can_view_their_patients" ON public.doctor_patients;
CREATE POLICY "doctors_can_view_their_patients" ON public.doctor_patients 
  FOR SELECT USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "doctors_can_manage_their_patients" ON public.doctor_patients;
CREATE POLICY "doctors_can_manage_their_patients" ON public.doctor_patients 
  FOR ALL USING (auth.uid() = doctor_id);

-- 4. Assign patients to doctors (using your actual user IDs)
INSERT INTO public.doctor_patients (doctor_id, patient_id, notes) VALUES
  -- Dr. Sinon (rodriguessinon@gmail.com) gets patient sinonrodrigues1310@gmail.com
  ('60cd0272-982c-48f1-8d58-4664843d4817', '1683f920-c56e-4d2a-beb5-de49d16997b4', 'Primary care patient - monitoring blood pressure and diabetes'),
  -- Dr. Sinon also gets the other user as a patient for testing
  ('60cd0272-982c-48f1-8d58-4664843d4817', '309eb3ef-30b2-4b04-9dcf-ff0e7d087d77', 'Cardiac monitoring patient')
ON CONFLICT (doctor_id, patient_id) DO NOTHING;

-- 5. Add some sample vital readings for the patients to make dashboard more interesting
INSERT INTO public.vital_readings (user_id, type, value, systolic, diastolic, status, recorded_at) VALUES
  -- Patient 1 readings
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'blood_pressure', '140/90', 140, 90, 'warning', NOW() - INTERVAL '1 hour'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'blood_sugar', '180', NULL, NULL, 'warning', NOW() - INTERVAL '2 hours'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'heart_rate', '85', NULL, NULL, 'normal', NOW() - INTERVAL '3 hours'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'temperature', '98.6', NULL, NULL, 'normal', NOW() - INTERVAL '4 hours'),
  
  -- Patient 2 readings
  ('309eb3ef-30b2-4b04-9dcf-ff0e7d087d77', 'blood_pressure', '160/100', 160, 100, 'critical', NOW() - INTERVAL '30 minutes'),
  ('309eb3ef-30b2-4b04-9dcf-ff0e7d087d77', 'heart_rate', '95', NULL, NULL, 'warning', NOW() - INTERVAL '1 hour'),
  ('309eb3ef-30b2-4b04-9dcf-ff0e7d087d77', 'blood_sugar', '120', NULL, NULL, 'normal', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- 6. Verify the setup
SELECT 'Doctor-Patient relationships setup complete!' as status;

-- Check doctor assignments
SELECT 
  dp.id,
  doc.email as doctor_email,
  patient.email as patient_email,
  dp.status,
  dp.assigned_at
FROM doctor_patients dp
JOIN auth.users doc ON dp.doctor_id = doc.id
JOIN auth.users patient ON dp.patient_id = patient.id
ORDER BY dp.assigned_at DESC;

-- Check patient vital readings
SELECT 
  vr.user_id,
  u.email,
  vr.type,
  vr.value,
  vr.status,
  vr.recorded_at
FROM vital_readings vr
JOIN auth.users u ON vr.user_id = u.id
ORDER BY vr.recorded_at DESC
LIMIT 10;
