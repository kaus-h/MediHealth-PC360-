-- Fix infinite recursion in RLS policies by simplifying them
-- This script drops problematic policies and creates simpler, non-recursive ones

-- Drop existing problematic policies
drop policy if exists "Patients can view their own data" on public.patients;
drop policy if exists "View patient-caregiver relationships" on public.patient_caregivers;
drop policy if exists "View care plans" on public.care_plans;
drop policy if exists "View care plan goals" on public.care_plan_goals;
drop policy if exists "View visits" on public.visits;
drop policy if exists "View visit documentation" on public.visit_documentation;
drop policy if exists "View documents" on public.documents;
drop policy if exists "Upload documents" on public.documents;

-- Create simplified patients policy (no circular dependencies)
create policy "Patients can view their own data"
  on public.patients for select
  using (profile_id = auth.uid());

-- Allow clinicians to view patients they have visits with (using security definer function)
create or replace function public.get_clinician_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.clinicians where profile_id = auth.uid() limit 1;
$$;

create policy "Clinicians can view their patients"
  on public.patients for select
  using (
    exists (
      select 1 from public.visits v
      where v.patient_id = patients.id
      and v.clinician_id = get_clinician_id()
    )
  );

-- Allow caregivers to view their patients (using security definer function)
create or replace function public.get_caregiver_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.caregivers where profile_id = auth.uid() limit 1;
$$;

create policy "Caregivers can view their patients"
  on public.patients for select
  using (
    exists (
      select 1 from public.patient_caregivers pc
      where pc.patient_id = patients.id
      and pc.caregiver_id = get_caregiver_id()
      and pc.revoked_at is null
    )
  );

-- Simplified patient_caregivers policies
create policy "View patient-caregiver relationships"
  on public.patient_caregivers for select
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_caregivers.patient_id
      and p.profile_id = auth.uid()
    )
    or caregiver_id = get_caregiver_id()
  );

-- Simplified care plans policies
create policy "View care plans"
  on public.care_plans for select
  using (
    exists (
      select 1 from public.patients p
      where p.id = care_plans.patient_id
      and p.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.patient_caregivers pc
      where pc.patient_id = care_plans.patient_id
      and pc.caregiver_id = get_caregiver_id()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.visits v
      where v.patient_id = care_plans.patient_id
      and v.clinician_id = get_clinician_id()
    )
  );

-- Simplified care plan goals policies
create policy "View care plan goals"
  on public.care_plan_goals for select
  using (
    exists (
      select 1 from public.care_plans cp
      join public.patients p on p.id = cp.patient_id
      where cp.id = care_plan_goals.care_plan_id
      and p.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.care_plans cp
      join public.patient_caregivers pc on pc.patient_id = cp.patient_id
      where cp.id = care_plan_goals.care_plan_id
      and pc.caregiver_id = get_caregiver_id()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.care_plans cp
      join public.visits v on v.patient_id = cp.patient_id
      where cp.id = care_plan_goals.care_plan_id
      and v.clinician_id = get_clinician_id()
    )
  );

-- Simplified visits policies
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
      where pc.patient_id = visits.patient_id
      and pc.caregiver_id = get_caregiver_id()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or clinician_id = get_clinician_id()
  );

-- Simplified visit documentation policies
create policy "View visit documentation"
  on public.visit_documentation for select
  using (
    exists (
      select 1 from public.visits v
      join public.patients p on p.id = v.patient_id
      where v.id = visit_documentation.visit_id
      and p.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.visits v
      join public.patient_caregivers pc on pc.patient_id = v.patient_id
      where v.id = visit_documentation.visit_id
      and pc.caregiver_id = get_caregiver_id()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.visits v
      where v.id = visit_documentation.visit_id
      and v.clinician_id = get_clinician_id()
    )
  );

-- Simplified documents policies
create policy "View documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.patients p
      where p.id = documents.patient_id
      and p.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.patient_caregivers pc
      where pc.patient_id = documents.patient_id
      and pc.caregiver_id = get_caregiver_id()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.visits v
      where v.patient_id = documents.patient_id
      and v.clinician_id = get_clinician_id()
    )
    or uploaded_by = auth.uid()
  );

create policy "Upload documents"
  on public.documents for insert
  with check (
    uploaded_by = auth.uid()
    and (
      exists (
        select 1 from public.patients p
        where p.id = documents.patient_id
        and p.profile_id = auth.uid()
      )
      or exists (
        select 1 from public.patient_caregivers pc
        where pc.patient_id = documents.patient_id
        and pc.caregiver_id = get_caregiver_id()
        and pc.revoked_at is null
      )
      or exists (
        select 1 from public.visits v
        where v.patient_id = documents.patient_id
        and v.clinician_id = get_clinician_id()
      )
    )
  );
