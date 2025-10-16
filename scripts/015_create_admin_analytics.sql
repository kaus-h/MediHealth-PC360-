-- Administrator Analytics Dashboard
-- Comprehensive analytics and reporting for agency administrators
-- Note: This script depends on tables from previous scripts (medications, medical_orders, etc.)

-- Create agency_metrics view for high-level KPIs
CREATE OR REPLACE VIEW agency_metrics AS
SELECT 
  json_build_object(
    'total_patients', (SELECT COUNT(*) FROM patients),
    'active_patients', (
      SELECT COUNT(DISTINCT patient_id) 
      FROM visits 
      WHERE scheduled_start >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'total_clinicians', (SELECT COUNT(*) FROM clinicians),
    'active_clinicians', (
      SELECT COUNT(DISTINCT clinician_id) 
      FROM visits 
      WHERE scheduled_start >= CURRENT_DATE - INTERVAL '30 days'
      AND clinician_id IS NOT NULL
    ),
    'total_visits_this_month', (
      SELECT COUNT(*) 
      FROM visits 
      WHERE scheduled_start >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'completed_visits_this_month', (
      SELECT COUNT(*) 
      FROM visits 
      WHERE scheduled_start >= DATE_TRUNC('month', CURRENT_DATE)
      AND status = 'completed'
    ),
    'avg_patient_satisfaction', (
      SELECT ROUND(AVG(overall_rating), 2)
      FROM visit_ratings
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'pending_medical_orders', (
      SELECT COUNT(*) 
      FROM medical_orders 
      WHERE status = 'pending'
    )
  ) as metrics;

-- Create visit_analytics view
CREATE OR REPLACE VIEW visit_analytics AS
SELECT 
  DATE_TRUNC('day', scheduled_start) as visit_date,
  visit_type,
  status,
  COUNT(*) as visit_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
  COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_count
FROM visits
WHERE scheduled_start >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', scheduled_start), visit_type, status;

-- Create clinician_productivity view
CREATE OR REPLACE VIEW clinician_productivity AS
SELECT 
  c.id as clinician_id,
  p.first_name || ' ' || p.last_name as clinician_name,
  COUNT(v.id) as total_visits,
  COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits,
  COUNT(CASE WHEN v.status = 'cancelled' THEN 1 END) as cancelled_visits,
  COUNT(CASE WHEN v.status = 'no_show' THEN 1 END) as no_show_visits,
  ROUND(
    COUNT(CASE WHEN v.status = 'completed' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(v.id), 0) * 100, 
    1
  ) as completion_rate,
  COALESCE(ROUND(AVG(vr.overall_rating), 2), 0) as avg_rating,
  COUNT(DISTINCT v.patient_id) as unique_patients
FROM clinicians c
JOIN profiles p ON p.id = c.profile_id
LEFT JOIN visits v ON v.clinician_id = c.id 
  AND v.scheduled_start >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN visit_ratings vr ON vr.clinician_id = c.id
  AND vr.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, p.first_name, p.last_name;

-- Create patient_engagement view
CREATE OR REPLACE VIEW patient_engagement AS
SELECT 
  p.id as patient_id,
  prof.first_name || ' ' || prof.last_name as patient_name,
  COUNT(DISTINCT v.id) as total_visits,
  MAX(v.scheduled_start) as last_visit_date,
  COUNT(DISTINCT vr.id) as ratings_given,
  COUNT(DISTINCT m.id) as active_medications,
  COUNT(DISTINCT pc.caregiver_id) as caregivers_count,
  CASE 
    WHEN MAX(v.scheduled_start) >= CURRENT_DATE - INTERVAL '30 days' THEN 'active'
    WHEN MAX(v.scheduled_start) >= CURRENT_DATE - INTERVAL '90 days' THEN 'at_risk'
    ELSE 'inactive'
  END as engagement_status
FROM patients p
JOIN profiles prof ON prof.id = p.profile_id
LEFT JOIN visits v ON v.patient_id = p.id
LEFT JOIN visit_ratings vr ON vr.patient_id = p.id
LEFT JOIN medications m ON m.patient_id = p.id AND m.is_active = TRUE
LEFT JOIN patient_caregivers pc ON pc.patient_id = p.id AND pc.revoked_at IS NULL
GROUP BY p.id, prof.first_name, prof.last_name;

-- Create financial_overview view
CREATE OR REPLACE VIEW financial_overview AS
SELECT 
  DATE_TRUNC('month', v.scheduled_start) as month,
  v.visit_type,
  COUNT(v.id) as visit_count,
  SUM(CASE WHEN dme.invoice_amount IS NOT NULL THEN dme.invoice_amount ELSE 0 END) as dme_revenue
FROM visits v
LEFT JOIN medical_orders mo ON mo.patient_id = v.patient_id
LEFT JOIN dme_orders dme ON dme.medical_order_id = mo.id
WHERE v.scheduled_start >= CURRENT_DATE - INTERVAL '12 months'
AND v.status = 'completed'
GROUP BY DATE_TRUNC('month', v.scheduled_start), v.visit_type;

-- Function to get quality metrics
CREATE OR REPLACE FUNCTION get_quality_metrics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  v_metrics JSON;
BEGIN
  SELECT json_build_object(
    'patient_satisfaction', (
      SELECT json_build_object(
        'avg_overall_rating', ROUND(AVG(overall_rating), 2),
        'avg_care_quality', ROUND(AVG(care_quality_rating), 2),
        'avg_communication', ROUND(AVG(communication_rating), 2),
        'avg_professionalism', ROUND(AVG(professionalism_rating), 2),
        'avg_timeliness', ROUND(AVG(timeliness_rating), 2),
        'total_responses', COUNT(*),
        'recommend_percentage', ROUND(
          COUNT(CASE WHEN would_recommend = TRUE THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(*), 0) * 100, 
          1
        )
      )
      FROM visit_ratings
      WHERE created_at >= p_start_date AND created_at <= p_end_date
    ),
    'visit_completion', (
      SELECT json_build_object(
        'total_scheduled', COUNT(*),
        'completed', COUNT(CASE WHEN status = 'completed' THEN 1 END),
        'cancelled', COUNT(CASE WHEN status = 'cancelled' THEN 1 END),
        'no_show', COUNT(CASE WHEN status = 'no_show' THEN 1 END),
        'completion_rate', ROUND(
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(*), 0) * 100, 
          1
        )
      )
      FROM visits
      WHERE scheduled_start >= p_start_date AND scheduled_start <= p_end_date
    ),
    'active_alerts', (
      SELECT json_build_object(
        'critical', COUNT(CASE WHEN severity = 'critical' THEN 1 END),
        'high', COUNT(CASE WHEN severity = 'high' THEN 1 END),
        'medium', COUNT(CASE WHEN severity = 'medium' THEN 1 END),
        'low', COUNT(CASE WHEN severity = 'low' THEN 1 END),
        'total', COUNT(*)
      )
      FROM patient_alerts
      WHERE resolved_at IS NULL
    ),
    'medication_adherence', (
      SELECT json_build_object(
        'total_reminders', COUNT(*),
        'taken', COUNT(CASE WHEN status = 'acknowledged' THEN 1 END),
        'missed', COUNT(CASE WHEN status = 'pending' AND reminder_time < NOW() THEN 1 END),
        'adherence_rate', ROUND(
          COUNT(CASE WHEN status = 'acknowledged' THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(*), 0) * 100, 
          1
        )
      )
      FROM medication_reminders
      WHERE reminder_time >= p_start_date AND reminder_time <= p_end_date
    )
  ) INTO v_metrics;
  
  RETURN v_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get operational metrics
CREATE OR REPLACE FUNCTION get_operational_metrics()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'clinician_utilization', (
      SELECT json_agg(
        json_build_object(
          'clinician_name', clinician_name,
          'total_visits', total_visits,
          'completed_visits', completed_visits,
          'completion_rate', completion_rate,
          'avg_rating', avg_rating
        )
        ORDER BY total_visits DESC
      )
      FROM clinician_productivity
      LIMIT 10
    ),
    'vendor_performance', (
      SELECT json_agg(
        json_build_object(
          'company_name', company_name,
          'total_orders', total_orders,
          'completion_rate', completion_rate,
          'avg_delivery_days', avg_delivery_days,
          'on_time_percentage', on_time_percentage
        )
        ORDER BY total_orders DESC
      )
      FROM vendor_performance_metrics
      LIMIT 10
    ),
    'patient_engagement', (
      SELECT json_build_object(
        'active', COUNT(CASE WHEN engagement_status = 'active' THEN 1 END),
        'at_risk', COUNT(CASE WHEN engagement_status = 'at_risk' THEN 1 END),
        'inactive', COUNT(CASE WHEN engagement_status = 'inactive' THEN 1 END)
      )
      FROM patient_engagement
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for views (admins only)
CREATE POLICY "Admins can view agency metrics"
  ON visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'agency_admin'
    )
  );

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_start ON visits(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_visit_ratings_created_at_analytics ON visit_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_reminder_time ON medication_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_patient_alerts_severity ON patient_alerts(severity) WHERE resolved_at IS NULL;
