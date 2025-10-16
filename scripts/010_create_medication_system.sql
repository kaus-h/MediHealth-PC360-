-- Medication Reminders & Tracking System
-- Allows patients to track medications and receive reminders

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- e.g., "twice daily", "every 8 hours"
  instructions TEXT,
  prescribing_physician TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_times TIME[], -- Array of times to send reminders
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_logs table for tracking adherence
CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  notes TEXT,
  logged_by UUID REFERENCES profiles(id), -- Can be patient or caregiver
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_reminders table for notification tracking
CREATE TABLE IF NOT EXISTS medication_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_log_id UUID NOT NULL REFERENCES medication_logs(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  reminder_time TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate medication logs for upcoming doses
CREATE OR REPLACE FUNCTION generate_medication_logs()
RETURNS void AS $$
DECLARE
  med RECORD;
  log_time TIMESTAMPTZ;
  reminder_time TIME;
BEGIN
  -- Generate logs for the next 24 hours for active medications
  FOR med IN 
    SELECT * FROM medications 
    WHERE is_active = TRUE 
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  LOOP
    -- For each reminder time, create a log entry
    FOREACH reminder_time IN ARRAY med.reminder_times
    LOOP
      log_time := (CURRENT_DATE + reminder_time)::TIMESTAMPTZ;
      
      -- Only create if it doesn't already exist and is in the future
      IF log_time > NOW() AND log_time < NOW() + INTERVAL '24 hours' THEN
        INSERT INTO medication_logs (medication_id, patient_id, scheduled_time, status)
        VALUES (med.id, med.patient_id, log_time, 'pending')
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to mark medication as taken
CREATE OR REPLACE FUNCTION take_medication(log_id UUID, taker_profile_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE medication_logs
  SET 
    status = 'taken',
    taken_at = NOW(),
    logged_by = taker_profile_id,
    updated_at = NOW()
  WHERE id = log_id AND status = 'pending';
  
  -- Update reminder status
  UPDATE medication_reminders
  SET status = 'acknowledged'
  WHERE medication_log_id = log_id AND status IN ('pending', 'sent');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate medication adherence rate
CREATE OR REPLACE FUNCTION calculate_medication_adherence(
  p_patient_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS NUMERIC AS $$
DECLARE
  total_doses INTEGER;
  taken_doses INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_doses
  FROM medication_logs
  WHERE patient_id = p_patient_id
  AND scheduled_time >= NOW() - (p_days || ' days')::INTERVAL
  AND scheduled_time <= NOW();
  
  IF total_doses = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO taken_doses
  FROM medication_logs
  WHERE patient_id = p_patient_id
  AND scheduled_time >= NOW() - (p_days || ' days')::INTERVAL
  AND scheduled_time <= NOW()
  AND status = 'taken';
  
  RETURN ROUND((taken_doses::NUMERIC / total_doses::NUMERIC) * 100, 1);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating to avoid conflicts
DROP POLICY IF EXISTS "Patients can view their medications" ON medications;
DROP POLICY IF EXISTS "Patients can insert their medications" ON medications;
DROP POLICY IF EXISTS "Patients can update their medications" ON medications;
DROP POLICY IF EXISTS "Caregivers can view patient medications" ON medications;
DROP POLICY IF EXISTS "Caregivers can manage patient medications" ON medications;
DROP POLICY IF EXISTS "Clinicians can view patient medications" ON medications;
DROP POLICY IF EXISTS "Users can view their medication logs" ON medication_logs;
DROP POLICY IF EXISTS "Users can update their medication logs" ON medication_logs;
DROP POLICY IF EXISTS "Users can view their medication reminders" ON medication_reminders;

-- Patients can view and manage their own medications
CREATE POLICY "Patients can view their medications"
  ON medications FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Patients can insert their medications"
  ON medications FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Patients can update their medications"
  ON medications FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

-- Caregivers can view and manage medications for their patients
CREATE POLICY "Caregivers can view patient medications"
  ON medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = medications.patient_id
      AND c.profile_id = auth.uid()
      AND pc.revoked_at IS NULL
    )
  );

CREATE POLICY "Caregivers can manage patient medications"
  ON medications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = medications.patient_id
      AND c.profile_id = auth.uid()
      AND pc.revoked_at IS NULL
    )
  );

-- Clinicians can view medications for their patients
CREATE POLICY "Clinicians can view patient medications"
  ON medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patient_clinicians pc
      WHERE pc.patient_id = medications.patient_id
      AND pc.clinician_id IN (
        SELECT id FROM clinicians WHERE profile_id = auth.uid()
      )
      AND pc.can_view_records = TRUE
      AND pc.revoked_at IS NULL
    )
  );

-- Medication logs policies
CREATE POLICY "Users can view their medication logs"
  ON medication_logs FOR SELECT
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = medication_logs.patient_id
      AND c.profile_id = auth.uid()
      AND pc.revoked_at IS NULL
    )
  );

CREATE POLICY "Users can update their medication logs"
  ON medication_logs FOR UPDATE
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = medication_logs.patient_id
      AND c.profile_id = auth.uid()
      AND pc.revoked_at IS NULL
    )
  );

-- Medication reminders policies
CREATE POLICY "Users can view their medication reminders"
  ON medication_reminders FOR SELECT
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM patient_caregivers pc
      JOIN caregivers c ON c.id = pc.caregiver_id
      WHERE pc.patient_id = medication_reminders.patient_id
      AND c.profile_id = auth.uid()
      AND pc.revoked_at IS NULL
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient_id ON medication_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_scheduled_time ON medication_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_logs_status ON medication_logs(status);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_patient_id ON medication_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_status ON medication_reminders(status);

-- Add updated_at triggers
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_logs_updated_at
  BEFORE UPDATE ON medication_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
