-- Caregiver/MPOA Access System
-- Allows family members and caregivers to access patient information with proper permissions

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
  -- Add caregiver_id to patient_caregivers if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patient_caregivers' AND column_name = 'caregiver_id'
  ) THEN
    ALTER TABLE patient_caregivers 
    ADD COLUMN caregiver_id UUID REFERENCES caregivers(id) ON DELETE CASCADE;
  END IF;
  
  -- Check if relationship_type column exists in caregivers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'caregivers' AND column_name = 'relationship_type'
  ) THEN
    ALTER TABLE caregivers 
    ADD COLUMN relationship_type TEXT CHECK (relationship_type IN ('family', 'friend', 'professional', 'mpoa', 'guardian'));
  END IF;
  
  -- Check if mpoa_verified_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'caregivers' AND column_name = 'mpoa_verified_at'
  ) THEN
    ALTER TABLE caregivers 
    ADD COLUMN mpoa_verified_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create caregiver invitations table
CREATE TABLE IF NOT EXISTS caregiver_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  is_mpoa BOOLEAN DEFAULT FALSE,
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'manage', 'full')),
  can_view_records BOOLEAN DEFAULT TRUE,
  can_message BOOLEAN DEFAULT TRUE,
  can_schedule BOOLEAN DEFAULT FALSE,
  can_manage_medications BOOLEAN DEFAULT FALSE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to accept caregiver invitation
CREATE OR REPLACE FUNCTION accept_caregiver_invitation(invitation_id UUID, acceptor_profile_id UUID)
RETURNS VOID AS $$
DECLARE
  v_invitation caregiver_invitations%ROWTYPE;
  v_caregiver_id UUID;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation FROM caregiver_invitations WHERE id = invitation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;
  
  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation is not pending';
  END IF;
  
  IF v_invitation.expires_at < NOW() THEN
    UPDATE caregiver_invitations SET status = 'expired' WHERE id = invitation_id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;
  
  -- Create or get caregiver record
  INSERT INTO caregivers (profile_id, relationship_type, is_mpoa)
  VALUES (acceptor_profile_id, v_invitation.relationship_type, v_invitation.is_mpoa)
  ON CONFLICT (profile_id) DO UPDATE SET
    relationship_type = EXCLUDED.relationship_type,
    is_mpoa = EXCLUDED.is_mpoa OR caregivers.is_mpoa,
    updated_at = NOW()
  RETURNING id INTO v_caregiver_id;
  
  -- Create patient-caregiver relationship
  INSERT INTO patient_caregivers (
    patient_id, 
    caregiver_id,
    access_level,
    can_view_records,
    can_message,
    can_schedule,
    granted_by,
    granted_at
  ) VALUES (
    v_invitation.patient_id,
    v_caregiver_id,
    v_invitation.access_level,
    v_invitation.can_view_records,
    v_invitation.can_message,
    v_invitation.can_schedule,
    v_invitation.invited_by,
    NOW()
  )
  ON CONFLICT (patient_id, caregiver_id) DO UPDATE SET
    access_level = EXCLUDED.access_level,
    can_view_records = EXCLUDED.can_view_records,
    can_message = EXCLUDED.can_message,
    can_schedule = EXCLUDED.can_schedule,
    updated_at = NOW();
  
  -- Update invitation status
  UPDATE caregiver_invitations 
  SET status = 'accepted', responded_at = NOW(), updated_at = NOW()
  WHERE id = invitation_id;
  
  -- Create notification for patient
  INSERT INTO notifications (user_id, type, title, message, related_id)
  SELECT 
    p.profile_id,
    'caregiver_accepted',
    'Caregiver Accepted Invitation',
    'Your caregiver invitation has been accepted',
    invitation_id
  FROM patients p
  WHERE p.id = v_invitation.patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for caregivers table
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own caregiver profile"
  ON caregivers FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own caregiver profile"
  ON caregivers FOR UPDATE
  USING (profile_id = auth.uid());

-- RLS Policies for caregiver_invitations
ALTER TABLE caregiver_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view invitations they sent"
  ON caregiver_invitations FOR SELECT
  USING (
    invited_by = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Patients can create caregiver invitations"
  ON caregiver_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients WHERE profile_id = auth.uid() AND id = patient_id
    )
  );

CREATE POLICY "Patients can update their own invitations"
  ON caregiver_invitations FOR UPDATE
  USING (invited_by = auth.uid());

-- Update patient_caregivers RLS to include caregiver access
CREATE POLICY "Caregivers can view their patient relationships"
  ON patient_caregivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM caregivers 
      WHERE caregivers.id = patient_caregivers.caregiver_id 
      AND caregivers.profile_id = auth.uid()
    )
  );

-- Grant caregivers access to patient data based on permissions
CREATE POLICY "Caregivers can view patient visits"
  ON visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = visits.patient_id
      AND c.profile_id = auth.uid()
      AND pc.can_view_records = TRUE
      AND pc.revoked_at IS NULL
    )
  );

CREATE POLICY "Caregivers can view patient messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = messages.patient_context_id
      AND c.profile_id = auth.uid()
      AND pc.can_message = TRUE
      AND pc.revoked_at IS NULL
    )
  );

CREATE POLICY "Caregivers can send messages on behalf of patients"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = messages.patient_context_id
      AND c.profile_id = auth.uid()
      AND pc.can_message = TRUE
      AND pc.revoked_at IS NULL
    )
  );

CREATE POLICY "Caregivers can view patient documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = documents.patient_id
      AND c.profile_id = auth.uid()
      AND pc.can_view_records = TRUE
      AND pc.revoked_at IS NULL
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_caregivers_profile_id ON caregivers(profile_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_invitations_email ON caregiver_invitations(email);
CREATE INDEX IF NOT EXISTS idx_caregiver_invitations_status ON caregiver_invitations(status);
CREATE INDEX IF NOT EXISTS idx_patient_caregivers_caregiver_id ON patient_caregivers(caregiver_id);

-- Drop existing triggers before creating to avoid conflicts
DROP TRIGGER IF EXISTS update_caregivers_updated_at ON caregivers;
DROP TRIGGER IF EXISTS update_caregiver_invitations_updated_at ON caregiver_invitations;

-- Add updated_at trigger
CREATE TRIGGER update_caregivers_updated_at
  BEFORE UPDATE ON caregivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_caregiver_invitations_updated_at
  BEFORE UPDATE ON caregiver_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
