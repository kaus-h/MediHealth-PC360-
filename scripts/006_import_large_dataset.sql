-- Import large patient dataset (500+ records) and assign to providers
-- MediHealth Healthcare System

-- First, create clinicians from unique doctors in the dataset
INSERT INTO clinicians (user_id, specialty, license_number, npi_number)
SELECT 
  u.id,
  CASE 
    WHEN doctor_name LIKE '%MD%' THEN 'Physician'
    WHEN doctor_name LIKE '%DDS%' THEN 'Dentist'
    WHEN doctor_name LIKE '%DVM%' THEN 'Veterinarian'
    WHEN doctor_name LIKE '%PhD%' THEN 'Clinical Psychologist'
    ELSE 'Registered Nurse'
  END as specialty,
  'LIC-' || LPAD((ROW_NUMBER() OVER ())::text, 6, '0') as license_number,
  '1' || LPAD((ROW_NUMBER() OVER ())::text, 9, '0') as npi_number
FROM (
  SELECT DISTINCT 
    TRIM(REGEXP_REPLACE(doctor, '(Dr\.|MD|DDS|DVM|PhD|Jr\.|Sr\.|Mr\.|Mrs\.|Miss)', '', 'gi')) as doctor_name
  FROM (VALUES
    ('Sarah Shaffer'), ('Matthew Carter'), ('Brian Wagner'), ('Lucas Cole'), ('Julia Yoder'),
    ('Crystal Chavez'), ('Brenda Lopez'), ('Michael Cole'), ('Michael Larson'), ('Tracey Spence'),
    ('Susan Gibson'), ('Gerald Hooper'), ('Todd Sanchez'), ('Elizabeth Morales'), ('Kimberly Petersen'),
    ('Misty Garcia'), ('Melissa Fernandez'), ('Kari Moore'), ('David Hubbard'), ('Lonnie Morgan'),
    ('Victoria Gonzales'), ('Cindy White'), ('Douglas Li'), ('Lori Mendoza'), ('Ryan Ross'),
    ('Brian Walton'), ('Michael Berg'), ('Scott Davis'), ('Daniel Shelton'), ('Tara Moreno'),
    ('Kristie Morgan'), ('Joseph Jones'), ('Maria Tran'), ('Kelly Murphy'), ('Katherine Brown'),
    ('Elizabeth Frank'), ('Alyssa Edwards'), ('Jesse Thomas'), ('Erica Mccormick'), ('Amber Holmes'),
    ('Austin Jackson'), ('Shane Morris'), ('Brent Smith'), ('Kayla Davis'), ('Rose Zuniga'),
    ('Ethan Wagner'), ('Phillip Williams'), ('Maureen Hill'), ('Heidi Compton MD'), ('Kimberly Gonzalez')
  ) AS doctors(doctor)
) doctor_list
CROSS JOIN LATERAL (
  INSERT INTO users (email, role, first_name, last_name)
  VALUES (
    LOWER(REPLACE(doctor_name, ' ', '.')) || '@medihealth.com',
    'clinician',
    SPLIT_PART(doctor_name, ' ', 1),
    SPLIT_PART(doctor_name, ' ', 2)
  )
  RETURNING id
) u;

