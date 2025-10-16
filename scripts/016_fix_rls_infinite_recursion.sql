-- Fix infinite recursion in RLS policies
-- The issue is that policies reference patients.id in subqueries, causing recursion
-- Solution: Use SECURITY DEFINER functions to bypass RLS in policy checks

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Caregivers can view patient data" ON public.patients;
DROP POLICY IF EXISTS "Clinicians can view patient data" ON public.patients;
DROP POLICY IF EXISTS "Clinicians can view patient data through visits" ON public.patients;
DROP POLICY IF EXISTS "Physicians can view patient data" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own data" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own data" ON public.patients;

-- Create helper functions with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.user_can_access_patient(patient_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is the patient
  IF EXISTS (
    SELECT 1 FROM patients 
    WHERE id = patient_id_param 
    AND profile_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a caregiver
  IF EXISTS (
    SELECT 1 FROM patient_caregivers pc
    JOIN caregivers c ON c.id = pc.caregiver_id
    WHERE pc.patient_id = patient_id_param
    AND c.profile_id = auth.uid()
    AND pc.revoked_at IS NULL
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a clinician (through patient_clinicians)
  IF EXISTS (
    SELECT 1 FROM patient_clinicians pc
    JOIN clinicians cl ON cl.id = pc.clinician_id
    WHERE pc.patient_id = patient_id_param
    AND cl.profile_id = auth.uid()
    AND pc.revoked_at IS NULL
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a clinician (through visits - legacy)
  IF EXISTS (
    SELECT 1 FROM visits v
    JOIN clinicians cl ON cl.id = v.clinician_id
    WHERE v.patient_id = patient_id_param
    AND cl.profile_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a physician
  IF EXISTS (
    SELECT 1 FROM patient_physicians pp
    JOIN physicians ph ON ph.id = pp.physician_id
    WHERE pp.patient_id = patient_id_param
    AND ph.profile_id = auth.uid()
    AND pp.revoked_at IS NULL
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create simple RLS policy using the helper function
CREATE POLICY "Users can access patients they have permission for"
  ON public.patients FOR SELECT
  USING (public.user_can_access_patient(id));

-- Update policy (only patients can update their own data)
CREATE POLICY "Patients can update their own data"
  ON public.patients FOR UPDATE
  USING (profile_id = auth.uid());

-- Insert policy (only patients can insert their own data)
CREATE POLICY "Patients can insert their own data"
  ON public.patients FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Fix invitations RLS policies
DROP POLICY IF EXISTS "Users can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can update invitations" ON public.invitations;

CREATE POLICY "Users can view invitations"
  ON public.invitations FOR SELECT
  USING (
    inviter_id = auth.uid()
    OR invitee_id = auth.uid()
    OR invitee_email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update invitations"
  ON public.invitations FOR UPDATE
  USING (
    invitee_id = auth.uid()
    OR invitee_email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );
