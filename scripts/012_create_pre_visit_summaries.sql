-- Pre-Visit Summaries for Clinicians
-- Provides clinicians with comprehensive patient information before visits

-- Create patient_alerts table for flagging important information
CREATE TABLE IF NOT EXISTS patient_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'fall_risk',
    'medication_change',
    'hospitalization',
    'emergency_contact_change',
    'care_plan_update',
    'family_concern',
    'non_compliance',
    'equipment_need',
    'other'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create visit_preparation_notes table for clinician notes before visits
CREATE TABLE IF NOT EXISTS visit_preparation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  notes TEXT NOT NULL,
  focus_areas TEXT[], -- Array of areas to focus on during visit
  equipment_needed TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visit_id, clinician_id)
);

-- Function to generate pre-visit summary
CREATE OR REPLACE FUNCTION get_pre_visit_summary(p_visit_id UUID)
RETURNS JSON AS $$
DECLARE
  v_summary JSON;
  v_visit visits%ROWTYPE;
  v_patient patients%ROWTYPE;
  v_profile profiles%ROWTYPE;
BEGIN
  -- Get visit details
  SELECT * INTO v_visit FROM visits WHERE id = p_visit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit not found';
  END IF;
  
  -- Get patient details
  SELECT * INTO v_patient FROM patients WHERE id = v_visit.patient_id;
  SELECT * INTO v_profile FROM profiles WHERE id = v_patient.profile_id;
  
  -- Build comprehensive summary
  SELECT json_build_object(
    'visit', json_build_object(
      'id', v_visit.id,
      'type', v_visit.visit_type,
      'scheduled_start', v_visit.scheduled_start,
      'scheduled_end', v_visit.scheduled_end,
      'visit_notes', v_visit.visit_notes
    ),
    'patient', json_build_object(
      'id', v_patient.id,
      'name', v_profile.first_name || ' ' || v_profile.last_name,
      'date_of_birth', v_patient.date_of_birth,
      'address', v_patient.address,
      'phone', v_profile.phone,
      'emergency_contact', v_patient.emergency_contact_name,
      'emergency_phone', v_patient.emergency_contact_phone
    ),
    'active_alerts', (
      SELECT COALESCE(json_agg(json_build_object(
        'type', alert_type,
        'severity', severity,
        'title', title,
        'description', description,
        'created_at', created_at
      ) ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        created_at DESC
      ), '[]'::json)
      FROM patient_alerts
      WHERE patient_id = v_patient.id
      AND resolved_at IS NULL
    ),
    'recent_visits', (
      SELECT COALESCE(json_agg(json_build_object(
        'date', scheduled_start,
        'type', visit_type,
        'status', status,
        'notes', visit_notes
      ) ORDER BY scheduled_start DESC), '[]'::json)
      FROM visits
      WHERE patient_id = v_patient.id
      AND id != p_visit_id
      AND scheduled_start < v_visit.scheduled_start
      LIMIT 5
    ),
    'active_medications', (
      SELECT COALESCE(json_agg(json_build_object(
        'name', name,
        'dosage', dosage,
        'frequency', frequency,
        'instructions', instructions
      ) ORDER BY name), '[]'::json)
      FROM medications
      WHERE patient_id = v_patient.id
      AND is_active = TRUE
    ),
    'recent_ratings', (
      SELECT COALESCE(json_agg(json_build_object(
        'overall_rating', overall_rating,
        'feedback', feedback_text,
        'created_at', created_at
      ) ORDER BY created_at DESC), '[]'::json)
      FROM visit_ratings vr
      JOIN visits v ON v.id = vr.visit_id
      WHERE v.patient_id = v_patient.id
      LIMIT 3
    ),
    'caregivers', (
      SELECT COALESCE(json_agg(json_build_object(
        'name', p.first_name || ' ' || p.last_name,
        'relationship', c.relationship_type,
        'is_mpoa', c.is_mpoa,
        'phone', p.phone
      )), '[]'::json)
      FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      JOIN profiles p ON p.id = c.profile_id
      WHERE pc.patient_id = v_patient.id
      AND pc.revoked_at IS NULL
    )
  ) INTO v_summary;
  
  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE patient_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_preparation_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating to avoid conflicts
DROP POLICY IF EXISTS "Clinicians can view patient alerts" ON patient_alerts;
DROP POLICY IF EXISTS "Clinicians can create patient alerts" ON patient_alerts;
DROP POLICY IF EXISTS "Clinicians can update their alerts" ON patient_alerts;
DROP POLICY IF EXISTS "Clinicians can view their prep notes" ON visit_preparation_notes;
DROP POLICY IF EXISTS "Clinicians can manage their prep notes" ON visit_preparation_notes;

-- Clinicians can view alerts for their patients
CREATE POLICY "Clinicians can view patient alerts"
  ON patient_alerts FOR SELECT
  USING (
    patient_id IN (
      SELECT DISTINCT v.patient_id
      FROM visits v
      WHERE v.clinician_id IN (
        SELECT id FROM clinicians WHERE profile_id = auth.uid()
      )
    )
    OR patient_id IN (
      SELECT patient_id FROM patient_clinicians
      WHERE clinician_id IN (
        SELECT id FROM clinicians WHERE profile_id = auth.uid()
      )
      AND revoked_at IS NULL
    )
  );

-- Clinicians and admins can create alerts
CREATE POLICY "Clinicians can create patient alerts"
  ON patient_alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinicians WHERE profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agency_admin'
    )
  );

-- Clinicians can update alerts they created
CREATE POLICY "Clinicians can update their alerts"
  ON patient_alerts FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agency_admin'
    )
  );

-- Visit preparation notes policies
CREATE POLICY "Clinicians can view their prep notes"
  ON visit_preparation_notes FOR SELECT
  USING (
    clinician_id IN (
      SELECT id FROM clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Clinicians can manage their prep notes"
  ON visit_preparation_notes FOR ALL
  USING (
    clinician_id IN (
      SELECT id FROM clinicians WHERE profile_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_alerts_patient_id ON patient_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_alerts_severity ON patient_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_patient_alerts_resolved ON patient_alerts(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visit_preparation_notes_visit_id ON visit_preparation_notes(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_preparation_notes_clinician_id ON visit_preparation_notes(clinician_id);

-- Add updated_at triggers
CREATE TRIGGER update_patient_alerts_updated_at
  BEFORE UPDATE ON patient_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visit_preparation_notes_updated_at
  BEFORE UPDATE ON visit_preparation_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