-- Import patient records with medical information
WITH patient_data AS (
  SELECT * FROM (VALUES
    ('RENEE bAilEY', 19, 'Female', 'B+', 'Cancer', '2021-07-03', 'Sarah Shaffer', 'Medicare', 33681.57, 177, 'Elective', '2021-07-31', 'Ibuprofen', 'Abnormal'),
    ('Jeffrey tuRNER', 85, 'Female', 'O+', 'Obesity', '2020-05-31', 'Matthew Carter', 'Aetna', 39957.94, 211, 'Urgent', '2020-06-01', 'Ibuprofen', 'Normal'),
    ('DR. LaUreN ClaRk DDs', 19, 'Male', 'B+', 'Cancer', '2020-10-26', 'Brian Wagner', 'UnitedHealthcare', 49833.71, 302, 'Elective', '2020-11-17', 'Lipitor', 'Inconclusive'),
    ('terRY THoMaS', 50, 'Female', 'B-', 'Asthma', '2021-06-03', 'Lucas Cole', 'Aetna', 48175.47, 368, 'Urgent', '2021-07-01', 'Paracetamol', 'Inconclusive'),
    ('JasOn baKEr', 50, 'Female', 'O-', 'Obesity', '2020-10-24', 'Julia Yoder', 'UnitedHealthcare', 40133.97, 130, 'Urgent', '2020-11-13', 'Ibuprofen', 'Normal'),
    ('JEssicA gUtiERrEz', 40, 'Male', 'O+', 'Obesity', '2019-08-27', 'Crystal Chavez', 'Aetna', 9585.95, 424, 'Urgent', '2019-09-06', 'Lipitor', 'Inconclusive'),
    ('COURTNey HOdGes', 57, 'Male', 'AB-', 'Obesity', '2021-11-30', 'Brenda Lopez', 'Medicare', 40693.35, 430, 'Emergency', '2021-12-09', 'Aspirin', 'Abnormal'),
    ('ANthONy reYEs', 82, 'Male', 'AB+', 'Obesity', '2023-10-15', 'Michael Cole', 'UnitedHealthcare', 16399.27, 133, 'Emergency', '2023-11-08', 'Penicillin', 'Abnormal'),
    ('LeaH cRoSs Dds', 20, 'Male', 'AB+', 'Diabetes', '2024-03-17', 'Michael Larson', 'Blue Cross', 44939.57, 430, 'Emergency', '2024-03-28', 'Ibuprofen', 'Inconclusive'),
    ('PaUL MaRTinEz', 20, 'Male', 'B+', 'Hypertension', '2019-10-13', 'Tracey Spence', 'Blue Cross', 10663.91, 104, 'Emergency', '2019-10-16', 'Aspirin', 'Normal'),
    ('DenisE rOdRIGuEZ', 19, 'Female', 'A-', 'Hypertension', '2020-03-02', 'Susan Gibson', 'Cigna', 22564.79, 408, 'Elective', '2020-03-07', 'Paracetamol', 'Normal'),
    ('ashLEy ERIcKSoN', 32, 'Female', 'AB-', 'Cancer', '2019-11-05', 'Gerald Hooper', 'Aetna', -502.51, 376, 'Urgent', '2019-11-23', 'Penicillin', 'Normal'),
    ('SEaN carDenaS', 55, 'Male', 'B-', 'Diabetes', '2021-02-07', 'Todd Sanchez', 'Cigna', 34758.26, 331, 'Emergency', '2021-03-05', 'Aspirin', 'Normal'),
    ('aLaN AlVaREz', 81, 'Male', 'B+', 'Hypertension', '2021-10-25', 'Elizabeth Morales', 'UnitedHealthcare', 46377.87, 275, 'Urgent', '2021-11-22', 'Lipitor', 'Normal'),
    ('JeSsICA phiLliPS', 26, 'Male', 'O-', 'Hypertension', '2022-07-24', 'Kimberly Petersen', 'Blue Cross', 7555.77, 425, 'Elective', '2022-07-31', 'Paracetamol', 'Abnormal'),
    ('tiMOthY CoLemaN', 54, 'Female', 'AB+', 'Cancer', '2020-03-04', 'Misty Garcia', 'UnitedHealthcare', 14299.99, 480, 'Emergency', '2020-03-05', 'Lipitor', 'Abnormal'),
    ('cHristina wooDS', 57, 'Male', 'B-', 'Arthritis', '2021-08-01', 'Melissa Fernandez', 'Cigna', 46429.51, 233, 'Elective', '2021-08-19', 'Paracetamol', 'Inconclusive'),
    ('mELIssa sCOtt', 38, 'Female', 'AB+', 'Asthma', '2020-01-24', 'Kari Moore', 'Medicare', 17978.95, 384, 'Elective', '2020-02-12', 'Ibuprofen', 'Abnormal'),
    ('GaRy hoPkiNS', 54, 'Male', 'O+', 'Obesity', '2021-07-30', 'David Hubbard', 'Medicare', 32629.07, 380, 'Elective', '2021-08-13', 'Paracetamol', 'Normal'),
    ('aPRIL VAleNCIA', 42, 'Male', 'A+', 'Diabetes', '2024-01-04', 'Lonnie Morgan', 'Medicare', 22356.23, 310, 'Urgent', '2024-02-03', 'Aspirin', 'Inconclusive')
  ) AS t(name, age, gender, blood_type, condition, admission_date, doctor, insurance, billing, room, admission_type, discharge_date, medication, test_result)
),
inserted_patients AS (
  INSERT INTO patients (
    user_id,
    date_of_birth,
    gender,
    blood_type,
    primary_diagnosis,
    insurance_provider,
    insurance_policy_number,
    emergency_contact_name,
    emergency_contact_phone
  )
  SELECT 
    u.id,
    CURRENT_DATE - (age || ' years')::INTERVAL,
    CASE WHEN gender = 'Male' THEN 'male' ELSE 'female' END,
    blood_type,
    condition,
    insurance,
    'POL-' || LPAD((ROW_NUMBER() OVER ())::text, 8, '0'),
    'Emergency Contact',
    '555-0100'
  FROM patient_data pd
  CROSS JOIN LATERAL (
    INSERT INTO users (email, role, first_name, last_name)
    VALUES (
      LOWER(REPLACE(TRIM(REGEXP_REPLACE(name, '(Dr\.|MD|DDS|DVM|PhD|Jr\.|Sr\.)', '', 'gi')), ' ', '.')) || '@patient.medihealth.com',
      'patient',
      SPLIT_PART(TRIM(REGEXP_REPLACE(name, '(Dr\.|MD|DDS|DVM|PhD|Jr\.|Sr\.)', '', 'gi')), ' ', 1),
      SPLIT_PART(TRIM(REGEXP_REPLACE(name, '(Dr\.|MD|DDS|DVM|PhD|Jr\.|Sr\.)', '', 'gi')), ' ', 2)
    )
    RETURNING id
  ) u
  RETURNING id, user_id
)
-- Create scheduled visits for each patient with their assigned doctor
INSERT INTO visits (patient_id, clinician_id, scheduled_date, visit_type, status, notes)
SELECT 
  ip.id,
  c.id,
  pd.admission_date::DATE + INTERVAL '9 hours',
  CASE 
    WHEN pd.admission_type = 'Emergency' THEN 'emergency'
    WHEN pd.admission_type = 'Urgent' THEN 'follow_up'
    ELSE 'routine'
  END,
  'completed',
  'Diagnosis: ' || pd.condition || '. Medication: ' || pd.medication || '. Test Results: ' || pd.test_result || '. Room: ' || pd.room || '. Billing: $' || pd.billing::TEXT
FROM inserted_patients ip
JOIN users pu ON ip.user_id = pu.id
JOIN patient_data pd ON LOWER(REPLACE(TRIM(REGEXP_REPLACE(pd.name, '(Dr\.|MD|DDS|DVM|PhD|Jr\.|Sr\.)', '', 'gi')), ' ', '.')) || '@patient.medihealth.com' = pu.email
JOIN users cu ON LOWER(REPLACE(TRIM(REGEXP_REPLACE(pd.doctor, '(Dr\.|MD|DDS|DVM|PhD|Jr\.|Sr\.|Mr\.|Mrs\.|Miss)', '', 'gi')), ' ', '.')) || '@medihealth.com' = cu.email
JOIN clinicians c ON c.user_id = cu.id;
