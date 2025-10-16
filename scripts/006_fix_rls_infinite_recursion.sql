-- Fix infinite recursion in RLS policies
-- The issue is circular dependency between patients and visits policies

-- Drop the problematic policies
drop policy if exists "Patients can view their own data" on public.patients;
drop policy if exists "View visits" on public.visits;

-- Recreate patients policy without the visits check to break the cycle
create policy "Patients can view their own data"
  on public.patients for select
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.patient_caregivers pc
      join public.caregivers c on c.id = pc.caregiver_id
      where pc.patient_id = patients.id
      and c.profile_id = auth.uid()
      and pc.revoked_at is null
    )
  );

-- Recreate visits policy with direct clinician check
create policy "View visits"
  on public.visits for select
  using (
    exists (
      select 1 from public.patients p
      where p.id = visits.patient_id
      and p.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.patient_caregivers pc
      join public.caregivers c on c.id = pc.caregiver_id
      where pc.patient_id = visits.patient_id
      and c.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.clinicians cl
      where cl.id = visits.clinician_id
      and cl.profile_id = auth.uid()
    )
  );

-- Add a separate policy for clinicians to view their patients
create policy "Clinicians can view their patients"
  on public.patients for select
  using (
    exists (
      select 1 from public.visits v
      join public.clinicians cl on cl.id = v.clinician_id
      where v.patient_id = patients.id
      and cl.profile_id = auth.uid()
    )
  );
