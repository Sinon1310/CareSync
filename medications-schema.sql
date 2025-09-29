-- Add medications functionality to CareSync
-- Run this in your Supabase SQL Editor

-- Create medications table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prescribed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  instructions TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create medication_logs table for tracking when medications are taken
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medications
CREATE POLICY IF NOT EXISTS "Patients can view own medications" 
  ON public.medications 
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY IF NOT EXISTS "Patients can insert own medications" 
  ON public.medications 
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY IF NOT EXISTS "Patients can update own medications" 
  ON public.medications 
  FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY IF NOT EXISTS "Doctors can view patient medications" 
  ON public.medications 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctor_patients dp
      WHERE dp.doctor_id = auth.uid() AND dp.patient_id = medications.patient_id
    )
  );

CREATE POLICY IF NOT EXISTS "Doctors can prescribe medications" 
  ON public.medications 
  FOR INSERT WITH CHECK (
    auth.uid() = prescribed_by AND
    EXISTS (
      SELECT 1 FROM doctor_patients dp
      WHERE dp.doctor_id = auth.uid() AND dp.patient_id = medications.patient_id
    )
  );

-- Create RLS policies for medication logs
CREATE POLICY IF NOT EXISTS "Patients can view own medication logs" 
  ON public.medication_logs 
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY IF NOT EXISTS "Patients can log own medications" 
  ON public.medication_logs 
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY IF NOT EXISTS "Doctors can view patient medication logs" 
  ON public.medication_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctor_patients dp
      WHERE dp.doctor_id = auth.uid() AND dp.patient_id = medication_logs.patient_id
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.medications(is_active);
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient_id ON public.medication_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_at ON public.medication_logs(taken_at);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.medications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_logs;
