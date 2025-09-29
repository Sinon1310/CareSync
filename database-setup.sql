-- CareSync Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Profiles table (already exists, but let's ensure it has all needed columns)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor')),
  phone TEXT,
  date_of_birth DATE,
  medical_license TEXT, -- for doctors
  specialty TEXT, -- for doctors
  emergency_contact TEXT, -- for patients
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Vital readings table
CREATE TABLE vital_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('blood_pressure', 'blood_sugar', 'heart_rate', 'weight', 'temperature', 'oxygen_saturation')),
  value TEXT NOT NULL,
  systolic INTEGER, -- for blood pressure
  diastolic INTEGER, -- for blood pressure
  unit TEXT,
  notes TEXT,
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Doctor-Patient relationships
CREATE TABLE doctor_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  UNIQUE(doctor_id, patient_id)
);

-- 4. Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'alert', 'appointment')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Medications table
CREATE TABLE medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prescribed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  instructions TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Health goals table
CREATE TABLE health_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value TEXT,
  current_value TEXT,
  goal_type TEXT CHECK (goal_type IN ('weight_loss', 'blood_pressure', 'blood_sugar', 'exercise', 'medication_adherence', 'custom')),
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Alerts table
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vital_reading_id UUID REFERENCES vital_readings(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical_reading', 'missed_reading', 'medication_reminder', 'appointment_reminder')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Vital readings: Patients can see their own, doctors can see their patients'
CREATE POLICY "Patients can view own vital readings" ON vital_readings
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT doctor_id FROM doctor_patients 
      WHERE patient_id = vital_readings.user_id AND status = 'active'
    )
  );

CREATE POLICY "Patients can insert own vital readings" ON vital_readings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can update own vital readings" ON vital_readings
  FOR UPDATE USING (auth.uid() = user_id);

-- Doctor-patient relationships
CREATE POLICY "View doctor-patient relationships" ON doctor_patients
  FOR SELECT USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Doctors can create relationships" ON doctor_patients
  FOR INSERT WITH CHECK (
    auth.uid() = doctor_id AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

-- Messages: Users can see messages they sent or received
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Appointments: Doctors and patients can see their appointments
CREATE POLICY "Users can view their appointments" ON appointments
  FOR SELECT USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Doctors can create appointments" ON appointments
  FOR INSERT WITH CHECK (
    auth.uid() = doctor_id AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

-- Medications: Patients can see their medications, doctors can see patients' medications
CREATE POLICY "View medications" ON medications
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.uid() IN (
      SELECT doctor_id FROM doctor_patients 
      WHERE patient_id = medications.patient_id AND status = 'active'
    )
  );

CREATE POLICY "Doctors can prescribe medications" ON medications
  FOR INSERT WITH CHECK (
    auth.uid() = prescribed_by AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

-- Health goals: Patients can see their goals, doctors can see patients' goals
CREATE POLICY "View health goals" ON health_goals
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.uid() IN (
      SELECT doctor_id FROM doctor_patients 
      WHERE patient_id = health_goals.patient_id AND status = 'active'
    )
  );

CREATE POLICY "Patients can create health goals" ON health_goals
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Alerts: Users can see alerts related to them
CREATE POLICY "View alerts" ON alerts
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Create indexes for better performance
CREATE INDEX idx_vital_readings_user_id ON vital_readings(user_id);
CREATE INDEX idx_vital_readings_recorded_at ON vital_readings(recorded_at);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_appointments_doctor_patient ON appointments(doctor_id, patient_id);
CREATE INDEX idx_doctor_patients_doctor_id ON doctor_patients(doctor_id);
CREATE INDEX idx_doctor_patients_patient_id ON doctor_patients(patient_id);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE vital_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
