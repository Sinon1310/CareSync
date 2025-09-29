-- Fix vital readings functionality
-- Run this script in the Supabase SQL Editor to ensure the vital_readings table 
-- matches the requirements in the PatientDashboard component

-- 1. First check if table exists and has the right structure
DO $$
BEGIN
  -- Add recorded_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vital_readings' AND column_name = 'recorded_at'
  ) THEN
    ALTER TABLE vital_readings ADD COLUMN recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add systolic column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vital_readings' AND column_name = 'systolic'
  ) THEN
    ALTER TABLE vital_readings ADD COLUMN systolic INTEGER;
  END IF;
  
  -- Add diastolic column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vital_readings' AND column_name = 'diastolic'
  ) THEN
    ALTER TABLE vital_readings ADD COLUMN diastolic INTEGER;
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vital_readings' AND column_name = 'status'
  ) THEN
    ALTER TABLE vital_readings ADD COLUMN status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical'));
  END IF;
END
$$;

-- 2. Update or create RLS policies to ensure proper access
DROP POLICY IF EXISTS "Patients can view own vital readings" ON vital_readings;
CREATE POLICY "Patients can view own vital readings" ON vital_readings
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT doctor_id FROM doctor_patients 
      WHERE patient_id = vital_readings.user_id AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Patients can insert own vital readings" ON vital_readings;
CREATE POLICY "Patients can insert own vital readings" ON vital_readings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Patients can update own vital readings" ON vital_readings;
CREATE POLICY "Patients can update own vital readings" ON vital_readings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Patients can delete own vital readings" ON vital_readings;
CREATE POLICY "Patients can delete own vital readings" ON vital_readings
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_vital_readings_user_id ON vital_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_vital_readings_recorded_at ON vital_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_vital_readings_type ON vital_readings(type);
CREATE INDEX IF NOT EXISTS idx_vital_readings_status ON vital_readings(status);

-- 4. Update the vital readings table definition in your TypeScript code to match:
-- export interface VitalReading {
--   id: string
--   user_id: string
--   type: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'weight' | 'temperature' | 'oxygen_saturation'
--   value: string
--   systolic?: number
--   diastolic?: number
--   unit?: string
--   notes?: string
--   status: 'normal' | 'warning' | 'critical'
--   recorded_at: string
--   created_at: string
-- }

-- 5. Enable Realtime for live updates (if it's not enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE vital_readings;

-- 6. Verify vital_readings table structure with a simple query
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'vital_readings';
