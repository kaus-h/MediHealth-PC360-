-- Sample data for development and testing
-- This script creates comprehensive sample data for the healthcare portal

-- Insert sample agencies
insert into public.agencies (id, name, address, city, state, zip_code, phone, email, license_number)
values 
  ('a1111111-1111-1111-1111-111111111111', 'HomeCare Plus', '123 Main St', 'Springfield', 'IL', '62701', '555-0100', 'info@homecareplus.com', 'HHA-12345'),
  ('a2222222-2222-2222-2222-222222222222', 'Comfort Home Health', '456 Oak Ave', 'Chicago', 'IL', '60601', '555-0200', 'contact@comforthh.com', 'HHA-67890')
on conflict (id) do nothing;

-- Note: You'll need to create these users in Supabase Auth first, then update the IDs below
-- For testing, you can use the Supabase dashboard to create users with these emails:
-- Patients: john.smith@example.com, mary.johnson@example.com, robert.williams@example.com, patricia.brown@example.com, james.davis@example.com
-- Clinicians: nurse.sarah@homecareplus.com, pt.michael@homecareplus.com, ot.jennifer@comforthh.com
-- Caregivers: daughter.emily@example.com, son.david@example.com

-- Sample profiles (replace UUIDs with actual auth.users IDs after creating them)
insert into public.profiles (id, email, first_name, last_name, phone, role, date_of_birth, address, city, state, zip_code)
values
  -- Patients
  ('11111111-1111-1111-1111-111111111111', 'john.smith@example.com', 'John', 'Smith', '555-1001', 'patient', '1945-03-15', '789 Elm St', 'Springfield', 'IL', '62702'),
  ('22222222-2222-2222-2222-222222222222', 'mary.johnson@example.com', 'Mary', 'Johnson', '555-1002', 'patient', '1950-07-22', '321 Pine St', 'Springfield', 'IL', '62703'),
  ('33333333-3333-3333-3333-333333333333', 'robert.williams@example.com', 'Robert', 'Williams', '555-1003', 'patient', '1938-11-08', '654 Maple Ave', 'Chicago', 'IL', '60602'),
  ('44444444-4444-4444-4444-444444444444', 'patricia.brown@example.com', 'Patricia', 'Brown', '555-1004', 'patient', '1952-05-30', '987 Cedar Ln', 'Springfield', 'IL', '62704'),
  ('55555555-5555-5555-5555-555555555555', 'james.davis@example.com', 'James', 'Davis', '555-1005', 'patient', '1948-09-12', '147 Birch Rd', 'Chicago', 'IL', '60603'),
  -- Clinicians
  ('c1111111-1111-1111-1111-111111111111', 'nurse.sarah@homecareplus.com', 'Sarah', 'Anderson', '555-2001', 'clinician', '1985-04-18', '222 Professional Dr', 'Springfield', 'IL', '62701'),
  ('c2222222-2222-2222-2222-222222222222', 'pt.michael@homecareplus.com', 'Michael', 'Thompson', '555-2002', 'clinician', '1982-08-25', '333 Healthcare Blvd', 'Springfield', 'IL', '62701'),
  ('c3333333-3333-3333-3333-333333333333', 'ot.jennifer@comforthh.com', 'Jennifer', 'Martinez', '555-2003', 'clinician', '1988-12-10', '444 Medical Plaza', 'Chicago', 'IL', '60601'),
  -- Caregivers
  ('g1111111-1111-1111-1111-111111111111', 'daughter.emily@example.com', 'Emily', 'Smith', '555-3001', 'caregiver', '1975-06-20', '789 Elm St', 'Springfield', 'IL', '62702'),
  ('g2222222-2222-2222-2222-222222222222', 'son.david@example.com', 'David', 'Johnson', '555-3002', 'caregiver', '1978-02-14', '321 Pine St', 'Springfield', 'IL', '62703')
on conflict (id) do nothing;

