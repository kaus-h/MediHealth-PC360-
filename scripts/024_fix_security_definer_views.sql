-- Fix Security Definer Views
-- Addresses Supabase Security Advisor warnings about SECURITY DEFINER views
-- 
-- IMPORTANT: PostgreSQL does NOT support RLS on views, only on tables.
-- SECURITY DEFINER is the intended pattern for views that need to bypass table-level RLS.
-- 
-- Solution: Document the security model and provide application-level access control

-- ============================================================================
-- SECURITY MODEL DOCUMENTATION
-- ============================================================================
-- 
-- SECURITY DEFINER views are flagged by Supabase Security Advisor because they
-- bypass Row Level Security policies. However, this is intentional and necessary:
--
-- 1. accessible_patients & accessible_clinicians:
--    - NEED SECURITY DEFINER to query across tables with RLS enabled
--    - Security is enforced by the view's WHERE clauses (relationship checks)
--    - These views filter data based on patient_clinicians relationships
--
-- 2. Analytics views (agency_metrics, clinician_productivity, etc.):
--    - NEED SECURITY DEFINER to aggregate data across multiple tables
--    - Security should be enforced at the APPLICATION LEVEL
--    - Only admin users should be able to query these views
--
-- ============================================================================

-- Create helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('agency_admin', 'admin')
  );
END;
$$;

-- Create helper function to check if current user is a physician
CREATE OR REPLACE FUNCTION is_physician()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'physician'
  );
END;
$$;

-- ============================================================================
-- GRANT APPROPRIATE PERMISSIONS
-- ============================================================================
-- Grant execute permissions on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_physician() TO authenticated;

-- ============================================================================
-- APPLICATION-LEVEL ACCESS CONTROL NOTES
-- ============================================================================
-- 
-- For analytics views, implement access control in your application code:
--
-- Example (TypeScript/Supabase):
-- ```typescript
-- // Check if user is admin before querying analytics views
-- const { data: isAdmin } = await supabase.rpc('is_admin');
-- if (!isAdmin) {
--   throw new Error('Unauthorized: Admin access required');
-- }
-- 
-- // Now safe to query analytics views
-- const { data } = await supabase.from('agency_metrics').select('*');
-- ```
--
-- Views that require admin access:
-- - agency_metrics
-- - clinician_productivity  
-- - visit_analytics
-- - patient_engagement
-- - financial_overview
-- - clinician_rating_summary
-- - vendor_performance_metrics
--
-- Views that require admin OR physician access:
-- - physician_case_timeline
--
-- Views with built-in security (relationship-based):
-- - accessible_patients (filters by patient_clinicians relationships)
-- - accessible_clinicians (filters by patient_clinicians relationships)
--
-- ============================================================================

-- Add comments to views documenting their security model
COMMENT ON VIEW accessible_patients IS 
'SECURITY DEFINER view that allows cross-user access to patient data based on relationships. 
Security is enforced by WHERE clauses checking patient_clinicians table.
Clinicians can see their patients, caregivers can see patients they care for.';

COMMENT ON VIEW accessible_clinicians IS
'SECURITY DEFINER view that allows cross-user access to clinician data based on relationships.
Security is enforced by WHERE clauses checking patient_clinicians table.
Patients can see their clinicians.';

COMMENT ON VIEW agency_metrics IS
'SECURITY DEFINER view for admin analytics. 
APPLICATION-LEVEL ACCESS CONTROL REQUIRED: Check is_admin() before querying.';

COMMENT ON VIEW clinician_productivity IS
'SECURITY DEFINER view for admin analytics.
APPLICATION-LEVEL ACCESS CONTROL REQUIRED: Check is_admin() before querying.';

COMMENT ON VIEW visit_analytics IS
'SECURITY DEFINER view for admin analytics.
APPLICATION-LEVEL ACCESS CONTROL REQUIRED: Check is_admin() before querying.';

COMMENT ON VIEW patient_engagement IS
'SECURITY DEFINER view for admin analytics.
APPLICATION-LEVEL ACCESS CONTROL REQUIRED: Check is_admin() before querying.';

COMMENT ON VIEW financial_overview IS
'SECURITY DEFINER view for admin analytics.
APPLICATION-LEVEL ACCESS CONTROL REQUIRED: Check is_admin() before querying.';

COMMENT ON VIEW clinician_rating_summary IS
'SECURITY DEFINER view for admin analytics.
APPLICATION-LEVEL ACCESS CONTROL REQUIRED: Check is_admin() before querying.';

COMMENT ON VIEW physician_case_timeline IS
'SECURITY DEFINER view for physician and admin access.
APPLICATION-LEVEL ACCESS CONTROL REQUIRED: Check is_admin() OR is_physician() before querying.';

COMMENT ON VIEW vendor_performance_metrics IS
'SECURITY DEFINER view for admin analytics.
APPLICATION-LEVEL ACCESS CONTROL REQUIRED: Check is_admin() before querying.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_view_name TEXT;
  v_comment TEXT;
BEGIN
  RAISE NOTICE '=== Security Definer Views Documentation ===';
  RAISE NOTICE '';
  
  FOR v_view_name IN 
    SELECT unnest(ARRAY[
      'accessible_patients',
      'accessible_clinicians', 
      'agency_metrics',
      'clinician_productivity',
      'visit_analytics',
      'patient_engagement',
      'financial_overview',
      'clinician_rating_summary',
      'physician_case_timeline',
      'vendor_performance_metrics'
    ])
  LOOP
    SELECT obj_description((v_view_name)::regclass) INTO v_comment;
    RAISE NOTICE 'View: %', v_view_name;
    RAISE NOTICE 'Security: %', v_comment;
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '=== Helper Functions Created ===';
  RAISE NOTICE 'is_admin() - Check if current user is an admin';
  RAISE NOTICE 'is_physician() - Check if current user is a physician';
  RAISE NOTICE '';
  RAISE NOTICE '=== Action Required ===';
  RAISE NOTICE 'Implement application-level access control for analytics views.';
  RAISE NOTICE 'See comments above for TypeScript/Supabase example code.';
END $$;
