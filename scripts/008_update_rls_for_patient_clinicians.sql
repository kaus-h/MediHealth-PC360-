-- Update RLS policies to use patient_clinicians table for access control

-- Drop old policies that relied on visits table for clinician access
drop policy if exists "Patients can view their own data" on public.patients;
drop policy if exists "View care plans" on public.care_plans;
drop policy if exists "View care plan goals" on public.care_plan_goals;
drop policy if exists "View visit documentation" on public.visit_documentation;
drop policy if exists "View documents" on public.documents;

-- Recreate patients policies with patient_clinicians support
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
    or exists (
      select 1 from public.patient_clinicians pc
      join public.clinicians cl on cl.id = pc.clinician_id
      where pc.patient_id = patients.id
      and cl.profile_id = auth.uid()
      and pc.revoked_at is null
    )
  );

-- Recreate care plans policies with patient_clinicians support
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
      join public.caregivers c on c.id = pc.caregiver_id
      join public.patients p on p.id = pc.patient_id
      where p.id = care_plans.patient_id
      and c.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.patient_clinicians pc
      join public.clinicians cl on cl.id = pc.clinician_id
      where pc.patient_id = care_plans.patient_id
      and cl.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
  );

-- Recreate care plan goals policies with patient_clinicians support
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
      join public.caregivers c on c.id = pc.caregiver_id
      where cp.id = care_plan_goals.care_plan_id
      and c.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.care_plans cp
      join public.patient_clinicians pc on pc.patient_id = cp.patient_id
      join public.clinicians cl on cl.id = pc.clinician_id
      where cp.id = care_plan_goals.care_plan_id
      and cl.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
  );

-- Recreate visit documentation policies with patient_clinicians support
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
      join public.caregivers c on c.id = pc.caregiver_id
      where v.id = visit_documentation.visit_id
      and c.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.visits v
      join public.patient_clinicians pc on pc.patient_id = v.patient_id
      join public.clinicians cl on cl.id = pc.clinician_id
      where v.id = visit_documentation.visit_id
      and cl.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.visits v
      join public.clinicians cl on cl.id = v.clinician_id
      where v.id = visit_documentation.visit_id
      and cl.profile_id = auth.uid()
    )
  );

-- Recreate documents policies with patient_clinicians support
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
      join public.caregivers c on c.id = pc.caregiver_id
      where pc.patient_id = documents.patient_id
      and c.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or exists (
      select 1 from public.patient_clinicians pc
      join public.clinicians cl on cl.id = pc.clinician_id
      where pc.patient_id = documents.patient_id
      and cl.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
    or uploaded_by = auth.uid()
  );

-- Add policy for clinicians to manage care plans for their patients
create policy "Clinicians can manage care plans for their patients"
  on public.care_plans for all
  using (
    exists (
      select 1 from public.patient_clinicians pc
      join public.clinicians cl on cl.id = pc.clinician_id
      where pc.patient_id = care_plans.patient_id
      and cl.profile_id = auth.uid()
      and pc.can_document = true
      and pc.revoked_at is null
    )
  );

-- Add policy for clinicians to upload documents for their patients
create policy "Clinicians can upload documents for their patients"
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
        join public.caregivers c on c.id = pc.caregiver_id
        where pc.patient_id = documents.patient_id
        and c.profile_id = auth.uid()
        and pc.revoked_at is null
      )
      or exists (
        select 1 from public.patient_clinicians pc
        join public.clinicians cl on cl.id = pc.clinician_id
        where pc.patient_id = documents.patient_id
        and cl.profile_id = auth.uid()
        and pc.can_document = true
        and pc.revoked_at is null
      )
    )
  );
