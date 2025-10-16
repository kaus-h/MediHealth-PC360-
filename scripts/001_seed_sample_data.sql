-- Seed sample data for MediHealth
-- This script creates sample profiles, patients, clinicians, caregivers, and visits

-- Create sample profiles
INSERT INTO profiles (id, first_name, last_name, email, phone, date_of_birth, role, address, city, state, zip_code)
VALUES
  -- Patients
  ('11111111-1111-1111-1111-111111111111', 'John', 'Smith', 'john.smith@example.com', '555-0101', '1965-03-15', 'patient', '123 Main St', 'Boston', 'MA', '02101'),
  ('22222222-2222-2222-2222-222222222222', 'Mary', 'Johnson', 'mary.johnson@example.com', '555-0102', '1972-07-22', 'patient', '456 Oak Ave', 'Cambridge', 'MA', '02138'),
  ('33333333-3333-3333-3333-333333333333', 'Robert', 'Williams', 'robert.williams@example.com', '555-0103', '1958-11-08', 'patient', '789 Pine Rd', 'Somerville', 'MA', '02143'),
  ('44444444-4444-4444-4444-444444444444', 'Patricia', 'Brown', 'patricia.brown@example.com', '555-0104', '1980-02-14', 'patient', '321 Elm St', 'Brookline', 'MA', '02445'),
  ('55555555-5555-5555-5555-555555555555', 'Michael', 'Davis', 'michael.davis@example.com', '555-0105', '1945-09-30', 'patient', '654 Maple Dr', 'Newton', 'MA', '02458'),
  
  -- Clinicians
  ('66666666-6666-6666-6666-666666666666', 'Sarah', 'Anderson', 'sarah.anderson@healthcare.com', '555-0201', '1985-05-12', 'clinician', '100 Medical Plaza', 'Boston', 'MA', '02101'),
  ('77777777-7777-7777-7777-777777777777', 'James', 'Wilson', 'james.wilson@healthcare.com', '555-0202', '1978-08-25', 'clinician', '200 Health Center', 'Cambridge', 'MA', '02138'),
  ('88888888-8888-8888-8888-888888888888', 'Emily', 'Martinez', 'emily.martinez@healthcare.com', '555-0203', '1990-12-03', 'clinician', '300 Care Blvd', 'Somerville', 'MA', '02143'),
  
  -- Caregivers
  ('99999999-9999-9999-9999-999999999999', 'David', 'Taylor', 'david.taylor@example.com', '555-0301', '1975-04-18', 'caregiver', '111 Family Ln', 'Boston', 'MA', '02101'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Jennifer', 'Thomas', 'jennifer.thomas@example.com', '555-0302', '1982-06-27', 'caregiver', '222 Care St', 'Cambridge', 'MA', '02138')
ON CONFLICT (id) DO NOTHING;

-- Create sample agency
INSERT INTO agencies (id, name, license_number, email, phone, address, city, state, zip_code, is_active)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Boston Home Health Services', 'LIC-MA-12345', 'info@bostonhomehealth.com', '555-1000', '500 Healthcare Way', 'Boston', 'MA', '02101', true)
ON CONFLICT (id) DO NOTHING;

-- Create patients
INSERT INTO patients (id, profile_id, medical_record_number, primary_diagnosis, status, admission_date, insurance_provider, insurance_policy_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'MRN-001', 'Congestive Heart Failure', 'active', '2024-01-15', 'Blue Cross Blue Shield', 'BCBS-123456', 'Jane Smith', '555-0111', 'Spouse'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'MRN-002', 'Type 2 Diabetes', 'active', '2024-02-20', 'Medicare', 'MED-789012', 'Tom Johnson', '555-0112', 'Son'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'MRN-003', 'COPD', 'active', '2024-03-10', 'Aetna', 'AET-345678', 'Susan Williams', '555-0113', 'Daughter'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444444', 'MRN-004', 'Post-Surgical Recovery', 'active', '2024-09-05', 'United Healthcare', 'UHC-901234', 'Mark Brown', '555-0114', 'Husband'),
  ('10101010-1010-1010-1010-101010101010', '55555555-5555-5555-5555-555555555555', 'MRN-005', 'Alzheimers Disease', 'active', '2023-11-01', 'Medicaid', 'MCD-567890', 'Linda Davis', '555-0115', 'Daughter')
ON CONFLICT (id) DO NOTHING;

-- Create clinicians
INSERT INTO clinicians (id, profile_id, agency_id, license_number, license_type, specialization, is_active)
VALUES
  ('11101110-1110-1110-1110-111011101110', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'RN-MA-12345', 'RN', 'Cardiac Care', true),
  ('22202220-2220-2220-2220-222022202220', '77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'RN-MA-23456', 'RN', 'Wound Care', true),
  ('33303330-3330-3330-3330-333033303330', '88888888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PT-MA-34567', 'PT', 'Physical Therapy', true)
ON CONFLICT (id) DO NOTHING;

-- Create caregivers
INSERT INTO caregivers (id, profile_id, relationship_to_patient, is_mpoa)
VALUES
  ('44404440-4440-4440-4440-444044404440', '99999999-9999-9999-9999-999999999999', 'Son', true),
  ('55505550-5550-5550-5550-555055505550', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Daughter', false)
ON CONFLICT (id) DO NOTHING;

-- Link caregivers to patients
INSERT INTO patient_caregivers (id, patient_id, caregiver_id, access_level, can_view_records, can_schedule, can_message, granted_by)
VALUES
  ('66606660-6660-6660-6660-666066606660', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44404440-4440-4440-4440-444044404440', 'full', true, true, true, '11111111-1111-1111-1111-111111111111'),
  ('77707770-7770-7770-7770-777077707770', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44404440-4440-4440-4440-444044404440', 'full', true, true, true, '33333333-3333-3333-3333-333333333333'),
  ('88808880-8880-8880-8880-888088808880', '10101010-1010-1010-1010-101010101010', '55505550-5550-5550-5550-555055505550', 'full', true, true, true, '55555555-5555-5555-5555-555555555555')
ON CONFLICT (id) DO NOTHING;

-- Create upcoming visits
INSERT INTO visits (id, patient_id, clinician_id, visit_type, scheduled_start, scheduled_end, status)
VALUES
  ('99909990-9990-9990-9990-999099909990', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11101110-1110-1110-1110-111011101110', 'Skilled Nursing', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'scheduled'),
  ('aaaa0aa0-aa00-aa00-aa00-aaa0aaa0aaa0', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11101110-1110-1110-1110-111011101110', 'Skilled Nursing', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'scheduled'),
  ('bbbb0bb0-bb00-bb00-bb00-bbb0bbb0bbb0', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22202220-2220-2220-2220-222022202220', 'Wound Care', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', 'scheduled'),
  ('cccc0cc0-cc00-cc00-cc00-ccc0ccc0ccc0', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '33303330-3330-3330-3330-333033303330', 'Physical Therapy', NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days' + INTERVAL '1 hour', 'scheduled'),
  ('dddd0dd0-dd00-dd00-dd00-ddd0ddd0ddd0', '10101010-1010-1010-1010-101010101010', '11101110-1110-1110-1110-111011101110', 'Skilled Nursing', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '1 hour', 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- Create past visits with documentation
INSERT INTO visits (id, patient_id, clinician_id, visit_type, scheduled_start, scheduled_end, actual_start, actual_end, status)
VALUES
  ('eeee0ee0-ee00-ee00-ee00-eee0eee0eee0', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11101110-1110-1110-1110-111011101110', 'Skilled Nursing', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 'completed'),
  ('ffff0ff0-ff00-ff00-ff00-fff0fff0fff0', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11101110-1110-1110-1110-111011101110', 'Skilled Nursing', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 hour', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 hour', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Create visit documentation with vital signs
INSERT INTO visit_documentation (id, visit_id, vital_signs, assessments, interventions, clinician_notes, patient_response, created_by)
VALUES
  (
    '0000e000-e000-e000-e000-000e000e000e',
    'eeee0ee0-ee00-ee00-ee00-eee0eee0eee0',
    '{"heart_rate": 78, "blood_pressure_systolic": 128, "blood_pressure_diastolic": 82, "oxygen_saturation": 96, "temperature": 98.6, "respiratory_rate": 16}'::jsonb,
    '["Patient alert and oriented", "Skin warm and dry", "Lungs clear bilaterally"]'::jsonb,
    '["Medication administration", "Vital signs monitoring", "Patient education"]'::jsonb,
    'Patient doing well. Vital signs stable. Continues on current medication regimen.',
    'Patient reports feeling better. No complaints of pain or discomfort.',
    '66666666-6666-6666-6666-666666666666'
  ),
  (
    '1111f111-f111-f111-f111-111f111f111f',
    'ffff0ff0-ff00-ff00-ff00-fff0fff0fff0',
    '{"heart_rate": 82, "blood_pressure_systolic": 135, "blood_pressure_diastolic": 88, "oxygen_saturation": 94, "temperature": 98.4, "respiratory_rate": 18}'::jsonb,
    '["Blood glucose within target range", "Patient ambulating independently", "No signs of infection"]'::jsonb,
    '["Blood glucose monitoring", "Insulin administration", "Diabetic foot care"]'::jsonb,
    'Blood sugar levels well controlled. Patient demonstrates good understanding of diabetes management.',
    'Patient compliant with medication and diet. Reports checking blood sugar regularly.',
    '66666666-6666-6666-6666-666666666666'
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample messages
INSERT INTO messages (id, sender_id, recipient_id, subject, body, is_read)
VALUES
  ('2222g222-g222-g222-g222-222g222g222g', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Upcoming Visit Reminder', 'This is a reminder about your scheduled visit tomorrow at 10:00 AM. Please have your medication list ready.', false),
  ('3333h333-h333-h333-h333-333h333h333h', '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'Wound Care Follow-up', 'Your wound is healing nicely. Please continue with the current dressing changes as instructed.', false),
  ('4444i444-i444-i444-i444-444i444i444i', '99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 'Question about medication', 'My father is experiencing some dizziness. Should we be concerned about his blood pressure medication?', true)
ON CONFLICT (id) DO NOTHING;

-- Create sample care plans
INSERT INTO care_plans (id, patient_id, title, description, status, start_date, created_by)
VALUES
  ('5555j555-j555-j555-j555-555j555j555j', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Cardiac Care Management', 'Comprehensive care plan for managing congestive heart failure including medication management, dietary modifications, and activity monitoring.', 'active', '2024-01-15', '66666666-6666-6666-6666-666666666666'),
  ('6666k666-k666-k666-k666-666k666k666k', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Diabetes Management', 'Care plan focused on blood glucose control, medication adherence, and prevention of complications.', 'active', '2024-02-20', '66666666-6666-6666-6666-666666666666'),
  ('7777l777-l777-l777-l777-777l777l777l', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'COPD Management', 'Respiratory care plan including breathing exercises, oxygen therapy, and medication management.', 'active', '2024-03-10', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO NOTHING;

-- Create care plan goals
INSERT INTO care_plan_goals (id, care_plan_id, goal_text, target_date, status, progress_percentage)
VALUES
  ('8888m888-m888-m888-m888-888m888m888m', '5555j555-j555-j555-j555-555j555j555j', 'Maintain blood pressure below 130/80', '2025-01-15', 'in_progress', 75),
  ('9999n999-n999-n999-n999-999n999n999n', '5555j555-j555-j555-j555-555j555j555j', 'Reduce sodium intake to less than 2000mg daily', '2025-01-15', 'in_progress', 60),
  ('aaaaoaaa-oaaa-oaaa-oaaa-aaaaaaaaaaaa', '6666k666-k666-k666-k666-666k666k666k', 'Maintain HbA1c below 7%', '2025-02-20', 'in_progress', 80),
  ('bbbbpbbb-pbbb-pbbb-pbbb-bbbbbbbbbbbb', '7777l777-l777-l777-l777-777l777l777l', 'Improve oxygen saturation to above 92%', '2025-03-10', 'in_progress', 70)
ON CONFLICT (id) DO NOTHING;
