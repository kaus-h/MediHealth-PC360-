-- Fix infinite recursion in RLS policies by simplifying the patients table policy
-- and creating proper access patterns through junction tables

-- Drop all existing policies on patients table
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Patients can view own data" ON public.patients;
DROP POLICY IF EXISTS "Caregivers can view patient data" ON public.patients;
DROP POLICY IF EXISTS "Clinicians can view patient data" ON public.patients;
DROP POLICY IF EXISTS "Physicians can view patient data" ON public.patients;
DROP POLICY IF EXISTS "Users can view their patient profile" ON public.patients;

-- Create a SIMPLE policy that only checks direct ownership
-- No joins, no subqueries that reference patients table
CREATE POLICY "Patients can view their own profile"
  ON public.patients FOR SELECT
  USING (profile_id = auth.uid());

-- For INSERT/UPDATE/DELETE, only the patient themselves can modify
CREATE POLICY "Patients can update their own profile"
  ON public.patients FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Patients can insert their own profile"
  ON public.patients FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Now create a VIEW that caregivers and clinicians can use to access patient data
-- This view will handle the access control logic
CREATE OR REPLACE VIEW accessible_patients AS
SELECT DISTINCT
  p.*,
  CASE
    WHEN p.profile_id = auth.uid() THEN 'owner'
    WHEN EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = p.id
      AND c.profile_id = auth.uid()
      AND pc.revoked_at IS NULL
    ) THEN 'caregiver'
    WHEN EXISTS (
      SELECT 1 FROM patient_clinicians pcl
      JOIN clinicians cl ON cl.id = pcl.clinician_id
      WHERE pcl.patient_id = p.id
      AND cl.profile_id = auth.uid()
      AND pcl.revoked_at IS NULL
    ) THEN 'clinician'
    WHEN EXISTS (
      SELECT 1 FROM patient_physicians pp
      JOIN physicians ph ON ph.id = pp.physician_id
      WHERE pp.patient_id = p.id
      AND ph.profile_id = auth.uid()
    ) THEN 'physician'
    ELSE NULL
  END as access_type
FROM patients p
WHERE 
  p.profile_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM patient_caregivers pc
    JOIN caregivers c ON c.id = pc.caregiver_id
    WHERE pc.patient_id = p.id
    AND c.profile_id = auth.uid()
    AND pc.revoked_at IS NULL
  )
  OR EXISTS (
    SELECT 1 FROM patient_clinicians pcl
    JOIN clinicians cl ON cl.id = pcl.clinician_id
    WHERE pcl.patient_id = p.id
    AND cl.profile_id = auth.uid()
    AND pcl.revoked_at IS NULL
  )
  OR EXISTS (
    SELECT 1 FROM patient_physicians pp
    JOIN physicians ph ON ph.id = pp.physician_id
    WHERE pp.patient_id = p.id
    AND ph.profile_id = auth.uid()
  );

-- Grant access to the view
GRANT SELECT ON accessible_patients TO authenticated;

-- Fix messages table policies to avoid recursion
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can view messages they sent"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "Users can view messages they received"
  ON public.messages FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their sent messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());
