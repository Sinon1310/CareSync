-- Simple fix for vital_readings table
-- Run this in your Supabase SQL Editor

-- Drop existing table if it exists and recreate with proper structure
DROP TABLE IF EXISTS public.vital_readings CASCADE;

-- Create vital_readings table with exact structure needed
CREATE TABLE public.vital_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('blood_pressure', 'blood_sugar', 'heart_rate', 'temperature')),
  value TEXT NOT NULL,
  systolic INTEGER,
  diastolic INTEGER,
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.vital_readings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own readings" ON public.vital_readings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readings" ON public.vital_readings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own readings" ON public.vital_readings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own readings" ON public.vital_readings
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_vital_readings_user_id ON public.vital_readings(user_id);
CREATE INDEX idx_vital_readings_recorded_at ON public.vital_readings(recorded_at);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.vital_readings;
