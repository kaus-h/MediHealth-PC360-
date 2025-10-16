-- Create accessible_clinicians view to allow patients to access their clinicians' data
-- This follows the same pattern as accessible_patients view

-- First, ensure clinicians table has proper RLS policy
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'clinicians' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.clinicians';
    END LOOP;
END $$;

-- Create simple policy for clinicians table - only allow own data
CREATE POLICY "clinicians_own_data_only"
  ON public.clinicians
  FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.clinicians ENABLE ROW LEVEL SECURITY;

-- Create view that patients can use to access their clinicians' data
CREATE OR REPLACE VIEW accessible_clinicians AS
SELECT DISTINCT
  c.*,
  CASE
    WHEN c.profile_id = auth.uid() THEN 'owner'
    WHEN EXISTS (
      SELECT 1 FROM patient_clinicians pc
      JOIN patients p ON p.id = pc.patient_id
      WHERE pc.clinician_id = c.id
      AND p.profile_id = auth.uid()
      AND pc.revoked_at IS NULL
    ) THEN 'patient'
    ELSE NULL
  END as access_type
FROM clinicians c
WHERE 
  c.profile_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM patient_clinicians pc
    JOIN patients p ON p.id = pc.patient_id
    WHERE pc.clinician_id = c.id
    AND p.profile_id = auth.uid()
    AND pc.revoked_at IS NULL
  );

-- Grant access to the view
GRANT SELECT ON accessible_clinicians TO authenticated;

COMMENT ON VIEW accessible_clinicians IS 
'View that allows patients to access data for clinicians they have relationships with, and clinicians to access their own data.';
