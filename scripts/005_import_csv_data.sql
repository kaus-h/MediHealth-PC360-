-- Import CSV patient data and assign to providers
-- This script creates clinicians from the unique doctors in the CSV and assigns patients to them

-- First, create clinicians from unique doctors in the dataset
-- We'll create profiles for each doctor first
INSERT INTO profiles (id, first_name, last_name, email, role, phone, created_at, updated_at)
VALUES
  -- Extract unique doctors and create profiles
  (gen_random_uuid(), 'Matthew', 'Smith', 'matthew.smith@healthcare.com', 'clinician', '555-0101', NOW(), NOW()),
  (gen_random_uuid(), 'Samantha', 'Davies', 'samantha.davies@healthcare.com', 'clinician', '555-0102', NOW(), NOW()),
  (gen_random_uuid(), 'Tiffany', 'Mitchell', 'tiffany.mitchell@healthcare.com', 'clinician', '555-0103', NOW(), NOW()),
  (gen_random_uuid(), 'Kevin', 'Wells', 'kevin.wells@healthcare.com', 'clinician', '555-0104', NOW(), NOW()),
  (gen_random_uuid(), 'Kathleen', 'Hanna', 'kathleen.hanna@healthcare.com', 'clinician', '555-0105', NOW(), NOW()),
  (gen_random_uuid(), 'Taylor', 'Newton', 'taylor.newton@healthcare.com', 'clinician', '555-0106', NOW(), NOW()),
  (gen_random_uuid(), 'Kelly', 'Olson', 'kelly.olson@healthcare.com', 'clinician', '555-0107', NOW(), NOW()),
  (gen_random_uuid(), 'Suzanne', 'Thomas', 'suzanne.thomas@healthcare.com', 'clinician', '555-0108', NOW(), NOW()),
  (gen_random_uuid(), 'Daniel', 'Ferguson', 'daniel.ferguson@healthcare.com', 'clinician', '555-0109', NOW(), NOW()),
  (gen_random_uuid(), 'Heather', 'Day', 'heather.day@healthcare.com', 'clinician', '555-0110', NOW(), NOW()),
  (gen_random_uuid(), 'John', 'Duncan', 'john.duncan@healthcare.com', 'clinician', '555-0111', NOW(), NOW()),
  (gen_random_uuid(), 'Douglas', 'Mayo', 'douglas.mayo@healthcare.com', 'clinician', '555-0112', NOW(), NOW()),
  (gen_random_uuid(), 'Kenneth', 'Fletcher', 'kenneth.fletcher@healthcare.com', 'clinician', '555-0113', NOW(), NOW()),
  (gen_random_uuid(), 'Theresa', 'Freeman', 'theresa.freeman@healthcare.com', 'clinician', '555-0114', NOW(), NOW()),
  (gen_random_uuid(), 'Roberta', 'Stewart', 'roberta.stewart@healthcare.com', 'clinician', '555-0115', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Create clinician records linked to profiles
INSERT INTO clinicians (id, profile_id, license_type, license_number, specialization, agency_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  'RN',
  'LIC-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
  CASE 
    WHEN p.last_name IN ('Smith', 'Davies', 'Mitchell') THEN 'General Practice'
    WHEN p.last_name IN ('Wells', 'Hanna', 'Newton') THEN 'Cardiology'
    WHEN p.last_name IN ('Olson', 'Thomas', 'Ferguson') THEN 'Endocrinology'
    ELSE 'Internal Medicine'
  END,
  (SELECT id FROM agencies LIMIT 1),
  true,
  NOW(),
  NOW()
FROM profiles p
WHERE p.role = 'clinician' 
  AND p.email LIKE '%@healthcare.com'
  AND NOT EXISTS (SELECT 1 FROM clinicians c WHERE c.profile_id = p.id);

-- Now import patients from CSV data
-- Create profiles for patients
INSERT INTO profiles (id, first_name, last_name, email, role, date_of_birth, phone, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Bobby', 'Jackson', 'bobby.jackson@email.com', 'patient', '1994-01-01', '555-1001', NOW(), NOW()),
  (gen_random_uuid(), 'Leslie', 'Terry', 'leslie.terry@email.com', 'patient', '1962-01-01', '555-1002', NOW(), NOW()),
  (gen_random_uuid(), 'Danny', 'Smith', 'danny.smith@email.com', 'patient', '1948-01-01', '555-1003', NOW(), NOW()),
  (gen_random_uuid(), 'Andrew', 'Watts', 'andrew.watts@email.com', 'patient', '1996-01-01', '555-1004', NOW(), NOW()),
  (gen_random_uuid(), 'Adrienne', 'Bell', 'adrienne.bell@email.com', 'patient', '1981-01-01', '555-1005', NOW(), NOW()),
  (gen_random_uuid(), 'Emily', 'Johnson', 'emily.johnson@email.com', 'patient', '1988-01-01', '555-1006', NOW(), NOW()),
  (gen_random_uuid(), 'Edward', 'Edwards', 'edward.edwards@email.com', 'patient', '2003-01-01', '555-1007', NOW(), NOW()),
  (gen_random_uuid(), 'Christina', 'Martinez', 'christina.martinez@email.com', 'patient', '2004-01-01', '555-1008', NOW(), NOW()),
  (gen_random_uuid(), 'Jasmine', 'Aguilar', 'jasmine.aguilar@email.com', 'patient', '1942-01-01', '555-1009', NOW(), NOW()),
  (gen_random_uuid(), 'Christopher', 'Berg', 'christopher.berg@email.com', 'patient', '1966-01-01', '555-1010', NOW(), NOW()),
  (gen_random_uuid(), 'Michelle', 'Daniels', 'michelle.daniels@email.com', 'patient', '1952-01-01', '555-1011', NOW(), NOW()),
  (gen_random_uuid(), 'Aaron', 'Martinez', 'aaron.martinez@email.com', 'patient', '1986-01-01', '555-1012', NOW(), NOW()),
  (gen_random_uuid(), 'Connor', 'Hansen', 'connor.hansen@email.com', 'patient', '1949-01-01', '555-1013', NOW(), NOW()),
  (gen_random_uuid(), 'Robert', 'Bauer', 'robert.bauer@email.com', 'patient', '1956-01-01', '555-1014', NOW(), NOW()),
  (gen_random_uuid(), 'Brooke', 'Brady', 'brooke.brady@email.com', 'patient', '1980-01-01', '555-1015', NOW(), NOW()),
  (gen_random_uuid(), 'Natalie', 'Gamble', 'natalie.gamble@email.com', 'patient', '1978-01-01', '555-1016', NOW(), NOW()),
  (gen_random_uuid(), 'Haley', 'Perkins', 'haley.perkins@email.com', 'patient', '1961-01-01', '555-1017', NOW(), NOW()),
  (gen_random_uuid(), 'Jamie', 'Campbell', 'jamie.campbell@email.com', 'patient', '1986-01-01', '555-1018', NOW(), NOW()),
  (gen_random_uuid(), 'Luke', 'Burgess', 'luke.burgess@email.com', 'patient', '1990-01-01', '555-1019', NOW(), NOW()),
  (gen_random_uuid(), 'Daniel', 'Schmidt', 'daniel.schmidt@email.com', 'patient', '1961-01-01', '555-1020', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Create patient records with medical information
INSERT INTO patients (
  id, 
  profile_id, 
  medical_record_number, 
  primary_diagnosis, 
  admission_date, 
  status,
  insurance_provider,
  insurance_policy_number,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relationship,
  created_at, 
  updated_at
)
SELECT 
  gen_random_uuid(),
  p.id,
  'MRN-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  CASE p.last_name
    WHEN 'Jackson' THEN 'Cancer'
    WHEN 'Terry' THEN 'Obesity'
    WHEN 'Smith' THEN 'Obesity'
    WHEN 'Watts' THEN 'Diabetes'
    WHEN 'Bell' THEN 'Cancer'
    WHEN 'Johnson' THEN 'Asthma'
    WHEN 'Edwards' THEN 'Diabetes'
    WHEN 'Martinez' THEN 'Cancer'
    WHEN 'Aguilar' THEN 'Asthma'
    WHEN 'Berg' THEN 'Cancer'
    WHEN 'Daniels' THEN 'Cancer'
    WHEN 'Hansen' THEN 'Diabetes'
    WHEN 'Bauer' THEN 'Asthma'
    WHEN 'Brady' THEN 'Cancer'
    WHEN 'Gamble' THEN 'Obesity'
    WHEN 'Perkins' THEN 'Arthritis'
    WHEN 'Campbell' THEN 'Obesity'
    WHEN 'Burgess' THEN 'Hypertension'
    WHEN 'Schmidt' THEN 'Asthma'
    ELSE 'Hypertension'
  END,
  CASE p.last_name
    WHEN 'Jackson' THEN '2024-01-31'
    WHEN 'Terry' THEN '2019-08-20'
    WHEN 'Smith' THEN '2022-09-22'
    WHEN 'Watts' THEN '2020-11-18'
    WHEN 'Bell' THEN '2022-09-19'
    WHEN 'Johnson' THEN '2023-12-20'
    WHEN 'Edwards' THEN '2020-11-03'
    WHEN 'Martinez' THEN '2021-12-28'
    WHEN 'Aguilar' THEN '2020-07-01'
    WHEN 'Berg' THEN '2021-05-23'
    WHEN 'Daniels' THEN '2020-04-19'
    WHEN 'Hansen' THEN '2019-12-12'
    WHEN 'Bauer' THEN '2020-05-22'
    WHEN 'Brady' THEN '2021-10-08'
    WHEN 'Gamble' THEN '2023-01-01'
    WHEN 'Perkins' THEN '2020-06-23'
    WHEN 'Campbell' THEN '2020-03-08'
    WHEN 'Burgess' THEN '2021-03-04'
    WHEN 'Schmidt' THEN '2022-11-15'
    ELSE '2023-01-01'
  END::date,
  'active',
  CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'Blue Cross'
    WHEN 1 THEN 'Medicare'
    WHEN 2 THEN 'Aetna'
    WHEN 3 THEN 'UnitedHealthcare'
    ELSE 'Cigna'
  END,
  'POL-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 8, '0'),
  'Emergency Contact',
  '555-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  'Spouse',
  NOW(),
  NOW()
FROM profiles p
WHERE p.role = 'patient' 
  AND p.email LIKE '%@email.com'
  AND NOT EXISTS (SELECT 1 FROM patients pt WHERE pt.profile_id = p.id);

-- Assign patients to clinicians by creating visits
INSERT INTO visits (
  id,
  patient_id,
  clinician_id,
  visit_type,
  scheduled_start,
  scheduled_end,
  status,
  visit_notes,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  pt.id,
  (SELECT c.id FROM clinicians c ORDER BY RANDOM() LIMIT 1),
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'Initial Assessment'
    WHEN 1 THEN 'Follow-up'
    WHEN 2 THEN 'Skilled Nursing'
    ELSE 'Physical Therapy'
  END,
  NOW() + (RANDOM() * 30 || ' days')::INTERVAL,
  NOW() + (RANDOM() * 30 || ' days')::INTERVAL + '1 hour'::INTERVAL,
  'scheduled',
  'Imported from CSV data - ' || 
  CASE pt.primary_diagnosis
    WHEN 'Cancer' THEN 'Oncology care management'
    WHEN 'Diabetes' THEN 'Blood sugar monitoring and education'
    WHEN 'Hypertension' THEN 'Blood pressure management'
    WHEN 'Asthma' THEN 'Respiratory assessment'
    WHEN 'Arthritis' THEN 'Pain management and mobility'
    WHEN 'Obesity' THEN 'Weight management counseling'
    ELSE 'General health assessment'
  END,
  NOW(),
  NOW()
FROM patients pt
WHERE pt.profile_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@email.com'
)
LIMIT 20;
