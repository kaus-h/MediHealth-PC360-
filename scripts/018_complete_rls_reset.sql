-- Complete RLS Reset for Patients Table
-- This script completely removes all policies and creates ONE simple policy

-- Drop ALL existing policies on patients table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'patients' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.patients';
    END LOOP;
END $$;

-- Create ONE simple policy with NO joins or subqueries
CREATE POLICY "patients_own_data_only"
  ON public.patients
  FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Grant access to the accessible_patients view for all authenticated users
GRANT SELECT ON public.accessible_patients TO authenticated;

COMMENT ON POLICY "patients_own_data_only" ON public.patients IS 
'Simple policy: patients can only access their own data directly. Caregivers, clinicians, and physicians must use the accessible_patients view.';
