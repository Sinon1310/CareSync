-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Create RLS (Row Level Security) policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can only see their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (auth.uid() = patient_id);

-- Policy: Doctors can view appointments for their patients
CREATE POLICY "Doctors can view patient appointments" ON appointments
    FOR SELECT USING (
        auth.uid() = doctor_id OR
        EXISTS (
            SELECT 1 FROM doctor_patient_relationships dpr
            WHERE dpr.doctor_id = auth.uid() 
            AND dpr.patient_id = appointments.patient_id
            AND dpr.status = 'active'
        )
    );

-- Policy: Patients can create appointments
CREATE POLICY "Patients can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Policy: Doctors can update appointments
CREATE POLICY "Doctors can update appointments" ON appointments
    FOR UPDATE USING (
        auth.uid() = doctor_id OR
        EXISTS (
            SELECT 1 FROM doctor_patient_relationships dpr
            WHERE dpr.doctor_id = auth.uid() 
            AND dpr.patient_id = appointments.patient_id
            AND dpr.status = 'active'
        )
    );

-- Policy: Patients can update their own appointments (for rescheduling)
CREATE POLICY "Patients can update own appointments" ON appointments
    FOR UPDATE USING (auth.uid() = patient_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON appointments TO authenticated;
GRANT ALL ON appointments TO service_role;
