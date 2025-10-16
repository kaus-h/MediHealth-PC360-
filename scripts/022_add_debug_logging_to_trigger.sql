-- Add comprehensive debug logging to understand why relationships aren't being created

-- Drop and recreate the trigger function with debug logging
DROP TRIGGER IF EXISTS on_invitation_acceptance ON public.invitations;
DROP FUNCTION IF EXISTS handle_invitation_acceptance();

CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_id uuid;
  v_clinician_id uuid;
  v_invitee_profile_id uuid;
  v_inviter_profile_id uuid;
  v_invitee_role text;
  v_inviter_role text;
  v_relationship_id uuid;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    RAISE NOTICE '[v0 TRIGGER] Invitation accepted: %', NEW.id;
    RAISE NOTICE '[v0 TRIGGER] Invitation type: %', NEW.invitation_type;
    
    -- Set responded_at timestamp
    NEW.responded_at = now();
    
    -- Get inviter's profile ID and role
    v_inviter_profile_id := NEW.inviter_id;
    SELECT role INTO v_inviter_role
    FROM public.profiles
    WHERE id = v_inviter_profile_id
    LIMIT 1;
    
    RAISE NOTICE '[v0 TRIGGER] Inviter ID: %, Role: %', v_inviter_profile_id, v_inviter_role;
    
    -- Get the invitee's profile ID and role
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
      
      NEW.invitee_id := v_invitee_profile_id;
    END IF;
    
    RAISE NOTICE '[v0 TRIGGER] Invitee ID: %, Role: %', v_invitee_profile_id, v_invitee_role;
    
    -- Handle patient_to_clinician invitation
    IF NEW.invitation_type = 'patient_to_clinician' THEN
      RAISE NOTICE '[v0 TRIGGER] Processing patient_to_clinician invitation';
      
      -- Look up patient record from inviter's profile
      SELECT id INTO v_patient_id
      FROM public.patients
      WHERE profile_id = v_inviter_profile_id
      LIMIT 1;
      
      RAISE NOTICE '[v0 TRIGGER] Found patient_id: %', v_patient_id;
      
      -- Auto-create patient record if needed
      IF v_patient_id IS NULL AND v_inviter_role = 'patient' THEN
        RAISE NOTICE '[v0 TRIGGER] Creating patient record for inviter';
        INSERT INTO public.patients (profile_id, status)
        VALUES (v_inviter_profile_id, 'active')
        RETURNING id INTO v_patient_id;
        RAISE NOTICE '[v0 TRIGGER] Created patient_id: %', v_patient_id;
      ELSIF v_patient_id IS NULL THEN
        RAISE EXCEPTION '[v0 TRIGGER] Inviter does not have a patient profile and role is not patient';
      END IF;
      
      NEW.patient_id := v_patient_id;
      
      -- Look up or create clinician record for invitee
      SELECT id INTO v_clinician_id
      FROM public.clinicians
      WHERE profile_id = v_invitee_profile_id
      LIMIT 1;
      
      RAISE NOTICE '[v0 TRIGGER] Found clinician_id: %', v_clinician_id;
      
      IF v_clinician_id IS NULL AND v_invitee_role = 'clinician' THEN
        RAISE NOTICE '[v0 TRIGGER] Creating clinician record for invitee';
        INSERT INTO public.clinicians (profile_id, specialization, license_number)
        VALUES (v_invitee_profile_id, 'General Practice', 'PENDING')
        RETURNING id INTO v_clinician_id;
        RAISE NOTICE '[v0 TRIGGER] Created clinician_id: %', v_clinician_id;
      ELSIF v_clinician_id IS NULL THEN
        RAISE EXCEPTION '[v0 TRIGGER] Invitee does not have a clinician profile and role is not clinician';
      END IF;
      
      NEW.clinician_id := v_clinician_id;
      
      -- Create the relationship
      RAISE NOTICE '[v0 TRIGGER] Creating relationship: patient_id=%, clinician_id=%', v_patient_id, v_clinician_id;
      
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
      ON CONFLICT (patient_id, clinician_id) DO UPDATE
      SET revoked_at = NULL, updated_at = now()
      RETURNING id INTO v_relationship_id;
      
      RAISE NOTICE '[v0 TRIGGER] Created/updated relationship with id: %', v_relationship_id;
      
    -- Handle clinician_to_patient invitation
    ELSIF NEW.invitation_type = 'clinician_to_patient' THEN
      RAISE NOTICE '[v0 TRIGGER] Processing clinician_to_patient invitation';
      
      -- Look up clinician record from inviter's profile
      SELECT id INTO v_clinician_id
      FROM public.clinicians
      WHERE profile_id = v_inviter_profile_id
      LIMIT 1;
      
      RAISE NOTICE '[v0 TRIGGER] Found clinician_id: %', v_clinician_id;
      
      IF v_clinician_id IS NULL AND v_inviter_role = 'clinician' THEN
        RAISE NOTICE '[v0 TRIGGER] Creating clinician record for inviter';
        INSERT INTO public.clinicians (profile_id, specialization, license_number)
        VALUES (v_inviter_profile_id, 'General Practice', 'PENDING')
        RETURNING id INTO v_clinician_id;
        RAISE NOTICE '[v0 TRIGGER] Created clinician_id: %', v_clinician_id;
      ELSIF v_clinician_id IS NULL THEN
        RAISE EXCEPTION '[v0 TRIGGER] Inviter does not have a clinician profile and role is not clinician';
      END IF;
      
      NEW.clinician_id := v_clinician_id;
      
      -- Look up or create patient record for invitee
      SELECT id INTO v_patient_id
      FROM public.patients
      WHERE profile_id = v_invitee_profile_id
      LIMIT 1;
      
      RAISE NOTICE '[v0 TRIGGER] Found patient_id: %', v_patient_id;
      
      IF v_patient_id IS NULL AND v_invitee_role = 'patient' THEN
        RAISE NOTICE '[v0 TRIGGER] Creating patient record for invitee';
        INSERT INTO public.patients (profile_id, status)
        VALUES (v_invitee_profile_id, 'active')
        RETURNING id INTO v_patient_id;
        RAISE NOTICE '[v0 TRIGGER] Created patient_id: %', v_patient_id;
      ELSIF v_patient_id IS NULL THEN
        RAISE EXCEPTION '[v0 TRIGGER] Invitee does not have a patient profile and role is not patient';
      END IF;
      
      NEW.patient_id := v_patient_id;
      
      -- Create the relationship
      RAISE NOTICE '[v0 TRIGGER] Creating relationship: patient_id=%, clinician_id=%', v_patient_id, v_clinician_id;
      
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
      ON CONFLICT (patient_id, clinician_id) DO UPDATE
      SET revoked_at = NULL, updated_at = now()
      RETURNING id INTO v_relationship_id;
      
      RAISE NOTICE '[v0 TRIGGER] Created/updated relationship with id: %', v_relationship_id;
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
    
    RAISE NOTICE '[v0 TRIGGER] Trigger completed successfully';
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[v0 TRIGGER ERROR] %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_invitation_acceptance
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_invitation_acceptance();

-- Verify RLS policies allow reading relationships
-- Add policy to allow users to read their own relationships
DROP POLICY IF EXISTS "Users can view their relationships" ON public.patient_clinicians;
CREATE POLICY "Users can view their relationships"
  ON public.patient_clinicians FOR SELECT
  USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = auth.uid())
    OR clinician_id IN (SELECT id FROM public.clinicians WHERE profile_id = auth.uid())
  );