-- Sample patients
insert into public.patients (id, profile_id, medical_record_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, insurance_provider, insurance_policy_number, primary_diagnosis, admission_date, status)
values
  ('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'MRN-001', 'Emily Smith', '555-3001', 'Daughter', 'Medicare Part A', 'MED-12345', 'Post-surgical recovery - Hip replacement', '2025-09-15', 'active'),
  ('p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'MRN-002', 'David Johnson', '555-3002', 'Son', 'Blue Cross Blue Shield', 'BCBS-67890', 'Diabetes management and wound care', '2025-09-20', 'active'),
  ('p3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'MRN-003', 'Susan Williams', '555-4001', 'Spouse', 'Medicare Part A', 'MED-54321', 'CHF and COPD management', '2025-08-10', 'active'),
  ('p4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'MRN-004', 'Thomas Brown', '555-4002', 'Spouse', 'Aetna', 'AET-11111', 'Stroke rehabilitation', '2025-09-25', 'active'),
  ('p5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'MRN-005', 'Linda Davis', '555-4003', 'Spouse', 'United Healthcare', 'UHC-22222', 'Post-hospitalization weakness', '2025-09-28', 'active')
on conflict (id) do nothing;

-- Sample clinicians
insert into public.clinicians (id, profile_id, license_number, license_type, specialization, agency_id, is_active)
values
  ('cl111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'RN-123456', 'Registered Nurse', 'Home Health Nursing', 'a1111111-1111-1111-1111-111111111111', true),
  ('cl222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'PT-789012', 'Physical Therapist', 'Orthopedic PT', 'a1111111-1111-1111-1111-111111111111', true),
  ('cl333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'OT-345678', 'Occupational Therapist', 'Geriatric OT', 'a2222222-2222-2222-2222-222222222222', true)
on conflict (id) do nothing;

-- Sample caregivers
insert into public.caregivers (id, profile_id, relationship_to_patient, is_mpoa)
values
  ('cg111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 'Daughter', true),
  ('cg222222-2222-2222-2222-222222222222', 'g2222222-2222-2222-2222-222222222222', 'Son', true)
on conflict (id) do nothing;

-- Sample patient-caregiver relationships
insert into public.patient_caregivers (patient_id, caregiver_id, access_level, can_view_records, can_message, can_schedule, granted_by)
values
  ('p1111111-1111-1111-1111-111111111111', 'cg111111-1111-1111-1111-111111111111', 'full', true, true, true, '11111111-1111-1111-1111-111111111111'),
  ('p2222222-2222-2222-2222-222222222222', 'cg222222-2222-2222-2222-222222222222', 'full', true, true, true, '22222222-2222-2222-2222-222222222222')
on conflict (patient_id, caregiver_id) do nothing;

-- Sample visits (mix of past, current, and future)
insert into public.visits (id, patient_id, clinician_id, visit_type, scheduled_start, scheduled_end, actual_start, actual_end, status, visit_notes)
values
  -- Completed visits
  ('v1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'cl111111-1111-1111-1111-111111111111', 'nursing', '2025-09-30 10:00:00+00', '2025-09-30 11:00:00+00', '2025-09-30 10:05:00+00', '2025-09-30 11:10:00+00', 'completed', 'Initial assessment completed. Patient recovering well from hip surgery. Vital signs stable.'),
  ('v2222222-2222-2222-2222-222222222222', 'p1111111-1111-1111-1111-111111111111', 'cl222222-2222-2222-2222-222222222222', 'physical_therapy', '2025-10-01 14:00:00+00', '2025-10-01 15:00:00+00', '2025-10-01 14:00:00+00', '2025-10-01 15:05:00+00', 'completed', 'PT session focused on hip mobility and strength. Patient showing good progress.'),
  ('v3333333-3333-3333-3333-333333333333', 'p2222222-2222-2222-2222-222222222222', 'cl111111-1111-1111-1111-111111111111', 'nursing', '2025-10-01 09:00:00+00', '2025-10-01 10:00:00+00', '2025-10-01 09:10:00+00', '2025-10-01 10:15:00+00', 'completed', 'Wound care performed. Blood glucose monitoring. Patient education on diabetes management.'),
  -- Upcoming visits
  ('v4444444-4444-4444-4444-444444444444', 'p1111111-1111-1111-1111-111111111111', 'cl111111-1111-1111-1111-111111111111', 'nursing', '2025-10-03 10:00:00+00', '2025-10-03 11:00:00+00', null, null, 'scheduled', null),
  ('v5555555-5555-5555-5555-555555555555', 'p2222222-2222-2222-2222-222222222222', 'cl111111-1111-1111-1111-111111111111', 'nursing', '2025-10-04 09:00:00+00', '2025-10-04 10:00:00+00', null, null, 'scheduled', null),
  ('v6666666-6666-6666-6666-666666666666', 'p3333333-3333-3333-3333-333333333333', 'cl111111-1111-1111-1111-111111111111', 'nursing', '2025-10-04 11:00:00+00', '2025-10-04 12:00:00+00', null, null, 'scheduled', null),
  ('v7777777-7777-7777-7777-777777777777', 'p1111111-1111-1111-1111-111111111111', 'cl222222-2222-2222-2222-222222222222', 'physical_therapy', '2025-10-05 14:00:00+00', '2025-10-05 15:00:00+00', null, null, 'scheduled', null)
on conflict (id) do nothing;

-- Sample visit documentation with vital signs
insert into public.visit_documentation (visit_id, vital_signs, assessments, interventions, patient_response, clinician_notes, created_by)
values
  ('v1111111-1111-1111-1111-111111111111', 
   '{"blood_pressure": "128/76", "heart_rate": 72, "temperature": 98.4, "respiratory_rate": 16, "oxygen_saturation": 97, "pain_level": 3}'::jsonb,
   '{"mobility": "Limited due to recent surgery", "skin_integrity": "Surgical site healing well", "mental_status": "Alert and oriented x3"}'::jsonb,
   '{"wound_care": "Dressing changed, no signs of infection", "medication_review": "All medications taken as prescribed", "patient_education": "Reviewed hip precautions"}'::jsonb,
   'Patient tolerated visit well. Expressed satisfaction with care.',
   'Continue current care plan. Patient making expected progress.',
   'c1111111-1111-1111-1111-111111111111'),
  ('v2222222-2222-2222-2222-222222222222',
   '{"blood_pressure": "130/78", "heart_rate": 75, "pain_level": 4}'::jsonb,
   '{"range_of_motion": "Hip flexion 85 degrees, improving", "strength": "3+/5 in affected leg", "gait": "Using walker with moderate assistance"}'::jsonb,
   '{"exercises": "Hip abduction, ankle pumps, seated marches", "modalities": "Ice pack post-exercise", "assistive_device": "Walker training"}'::jsonb,
   'Patient participated actively. Some fatigue noted towards end of session.',
   'Good progress. Increase repetitions next visit if tolerated.',
   'c2222222-2222-2222-2222-222222222222'),
  ('v3333333-3333-3333-3333-333333333333',
   '{"blood_pressure": "142/88", "heart_rate": 82, "temperature": 98.6, "respiratory_rate": 18, "oxygen_saturation": 95, "blood_glucose": 156}'::jsonb,
   '{"wound_status": "Healing well, no drainage", "circulation": "Pedal pulses present bilaterally", "edema": "Trace bilateral lower extremities"}'::jsonb,
   '{"wound_care": "Cleaned and redressed wound", "glucose_monitoring": "Reviewed blood sugar log", "medication_management": "Insulin administration reviewed"}'::jsonb,
   'Patient demonstrates good understanding of wound care and glucose monitoring.',
   'Blood glucose slightly elevated. Discussed dietary choices with patient.',
   'c1111111-1111-1111-1111-111111111111')
on conflict (visit_id) do nothing;

-- Sample care plans
insert into public.care_plans (id, patient_id, title, description, start_date, end_date, status, created_by)
values
  ('cp111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Post-Surgical Hip Replacement Recovery', 'Comprehensive care plan for recovery following total hip replacement surgery', '2025-09-15', '2025-11-15', 'active', 'c1111111-1111-1111-1111-111111111111'),
  ('cp222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'Diabetes Management and Wound Care', 'Care plan focused on blood glucose control and wound healing', '2025-09-20', '2025-12-20', 'active', 'c1111111-1111-1111-1111-111111111111'),
  ('cp333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'CHF and COPD Management', 'Cardiac and respiratory care plan', '2025-08-10', '2026-02-10', 'active', 'c1111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

-- Sample care plan goals
insert into public.care_plan_goals (care_plan_id, goal_text, target_date, status, progress_percentage)
values
  ('cp111111-1111-1111-1111-111111111111', 'Patient will ambulate 50 feet with walker independently', '2025-10-15', 'in_progress', 60),
  ('cp111111-1111-1111-1111-111111111111', 'Patient will demonstrate proper hip precautions', '2025-10-01', 'completed', 100),
  ('cp111111-1111-1111-1111-111111111111', 'Patient will manage pain with oral medications only', '2025-10-10', 'in_progress', 75),
  ('cp222222-2222-2222-2222-222222222222', 'Patient will maintain blood glucose between 80-180 mg/dL', '2025-11-20', 'in_progress', 50),
  ('cp222222-2222-2222-2222-222222222222', 'Wound will show signs of healing with no infection', '2025-10-20', 'in_progress', 70),
  ('cp333333-3333-3333-3333-333333333333', 'Patient will maintain oxygen saturation above 92%', '2025-10-10', 'in_progress', 80),
  ('cp333333-3333-3333-3333-333333333333', 'Patient will demonstrate proper use of inhalers', '2025-09-10', 'completed', 100)
on conflict do nothing;

-- Sample messages
insert into public.messages (sender_id, recipient_id, subject, body, is_read, patient_context_id)
values
  ('11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Question about medication', 'Hi Sarah, I have a question about the timing of my pain medication. Should I take it before or after meals?', false, 'p1111111-1111-1111-1111-111111111111'),
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Re: Question about medication', 'Hi John, you can take your pain medication with food to help prevent stomach upset. Take it about 30 minutes before meals if possible.', true, 'p1111111-1111-1111-1111-111111111111'),
  ('g1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Dad''s progress update request', 'Hi Sarah, I wanted to check in on how my dad is doing with his physical therapy. Is he making good progress?', false, 'p1111111-1111-1111-1111-111111111111'),
  ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Great progress today!', 'John, you did excellent work in today''s PT session. Keep up the good work with your home exercises!', false, 'p1111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Blood sugar readings', 'My blood sugar has been running a bit high in the mornings. Should I be concerned?', false, 'p2222222-2222-2222-2222-222222222222')
on conflict do nothing;

-- Sample notifications
insert into public.notifications (user_id, title, message, type, priority, is_read, action_url)
values
  ('11111111-1111-1111-1111-111111111111', 'Upcoming Visit Reminder', 'You have a nursing visit scheduled for tomorrow at 10:00 AM with Sarah Anderson', 'visit_reminder', 'high', false, '/dashboard/visits'),
  ('11111111-1111-1111-1111-111111111111', 'New Message', 'You have a new message from Michael Thompson', 'message', 'normal', false, '/dashboard/messages'),
  ('22222222-2222-2222-2222-222222222222', 'Visit Scheduled', 'Your nursing visit has been scheduled for October 4th at 9:00 AM', 'visit_update', 'normal', true, '/dashboard/visits'),
  ('g1111111-1111-1111-1111-111111111111', 'Care Plan Updated', 'John Smith''s care plan has been updated', 'care_plan_update', 'normal', false, '/dashboard/care-plans'),
  ('c1111111-1111-1111-1111-111111111111', 'New Patient Message', 'You have a new message from John Smith', 'message', 'normal', false, '/dashboard/messages')
on conflict do nothing;
