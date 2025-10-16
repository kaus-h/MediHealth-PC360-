-- Physician Portal & Features
-- Allows physicians to review patient information, approve orders, and communicate with care teams

-- Create physicians table
CREATE TABLE IF NOT EXISTS physicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  npi_number TEXT UNIQUE,
  specialty TEXT,
  practice_name TEXT,
  practice_address TEXT,
  is_accepting_patients BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create patient_physicians table for patient-physician relationships
CREATE TABLE IF NOT EXISTS patient_physicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  physician_id UUID NOT NULL REFERENCES physicians(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'primary' CHECK (relationship_type IN ('primary', 'specialist', 'consulting')),
  relationship_start DATE DEFAULT CURRENT_DATE,
  relationship_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, physician_id, relationship_type)
);

-- Create medical_orders table for physician orders
CREATE TABLE IF NOT EXISTS medical_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  physician_id UUID NOT NULL REFERENCES physicians(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL CHECK (order_type IN (
    'medication',
    'dme', -- Durable Medical Equipment
    'lab',
    'imaging',
    'therapy',
    'home_health',
    'other'
  )),
  order_details TEXT NOT NULL,
  diagnosis_codes TEXT[],
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'in_progress',
    'completed',
    'cancelled',
    'expired'
  )),
  requested_by UUID REFERENCES profiles(id), -- Clinician who requested the order
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create physician_messages table for secure messaging
CREATE TABLE IF NOT EXISTS physician_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  physician_id UUID NOT NULL REFERENCES physicians(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  parent_message_id UUID REFERENCES physician_messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create case_timeline view for physicians
CREATE OR REPLACE VIEW physician_case_timeline AS
SELECT 
  p.id as patient_id,
  'visit' as event_type,
  v.id as event_id,
  v.scheduled_start as event_date,
  json_build_object(
    'type', v.visit_type,
    'status', v.status,
    'clinician', prof.first_name || ' ' || prof.last_name,
    'notes', v.visit_notes
  ) as event_data
FROM patients p
JOIN visits v ON v.patient_id = p.id
LEFT JOIN clinicians c ON c.id = v.clinician_id
LEFT JOIN profiles prof ON prof.id = c.profile_id

UNION ALL

SELECT 
  p.id as patient_id,
  'alert' as event_type,
  pa.id as event_id,
  pa.created_at as event_date,
  json_build_object(
    'type', pa.alert_type,
    'severity', pa.severity,
    'title', pa.title,
    'description', pa.description
  ) as event_data
FROM patients p
JOIN patient_alerts pa ON pa.patient_id = p.id
WHERE pa.resolved_at IS NULL

UNION ALL

SELECT 
  p.id as patient_id,
  'order' as event_type,
  mo.id as event_id,
  mo.created_at as event_date,
  json_build_object(
    'type', mo.order_type,
    'status', mo.status,
    'priority', mo.priority,
    'details', mo.order_details
  ) as event_data
FROM patients p
JOIN medical_orders mo ON mo.patient_id = p.id

UNION ALL

SELECT 
  p.id as patient_id,
  'medication' as event_type,
  m.id as event_id,
  m.start_date as event_date,
  json_build_object(
    'name', m.name,
    'dosage', m.dosage,
    'frequency', m.frequency,
    'is_active', m.is_active
  ) as event_data
FROM patients p
JOIN medications m ON m.patient_id = p.id;

-- Function to get physician dashboard summary
CREATE OR REPLACE FUNCTION get_physician_dashboard_summary(p_physician_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'pending_orders', (
      SELECT COUNT(*) FROM medical_orders 
      WHERE physician_id = p_physician_id 
      AND status = 'pending'
    ),
    'unread_messages', (
      SELECT COUNT(*) FROM physician_messages 
      WHERE physician_id = p_physician_id 
      AND is_read = FALSE
    ),
    'active_patients', (
      SELECT COUNT(*) FROM patient_physicians 
      WHERE physician_id = p_physician_id 
      AND relationship_end IS NULL
    ),
    'urgent_alerts', (
      SELECT COUNT(*) 
      FROM patient_alerts pa
      JOIN patient_physicians pp ON pp.patient_id = pa.patient_id
      WHERE pp.physician_id = p_physician_id
      AND pa.severity IN ('high', 'critical')
      AND pa.resolved_at IS NULL
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE physicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_physicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE physician_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating to avoid conflicts
DROP POLICY IF EXISTS "Physicians can view their profile" ON physicians;
DROP POLICY IF EXISTS "Physicians can update their profile" ON physicians;
DROP POLICY IF EXISTS "Physicians can view their patients" ON patient_physicians;
DROP POLICY IF EXISTS "Patients can view their physicians" ON patient_physicians;
DROP POLICY IF EXISTS "Physicians can view orders for their patients" ON medical_orders;
DROP POLICY IF EXISTS "Physicians can manage their orders" ON medical_orders;
DROP POLICY IF EXISTS "Clinicians can create orders" ON medical_orders;
DROP POLICY IF EXISTS "Clinicians can view orders for their patients" ON medical_orders;
DROP POLICY IF EXISTS "Users can view their messages" ON physician_messages;
DROP POLICY IF EXISTS "Users can send messages" ON physician_messages;
DROP POLICY IF EXISTS "Recipients can update message read status" ON physician_messages;

-- Physicians can view their own profile
CREATE POLICY "Physicians can view their profile"
  ON physicians FOR SELECT
  USING (profile_id = auth.uid());

-- Physicians can update their profile
CREATE POLICY "Physicians can update their profile"
  ON physicians FOR UPDATE
  USING (profile_id = auth.uid());

-- Patient-physician relationships
CREATE POLICY "Physicians can view their patients"
  ON patient_physicians FOR SELECT
  USING (
    physician_id IN (
      SELECT id FROM physicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their physicians"
  ON patient_physicians FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

-- Medical orders policies
CREATE POLICY "Physicians can view orders for their patients"
  ON medical_orders FOR SELECT
  USING (
    physician_id IN (
      SELECT id FROM physicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Physicians can manage their orders"
  ON medical_orders FOR ALL
  USING (
    physician_id IN (
      SELECT id FROM physicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Clinicians can create orders"
  ON medical_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Clinicians can view orders for their patients"
  ON medical_orders FOR SELECT
  USING (
    patient_id IN (
      SELECT DISTINCT v.patient_id
      FROM visits v
      WHERE v.clinician_id IN (
        SELECT id FROM clinicians WHERE profile_id = auth.uid()
      )
    )
  );

-- Physician messages policies
CREATE POLICY "Users can view their messages"
  ON physician_messages FOR SELECT
  USING (
    sender_id = auth.uid()
    OR physician_id IN (
      SELECT id FROM physicians WHERE profile_id = auth.uid()
    )
    OR patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM clinicians c
      JOIN visits v ON v.clinician_id = c.id
      WHERE c.profile_id = auth.uid()
      AND v.patient_id = physician_messages.patient_id
    )
  );

CREATE POLICY "Users can send messages"
  ON physician_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
  );

CREATE POLICY "Recipients can update message read status"
  ON physician_messages FOR UPDATE
  USING (
    physician_id IN (
      SELECT id FROM physicians WHERE profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM clinicians c
      WHERE c.profile_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_physicians_profile_id ON physicians(profile_id);
CREATE INDEX IF NOT EXISTS idx_physicians_npi ON physicians(npi_number);
CREATE INDEX IF NOT EXISTS idx_patient_physicians_patient_id ON patient_physicians(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_physicians_physician_id ON patient_physicians(physician_id);
CREATE INDEX IF NOT EXISTS idx_medical_orders_patient_id ON medical_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_orders_physician_id ON medical_orders(physician_id);
CREATE INDEX IF NOT EXISTS idx_medical_orders_status ON medical_orders(status);
CREATE INDEX IF NOT EXISTS idx_physician_messages_physician_id ON physician_messages(physician_id);
CREATE INDEX IF NOT EXISTS idx_physician_messages_patient_id ON physician_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_physician_messages_read ON physician_messages(is_read) WHERE is_read = FALSE;

-- Add updated_at triggers
CREATE TRIGGER update_physicians_updated_at
  BEFORE UPDATE ON physicians
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_physicians_updated_at
  BEFORE UPDATE ON patient_physicians
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_orders_updated_at
  BEFORE UPDATE ON medical_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
