-- Doctor Dashboard Setup - Add Doctor-Patient Relationships
-- Run this in your Supabase SQL Editor

-- 1. Check if doctor_patients table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'doctor_patients';

-- 2. Create doctor_patients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.doctor_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure a patient can only be assigned to a doctor once in active status
  UNIQUE(doctor_id, patient_id, status)
);

-- 3. Enable RLS
ALTER TABLE public.doctor_patients ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "doctors_can_view_their_patients" ON public.doctor_patients;
CREATE POLICY "doctors_can_view_their_patients" ON public.doctor_patients 
  FOR SELECT USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "patients_can_view_their_doctors" ON public.doctor_patients;
CREATE POLICY "patients_can_view_their_doctors" ON public.doctor_patients 
  FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "doctors_can_manage_patients" ON public.doctor_patients;
CREATE POLICY "doctors_can_manage_patients" ON public.doctor_patients 
  FOR ALL USING (auth.uid() = doctor_id);

-- 5. Create some sample doctor-patient relationships for testing
-- (Replace these UUIDs with actual user IDs from your auth.users table)

-- First, let's see what users we have
SELECT auth.users.id, auth.users.email, 
  CASE 
    WHEN profiles.role = 'doctor' THEN '👩‍⚕️ Doctor'
    WHEN profiles.role = 'patient' THEN '👤 Patient' 
    ELSE '❓ Unknown'
  END as role_display
FROM auth.users 
LEFT JOIN profiles ON auth.users.id = profiles.id
ORDER BY profiles.role, auth.users.email;

-- 6. Optional: Create a sample relationship (uncomment and update IDs)
-- INSERT INTO public.doctor_patients (doctor_id, patient_id) 
-- VALUES 
--   ('your-doctor-uuid-here', 'your-patient-uuid-here');

SELECT 'Doctor-Patient relationship table setup complete!' as status;
