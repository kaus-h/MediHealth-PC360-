-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.caregivers enable row level security;
alter table public.patient_caregivers enable row level security;
alter table public.clinicians enable row level security;
alter table public.agencies enable row level security;
alter table public.care_plans enable row level security;
alter table public.care_plan_goals enable row level security;
alter table public.visits enable row level security;
alter table public.visit_documentation enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles RLS policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Patients RLS policies
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
      select 1 from public.visits v
      join public.clinicians cl on cl.id = v.clinician_id
      where v.patient_id = patients.id
      and cl.profile_id = auth.uid()
    )
  );

create policy "Patients can update their own data"
  on public.patients for update
  using (profile_id = auth.uid());

create policy "Patients can insert their own data"
  on public.patients for insert
  with check (profile_id = auth.uid());

-- Caregivers RLS policies
create policy "Caregivers can view their own data"
  on public.caregivers for select
  using (profile_id = auth.uid());

create policy "Caregivers can insert their own data"
  on public.caregivers for insert
  with check (profile_id = auth.uid());

create policy "Caregivers can update their own data"
  on public.caregivers for update
  using (profile_id = auth.uid());

-- Patient-Caregiver relationships RLS
create policy "View patient-caregiver relationships"
  on public.patient_caregivers for select
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_caregivers.patient_id
      and p.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.caregivers c
      where c.id = patient_caregivers.caregiver_id
      and c.profile_id = auth.uid()
    )
  );

create policy "Patients can manage caregiver access"
  on public.patient_caregivers for all
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_caregivers.patient_id
      and p.profile_id = auth.uid()
    )
  );

-- Clinicians RLS policies
create policy "Clinicians can view their own data"
  on public.clinicians for select
  using (profile_id = auth.uid());

create policy "Clinicians can update their own data"
  on public.clinicians for update
  using (profile_id = auth.uid());

create policy "Clinicians can insert their own data"
  on public.clinicians for insert
  with check (profile_id = auth.uid());

-- Care plans RLS policies
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
      select 1 from public.visits v
      join public.clinicians cl on cl.id = v.clinician_id
      where v.patient_id = care_plans.patient_id
      and cl.profile_id = auth.uid()
    )
  );

create policy "Clinicians can manage care plans"
  on public.care_plans for all
  using (
    exists (
      select 1 from public.visits v
      join public.clinicians cl on cl.id = v.clinician_id
      where v.patient_id = care_plans.patient_id
      and cl.profile_id = auth.uid()
    )
  );

-- Care plan goals RLS policies
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
      join public.visits v on v.patient_id = cp.patient_id
      join public.clinicians cl on cl.id = v.clinician_id
      where cp.id = care_plan_goals.care_plan_id
      and cl.profile_id = auth.uid()
    )
  );

-- Visits RLS policies
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

create policy "Clinicians can manage their visits"
  on public.visits for all
  using (
    exists (
      select 1 from public.clinicians cl
      where cl.id = visits.clinician_id
      and cl.profile_id = auth.uid()
    )
  );

-- Visit documentation RLS policies
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
      join public.clinicians cl on cl.id = v.clinician_id
      where v.id = visit_documentation.visit_id
      and cl.profile_id = auth.uid()
    )
  );

create policy "Clinicians can manage visit documentation"
  on public.visit_documentation for all
  using (
    exists (
      select 1 from public.visits v
      join public.clinicians cl on cl.id = v.clinician_id
      where v.id = visit_documentation.visit_id
      and cl.profile_id = auth.uid()
    )
  );

-- Messages RLS policies
create policy "Users can view their messages"
  on public.messages for select
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
  );

create policy "Users can send messages"
  on public.messages for insert
  with check (sender_id = auth.uid());

create policy "Users can update their received messages"
  on public.messages for update
  using (recipient_id = auth.uid());

-- Documents RLS policies
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
      select 1 from public.visits v
      join public.clinicians cl on cl.id = v.clinician_id
      where v.patient_id = documents.patient_id
      and cl.profile_id = auth.uid()
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
        join public.caregivers c on c.id = pc.caregiver_id
        where pc.patient_id = documents.patient_id
        and c.profile_id = auth.uid()
        and pc.revoked_at is null
      )
      or exists (
        select 1 from public.visits v
        join public.clinicians cl on cl.id = v.clinician_id
        where v.patient_id = documents.patient_id
        and cl.profile_id = auth.uid()
      )
    )
  );

-- Notifications RLS policies
create policy "Users can view their notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update their notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "System can create notifications"
  on public.notifications for insert
  with check (true);

-- Audit logs RLS policies (read-only for users, write for system)
create policy "Users can view their audit logs"
  on public.audit_logs for select
  using (user_id = auth.uid());

create policy "System can create audit logs"
  on public.audit_logs for insert
  with check (true);
