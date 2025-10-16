-- Vendor Portal for DME Management
-- Allows vendors to manage equipment orders, deliveries, and documentation
-- Note: This script depends on medical_orders table from script 013

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL CHECK (vendor_type IN ('dme', 'pharmacy', 'lab', 'imaging', 'other')),
  license_number TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create dme_orders table (extends medical_orders for DME-specific fields)
CREATE TABLE IF NOT EXISTS dme_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_order_id UUID NOT NULL REFERENCES medical_orders(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),
  equipment_type TEXT NOT NULL,
  equipment_description TEXT,
  quantity INTEGER DEFAULT 1,
  delivery_address TEXT,
  delivery_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending_vendor' CHECK (status IN (
    'pending_vendor',
    'vendor_accepted',
    'in_preparation',
    'shipped',
    'delivered',
    'setup_complete',
    'cancelled',
    'returned'
  )),
  tracking_number TEXT,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_signature TEXT,
  setup_required BOOLEAN DEFAULT FALSE,
  setup_completed_at TIMESTAMPTZ,
  invoice_number TEXT,
  invoice_amount NUMERIC(10, 2),
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(medical_order_id)
);

-- Create dme_delivery_confirmations table
CREATE TABLE IF NOT EXISTS dme_delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dme_order_id UUID NOT NULL REFERENCES dme_orders(id) ON DELETE CASCADE,
  delivered_by UUID REFERENCES profiles(id),
  received_by_name TEXT NOT NULL,
  received_by_relationship TEXT,
  delivery_notes TEXT,
  equipment_condition TEXT CHECK (equipment_condition IN ('new', 'refurbished', 'damaged')),
  photo_urls TEXT[],
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor_performance_metrics view
CREATE OR REPLACE VIEW vendor_performance_metrics AS
SELECT 
  v.id as vendor_id,
  v.company_name,
  COUNT(dme.id) as total_orders,
  COUNT(CASE WHEN dme.status = 'delivered' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN dme.status = 'cancelled' THEN 1 END) as cancelled_orders,
  ROUND(
    COUNT(CASE WHEN dme.status = 'delivered' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(dme.id), 0) * 100, 
    1
  ) as completion_rate,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (dme.actual_delivery_date::TIMESTAMPTZ - dme.created_at)) / 86400)::NUMERIC,
    1
  ) as avg_delivery_days,
  COUNT(CASE WHEN dme.actual_delivery_date <= dme.estimated_delivery_date THEN 1 END) as on_time_deliveries,
  ROUND(
    COUNT(CASE WHEN dme.actual_delivery_date <= dme.estimated_delivery_date THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(CASE WHEN dme.actual_delivery_date IS NOT NULL THEN 1 END), 0) * 100,
    1
  ) as on_time_percentage
FROM vendors v
LEFT JOIN dme_orders dme ON dme.vendor_id = v.id
GROUP BY v.id, v.company_name;

-- Function to get vendor dashboard summary
CREATE OR REPLACE FUNCTION get_vendor_dashboard_summary(p_vendor_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'pending_orders', (
      SELECT COUNT(*) FROM dme_orders 
      WHERE vendor_id = p_vendor_id 
      AND status = 'pending_vendor'
    ),
    'in_progress', (
      SELECT COUNT(*) FROM dme_orders 
      WHERE vendor_id = p_vendor_id 
      AND status IN ('vendor_accepted', 'in_preparation', 'shipped')
    ),
    'completed_this_month', (
      SELECT COUNT(*) FROM dme_orders 
      WHERE vendor_id = p_vendor_id 
      AND status = 'delivered'
      AND actual_delivery_date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'avg_delivery_time', (
      SELECT ROUND(
        AVG(EXTRACT(EPOCH FROM (actual_delivery_date::TIMESTAMPTZ - created_at)) / 86400)::NUMERIC,
        1
      )
      FROM dme_orders 
      WHERE vendor_id = p_vendor_id 
      AND actual_delivery_date IS NOT NULL
      AND created_at >= CURRENT_DATE - INTERVAL '90 days'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE dme_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dme_delivery_confirmations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating to avoid conflicts
DROP POLICY IF EXISTS "Vendors can view their profile" ON vendors;
DROP POLICY IF EXISTS "Vendors can update their profile" ON vendors;
DROP POLICY IF EXISTS "Vendors can view their orders" ON dme_orders;
DROP POLICY IF EXISTS "Vendors can update their orders" ON dme_orders;
DROP POLICY IF EXISTS "Clinicians can view DME orders for their patients" ON dme_orders;
DROP POLICY IF EXISTS "Physicians can view DME orders" ON dme_orders;
DROP POLICY IF EXISTS "Admins can view all DME orders" ON dme_orders;
DROP POLICY IF EXISTS "Vendors can manage delivery confirmations" ON dme_delivery_confirmations;
DROP POLICY IF EXISTS "Users can view delivery confirmations for their orders" ON dme_delivery_confirmations;

-- Vendors can view their own profile
CREATE POLICY "Vendors can view their profile"
  ON vendors FOR SELECT
  USING (profile_id = auth.uid());

-- Vendors can update their profile
CREATE POLICY "Vendors can update their profile"
  ON vendors FOR UPDATE
  USING (profile_id = auth.uid());

-- DME orders policies
CREATE POLICY "Vendors can view their orders"
  ON dme_orders FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their orders"
  ON dme_orders FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Clinicians can view DME orders for their patients"
  ON dme_orders FOR SELECT
  USING (
    medical_order_id IN (
      SELECT mo.id FROM medical_orders mo
      JOIN visits v ON v.patient_id = mo.patient_id
      WHERE v.clinician_id IN (
        SELECT id FROM clinicians WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Physicians can view DME orders"
  ON dme_orders FOR SELECT
  USING (
    medical_order_id IN (
      SELECT id FROM medical_orders 
      WHERE physician_id IN (
        SELECT id FROM physicians WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can view all DME orders"
  ON dme_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'agency_admin'
    )
  );

-- Delivery confirmations policies
CREATE POLICY "Vendors can manage delivery confirmations"
  ON dme_delivery_confirmations FOR ALL
  USING (
    dme_order_id IN (
      SELECT id FROM dme_orders 
      WHERE vendor_id IN (
        SELECT id FROM vendors WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view delivery confirmations for their orders"
  ON dme_delivery_confirmations FOR SELECT
  USING (
    dme_order_id IN (
      SELECT dme.id FROM dme_orders dme
      JOIN medical_orders mo ON mo.id = dme.medical_order_id
      WHERE mo.patient_id IN (
        SELECT id FROM patients WHERE profile_id = auth.uid()
      )
      OR mo.physician_id IN (
        SELECT id FROM physicians WHERE profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM clinicians c
        JOIN visits v ON v.clinician_id = c.id
        WHERE c.profile_id = auth.uid()
        AND v.patient_id = mo.patient_id
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendors_profile_id ON vendors(profile_id);
CREATE INDEX IF NOT EXISTS idx_vendors_company_name ON vendors(company_name);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_dme_orders_vendor_id ON dme_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_dme_orders_medical_order_id ON dme_orders(medical_order_id);
CREATE INDEX IF NOT EXISTS idx_dme_orders_status ON dme_orders(status);
CREATE INDEX IF NOT EXISTS idx_dme_delivery_confirmations_order_id ON dme_delivery_confirmations(dme_order_id);

-- Add updated_at triggers
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dme_orders_updated_at
  BEFORE UPDATE ON dme_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
