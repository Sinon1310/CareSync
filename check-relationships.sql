-- Check current doctor-patient relationships
SELECT 
    dpr.id,
    dpr.status,
    doctor.full_name as doctor_name,
    doctor.email as doctor_email,
    patient.full_name as patient_name,
    patient.email as patient_email,
    dpr.assigned_at
FROM doctor_patient_relationships dpr
JOIN profiles doctor ON dpr.doctor_id = doctor.id
JOIN profiles patient ON dpr.patient_id = patient.id
ORDER BY dpr.assigned_at DESC;

-- Check profiles with their roles
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC;
