-- Fix invitation system issues
-- 1. Allow users to view basic profile info of others (for displaying invitation senders)
-- 2. Fix the invitation acceptance trigger to handle missing patient/clinician IDs

-- Drop existing policy on profiles that might be blocking
DROP POLICY IF EXISTS "Users can view other profiles" ON public.profiles;

-- Create policy to allow viewing basic profile information
CREATE POLICY "Users can view basic profile info"
  ON public.profiles FOR SELECT
  USING (true);  -- Allow all authenticated users to view basic profile info

-- Drop and recreate the invitation acceptance trigger with proper logic
DROP TRIGGER IF EXISTS on_invitation_acceptance ON public.invitations;
DROP FUNCTION IF EXISTS handle_invitation_acceptance();

-- Improved function to handle invitation acceptance
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_id uuid;
  v_clinician_id uuid;
  v_invitee_profile_id uuid;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Set responded_at timestamp
    NEW.responded_at = now();
    
    -- Get the invitee's profile ID (either from invitee_id or by looking up email)
    IF NEW.invitee_id IS NOT NULL THEN
      v_invitee_profile_id := NEW.invitee_id;
    ELSE
      SELECT id INTO v_invitee_profile_id
      FROM public.profiles
      WHERE email = NEW.invitee_email
      LIMIT 1;
    END IF;
    
    -- Handle patient_to_clinician invitation
    IF NEW.invitation_type = 'patient_to_clinician' THEN
      -- Get or use the patient_id from invitation
      v_patient_id := NEW.patient_id;
      
      -- Get or create clinician record for the invitee
      SELECT id INTO v_clinician_id
      FROM public.clinicians
      WHERE profile_id = v_invitee_profile_id
      LIMIT 1;
      
      -- If clinician record doesn't exist, we can't proceed
      IF v_clinician_id IS NULL THEN
        RAISE EXCEPTION 'Invitee does not have a clinician profile';
      END IF;
      
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
      -- Get or use the clinician_id from invitation
      v_clinician_id := NEW.clinician_id;
      
      -- Get or create patient record for the invitee
      SELECT id INTO v_patient_id
      FROM public.patients
      WHERE profile_id = v_invitee_profile_id
      LIMIT 1;
      
      -- If patient record doesn't exist, we can't proceed
      IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Invitee does not have a patient profile';
      END IF;
      
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
