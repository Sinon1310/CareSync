-- Add doctor-patient relationships for testing
-- This assumes you have at least one doctor and one patient profile

-- Insert relationships (only if they don't already exist)
INSERT INTO doctor_patient_relationships (doctor_id, patient_id, status, assigned_at)
SELECT 
    d.id as doctor_id,
    p.id as patient_id,
    'active' as status,
    NOW() as assigned_at
FROM 
    (SELECT id FROM profiles WHERE role = 'doctor' LIMIT 1) d,
    (SELECT id FROM profiles WHERE role = 'patient' LIMIT 5) p
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_patient_relationships dpr
    WHERE dpr.doctor_id = d.id AND dpr.patient_id = p.id
);

-- Verify the relationships were created
SELECT 
    dpr.id,
    doctor.full_name as doctor_name,
    patient.full_name as patient_name,
    dpr.status,
    dpr.assigned_at
FROM doctor_patient_relationships dpr
JOIN profiles doctor ON dpr.doctor_id = doctor.id
JOIN profiles patient ON dpr.patient_id = patient.id
WHERE dpr.status = 'active'
ORDER BY dpr.assigned_at DESC;
