-- Add some test vital readings for the patient
-- Run this in Supabase SQL Editor to test the Patient Detail Modal

-- Replace this UUID with your patient's actual UUID (sinonrodrigues1310@gmail.com)
-- From earlier, it was: 1683f920-c56e-4d2a-beb5-de49d16997b4

INSERT INTO public.vital_readings (user_id, type, value, systolic, diastolic, status, recorded_at) VALUES
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'blood_pressure', '120/80', 120, 80, 'normal', NOW() - INTERVAL '1 hour'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'heart_rate', '72', NULL, NULL, 'normal', NOW() - INTERVAL '2 hours'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'blood_sugar', '95', NULL, NULL, 'normal', NOW() - INTERVAL '3 hours'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'temperature', '98.6', NULL, NULL, 'normal', NOW() - INTERVAL '4 hours'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'blood_pressure', '160/100', 160, 100, 'critical', NOW() - INTERVAL '30 minutes'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'heart_rate', '110', NULL, NULL, 'warning', NOW() - INTERVAL '45 minutes'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'blood_pressure', '140/90', 140, 90, 'warning', NOW() - INTERVAL '1 day'),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'heart_rate', '88', NULL, NULL, 'warning', NOW() - INTERVAL '1 day');

-- Add some test medications for the patient
INSERT INTO public.medications (patient_id, name, dosage, frequency, instructions, start_date, is_active) VALUES
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'Lisinopril', '10mg', 'once_daily', 'Take with water in the morning', '2025-09-01', true),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'Metformin', '500mg', 'twice_daily', 'Take with meals', '2025-09-15', true),
  ('1683f920-c56e-4d2a-beb5-de49d16997b4', 'Aspirin', '81mg', 'once_daily', 'Take with food', '2025-09-20', true);

-- Verify the data was added
SELECT 'Test data added successfully!' as status;

-- Check vital readings
SELECT type, value, status, recorded_at 
FROM vital_readings 
WHERE user_id = '1683f920-c56e-4d2a-beb5-de49d16997b4' 
ORDER BY recorded_at DESC;

-- Check medications
SELECT name, dosage, frequency, is_active 
FROM medications 
WHERE patient_id = '1683f920-c56e-4d2a-beb5-de49d16997b4' 
ORDER BY created_at DESC;
