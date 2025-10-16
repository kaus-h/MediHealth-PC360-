-- Fix invitation system to properly create relationships
-- This addresses three issues:
-- 1. Patients can now invite clinicians (auto-creates patient record if needed)
-- 2. Accepted invites properly create care team relationships
-- 3. Patients appear in clinician's patient list after accepting invites

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_invitation_acceptance ON public.invitations;
DROP FUNCTION IF EXISTS handle_invitation_acceptance();

-- Create improved function that looks up IDs from profiles instead of relying on invitation fields
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_id uuid;
  v_clinician_id uuid;
  v_invitee_profile_id uuid;
  v_inviter_profile_id uuid;
  v_invitee_role text;
  v_inviter_role text;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Set responded_at timestamp
    NEW.responded_at = now();
    
    -- Get inviter's profile ID and role
    v_inviter_profile_id := NEW.inviter_id;
    SELECT role INTO v_inviter_role
    FROM public.profiles
    WHERE id = v_inviter_profile_id
    LIMIT 1;
    
    -- Get the invitee's profile ID and role (either from invitee_id or by looking up email)
    IF NEW.invitee_id IS NOT NULL THEN
      v_invitee_profile_id := NEW.invitee_id;
      SELECT role INTO v_invitee_role
      FROM public.profiles
      WHERE id = v_invitee_profile_id
      LIMIT 1;
    ELSE
      SELECT id, role INTO v_invitee_profile_id, v_invitee_role
      FROM public.profiles
      WHERE email = NEW.invitee_email
      LIMIT 1;
      
      -- Update the invitation with the invitee_id
      NEW.invitee_id := v_invitee_profile_id;
    END IF;
    
    -- Handle patient_to_clinician invitation
    IF NEW.invitation_type = 'patient_to_clinician' THEN
      -- Look up patient record from inviter's profile (the patient who sent the invite)
      SELECT id INTO v_patient_id
      FROM public.patients
      WHERE profile_id = v_inviter_profile_id
      LIMIT 1;
      
      -- Auto-create patient record if it doesn't exist and role is patient
      IF v_patient_id IS NULL AND v_inviter_role = 'patient' THEN
        INSERT INTO public.patients (profile_id, status)
        VALUES (v_inviter_profile_id, 'active')
        RETURNING id INTO v_patient_id;
      ELSIF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Inviter does not have a patient profile';
      END IF;
      
      -- Update invitation with patient_id
      NEW.patient_id := v_patient_id;
      
      -- Look up or create clinician record for the invitee
      SELECT id INTO v_clinician_id
      FROM public.clinicians
      WHERE profile_id = v_invitee_profile_id
      LIMIT 1;
      
      -- Auto-create clinician record if it doesn't exist and role is clinician
      IF v_clinician_id IS NULL AND v_invitee_role = 'clinician' THEN
        INSERT INTO public.clinicians (profile_id, specialization, license_number)
        VALUES (v_invitee_profile_id, 'General Practice', 'PENDING')
        RETURNING id INTO v_clinician_id;
      ELSIF v_clinician_id IS NULL THEN
        RAISE EXCEPTION 'Invitee does not have a clinician profile';
      END IF;
      
      -- Update invitation with clinician_id
      NEW.clinician_id := v_clinician_id;
      
      -- Create the relationship
      INSERT INTO public.patient_clinicians (
        patient_id,
        clinician_id,
        relationship_type,
        assigned_by
      ) VALUES (
        v_patient_id,
        v_clinician_id,
        'assigned',
        NEW.inviter_id
      )
      ON CONFLICT (patient_id, clinician_id) DO NOTHING;
      
    -- Handle clinician_to_patient invitation
    ELSIF NEW.invitation_type = 'clinician_to_patient' THEN
      -- Look up clinician record from inviter's profile (the clinician who sent the invite)
      SELECT id INTO v_clinician_id
      FROM public.clinicians
      WHERE profile_id = v_inviter_profile_id
      LIMIT 1;
      
      -- Auto-create clinician record if it doesn't exist and role is clinician
      IF v_clinician_id IS NULL AND v_inviter_role = 'clinician' THEN
        INSERT INTO public.clinicians (profile_id, specialization, license_number)
        VALUES (v_inviter_profile_id, 'General Practice', 'PENDING')
        RETURNING id INTO v_clinician_id;
      ELSIF v_clinician_id IS NULL THEN
        RAISE EXCEPTION 'Inviter does not have a clinician profile';
      END IF;
      
      -- Update invitation with clinician_id
      NEW.clinician_id := v_clinician_id;
      
      -- Look up or create patient record for the invitee
      SELECT id INTO v_patient_id
      FROM public.patients
      WHERE profile_id = v_invitee_profile_id
      LIMIT 1;
      
      -- Auto-create patient record if it doesn't exist and role is patient
      IF v_patient_id IS NULL AND v_invitee_role = 'patient' THEN
        INSERT INTO public.patients (profile_id, status)
        VALUES (v_invitee_profile_id, 'active')
        RETURNING id INTO v_patient_id;
      ELSIF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Invitee does not have a patient profile';
      END IF;
      
      -- Update invitation with patient_id
      NEW.patient_id := v_patient_id;
      
      -- Create the relationship
      INSERT INTO public.patient_clinicians (
        patient_id,
        clinician_id,
        relationship_type,
        assigned_by
      ) VALUES (
        v_patient_id,
        v_clinician_id,
        'assigned',
        NEW.inviter_id
      )
      ON CONFLICT (patient_id, clinician_id) DO NOTHING;
    END IF;
    
    -- Create notification for the inviter
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      priority,
      action_url
    ) VALUES (
      NEW.inviter_id,
      'Invitation Accepted',
      'Your invitation has been accepted!',
      'system',
      'normal',
      '/dashboard/team'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_invitation_acceptance
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_invitation_acceptance();

-- Add missing RLS policy for inserting into patient_clinicians
-- This allows the trigger function to create relationships
DROP POLICY IF EXISTS "System can create relationships" ON public.patient_clinicians;
CREATE POLICY "System can create relationships"
  ON public.patient_clinicians FOR INSERT
  WITH CHECK (true);
