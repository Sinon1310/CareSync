-- Quick diagnostic and fix for CareSync database issues
-- Run this in your Supabase SQL Editor

-- 1. Check if tables exist
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('vital_readings', 'medications', 'medication_logs', 'profiles');

-- 2. Check if the medications table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'medications' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. If medications table doesn't exist, create it with simpler structure
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  instructions TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Create medication_logs table
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES public.medications(id) NOT NULL,
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create simple policies
DROP POLICY IF EXISTS "medications_policy" ON public.medications;
CREATE POLICY "medications_policy" ON public.medications 
  FOR ALL USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "medication_logs_policy" ON public.medication_logs;
CREATE POLICY "medication_logs_policy" ON public.medication_logs 
  FOR ALL USING (auth.uid() = patient_id);

-- 7. Test insert (this should work if everything is set up correctly)
-- Note: This will only work if you're logged in as a user
-- INSERT INTO public.medications (patient_id, name, dosage, frequency, instructions) 
-- VALUES (auth.uid(), 'Test Med', '10mg', 'once_daily', 'Test medication');

SELECT 'Setup complete! Try adding medications now.' as status;
