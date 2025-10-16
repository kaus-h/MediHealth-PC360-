-- Visit Ratings & Feedback System
-- Allows patients to rate visits and provide feedback for quality improvement

-- Visit Ratings & Feedback System
-- Note: visit_ratings table already exists in the database
-- This script only adds missing columns and updates RLS policies

-- Check if table exists before creating, add only missing columns
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visit_ratings' AND column_name = 'care_quality_rating'
  ) THEN
    ALTER TABLE visit_ratings 
    ADD COLUMN care_quality_rating INTEGER CHECK (care_quality_rating >= 1 AND care_quality_rating <= 5);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visit_ratings' AND column_name = 'communication_rating'
  ) THEN
    ALTER TABLE visit_ratings 
    ADD COLUMN communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visit_ratings' AND column_name = 'professionalism_rating'
  ) THEN
    ALTER TABLE visit_ratings 
    ADD COLUMN professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visit_ratings' AND column_name = 'timeliness_rating'
  ) THEN
    ALTER TABLE visit_ratings 
    ADD COLUMN timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5);
  END IF;
END $$;

-- Create visit_feedback_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS visit_feedback_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_rating_id UUID NOT NULL REFERENCES visit_ratings(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'excellent_care',
    'on_time',
    'professional',
    'clear_communication',
    'listened_well',
    'late_arrival',
    'rushed_visit',
    'unclear_instructions',
    'equipment_issues',
    'other'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create visit_ratings table
CREATE TABLE IF NOT EXISTS visit_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id UUID REFERENCES clinicians(id),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  feedback_text TEXT,
  would_recommend BOOLEAN,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visit_id, patient_id)
);

-- Create clinician_rating_summary view for analytics
CREATE OR REPLACE VIEW clinician_rating_summary AS
SELECT 
  c.id as clinician_id,
  c.profile_id,
  COUNT(vr.id) as total_ratings,
  ROUND(AVG(vr.overall_rating), 2) as avg_overall_rating,
  ROUND(AVG(vr.care_quality_rating), 2) as avg_care_quality,
  ROUND(AVG(vr.communication_rating), 2) as avg_communication,
  ROUND(AVG(vr.professionalism_rating), 2) as avg_professionalism,
  ROUND(AVG(vr.timeliness_rating), 2) as avg_timeliness,
  COUNT(CASE WHEN vr.would_recommend = TRUE THEN 1 END) as recommend_count,
  ROUND(
    COUNT(CASE WHEN vr.would_recommend = TRUE THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(vr.id), 0) * 100, 
    1
  ) as recommend_percentage
FROM clinicians c
LEFT JOIN visit_ratings vr ON vr.clinician_id = c.id
GROUP BY c.id, c.profile_id;

-- Function to calculate patient satisfaction score (HCAHPS-like)
CREATE OR REPLACE FUNCTION calculate_patient_satisfaction(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_responses BIGINT,
  avg_rating NUMERIC,
  top_box_percentage NUMERIC,
  recommend_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(vr.id) as total_responses,
    ROUND(AVG(vr.overall_rating), 2) as avg_rating,
    ROUND(
      COUNT(CASE WHEN vr.overall_rating >= 4 THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(vr.id), 0) * 100, 
      1
    ) as top_box_percentage,
    ROUND(
      COUNT(CASE WHEN vr.would_recommend = TRUE THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(vr.id), 0) * 100, 
      1
    ) as recommend_percentage
  FROM visit_ratings vr
  WHERE vr.created_at >= p_start_date
  AND vr.created_at <= p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending feedback categories
CREATE OR REPLACE FUNCTION get_trending_feedback(
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  category TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_feedback BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_feedback
  FROM visit_feedback_categories vfc
  JOIN visit_ratings vr ON vr.id = vfc.visit_rating_id
  WHERE vr.created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
  
  RETURN QUERY
  SELECT 
    vfc.category,
    COUNT(vfc.id) as count,
    ROUND(COUNT(vfc.id)::NUMERIC / NULLIF(total_feedback, 0) * 100, 1) as percentage
  FROM visit_feedback_categories vfc
  JOIN visit_ratings vr ON vr.id = vfc.visit_rating_id
  WHERE vr.created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  GROUP BY vfc.category
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE visit_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_feedback_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones to avoid conflicts
DROP POLICY IF EXISTS "Patients can view their own ratings" ON visit_ratings;
DROP POLICY IF EXISTS "Patients can create ratings for their visits" ON visit_ratings;
DROP POLICY IF EXISTS "Patients can update their own ratings" ON visit_ratings;
DROP POLICY IF EXISTS "Clinicians can view their ratings" ON visit_ratings;
DROP POLICY IF EXISTS "Admins can view all ratings" ON visit_ratings;
DROP POLICY IF EXISTS "Users can view feedback categories for their ratings" ON visit_feedback_categories;
DROP POLICY IF EXISTS "Patients can create feedback categories" ON visit_feedback_categories;

-- Patients can view and create their own ratings
CREATE POLICY "Patients can view their own ratings"
  ON visit_ratings FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create ratings for their visits"
  ON visit_ratings FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
    AND visit_id IN (
      SELECT id FROM visits WHERE patient_id IN (
        SELECT id FROM patients WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Patients can update their own ratings"
  ON visit_ratings FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

-- Clinicians can view non-anonymous ratings for their visits
CREATE POLICY "Clinicians can view their ratings"
  ON visit_ratings FOR SELECT
  USING (
    clinician_id IN (
      SELECT id FROM clinicians WHERE profile_id = auth.uid()
    )
  );

-- Agency admins can view all ratings
CREATE POLICY "Admins can view all ratings"
  ON visit_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'agency_admin'
    )
  );

-- Feedback categories policies
CREATE POLICY "Users can view feedback categories for their ratings"
  ON visit_feedback_categories FOR SELECT
  USING (
    visit_rating_id IN (
      SELECT id FROM visit_ratings 
      WHERE patient_id IN (
        SELECT id FROM patients WHERE profile_id = auth.uid()
      )
      OR clinician_id IN (
        SELECT id FROM clinicians WHERE profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'agency_admin'
      )
    )
  );

CREATE POLICY "Patients can create feedback categories"
  ON visit_feedback_categories FOR INSERT
  WITH CHECK (
    visit_rating_id IN (
      SELECT id FROM visit_ratings 
      WHERE patient_id IN (
        SELECT id FROM patients WHERE profile_id = auth.uid()
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_visit_ratings_visit_id ON visit_ratings(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_ratings_patient_id ON visit_ratings(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_ratings_clinician_id ON visit_ratings(clinician_id);
CREATE INDEX IF NOT EXISTS idx_visit_ratings_created_at ON visit_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_visit_ratings_overall_rating ON visit_ratings(overall_rating);
CREATE INDEX IF NOT EXISTS idx_visit_feedback_categories_rating_id ON visit_feedback_categories(visit_rating_id);
CREATE INDEX IF NOT EXISTS idx_visit_feedback_categories_category ON visit_feedback_categories(category);

-- Drop existing trigger before creating to avoid conflicts
DROP TRIGGER IF EXISTS update_visit_ratings_updated_at ON visit_ratings;

-- Add updated_at trigger
CREATE TRIGGER update_visit_ratings_updated_at
  BEFORE UPDATE ON visit_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
