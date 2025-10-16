-- MediHealth Database Schema
-- HIPAA-compliant home health patient portal

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User roles enum
create type user_role as enum ('patient', 'caregiver', 'clinician', 'agency_admin', 'vendor');

-- User profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  role user_role not null,
  date_of_birth date,
  address text,
  city text,
  state text,
  zip_code text,
  profile_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Patients table (additional patient-specific data)
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  medical_record_number text unique,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  insurance_provider text,
  insurance_policy_number text,
  primary_diagnosis text,
  admission_date date,
  discharge_date date,
  status text default 'active' check (status in ('active', 'discharged', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Caregivers table (family members, MPOAs)
create table if not exists public.caregivers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship_to_patient text,
  is_mpoa boolean default false,
  mpoa_document_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Patient-Caregiver relationships
create table if not exists public.patient_caregivers (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  caregiver_id uuid not null references public.caregivers(id) on delete cascade,
  access_level text not null default 'view' check (access_level in ('view', 'edit', 'full')),
  can_view_records boolean default true,
  can_message boolean default true,
  can_schedule boolean default false,
  granted_at timestamptz default now(),
  granted_by uuid references public.profiles(id),
  revoked_at timestamptz,
  created_at timestamptz default now(),
  unique(patient_id, caregiver_id)
);

-- Clinicians table (nurses, therapists, aides)
create table if not exists public.clinicians (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  license_number text,
  license_type text,
  specialization text,
  agency_id uuid,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agencies table
create table if not exists public.agencies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  license_number text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add agency foreign key to clinicians
alter table public.clinicians 
  add constraint fk_clinicians_agency 
  foreign key (agency_id) references public.agencies(id) on delete set null;

-- Care plans table
create table if not exists public.care_plans (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  description text,
  start_date date not null,
  end_date date,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Care plan goals
create table if not exists public.care_plan_goals (
  id uuid primary key default uuid_generate_v4(),
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  goal_text text not null,
  target_date date,
  status text default 'in_progress' check (status in ('not_started', 'in_progress', 'completed', 'cancelled')),
  progress_percentage integer default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Visits table
create table if not exists public.visits (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references public.clinicians(id) on delete cascade,
  visit_type text not null check (visit_type in ('nursing', 'physical_therapy', 'occupational_therapy', 'speech_therapy', 'aide', 'other')),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,
  status text default 'scheduled' check (status in ('scheduled', 'en_route', 'in_progress', 'completed', 'cancelled', 'no_show')),
  visit_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Visit documentation
create table if not exists public.visit_documentation (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  vital_signs jsonb,
  assessments jsonb,
  interventions jsonb,
  patient_response text,
  clinician_notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages table (secure HIPAA-compliant messaging)
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  subject text,
  body text not null,
  is_read boolean default false,
  read_at timestamptz,
  parent_message_id uuid references public.messages(id) on delete set null,
  patient_context_id uuid references public.patients(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents table (using Vercel Blob for storage)
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  document_type text not null check (document_type in ('discharge_summary', 'insurance_card', 'order', 'consent_form', 'lab_result', 'other')),
  file_name text not null,
  file_url text not null,
  file_size integer,
  mime_type text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('visit_reminder', 'visit_update', 'message', 'document', 'care_plan_update', 'system')),
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  is_read boolean default false,
  read_at timestamptz,
  action_url text,
  created_at timestamptz default now()
);

-- Audit log for HIPAA compliance
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_profiles_role on public.profiles(role);
create index idx_patients_status on public.patients(status);
create index idx_patient_caregivers_patient on public.patient_caregivers(patient_id);
create index idx_patient_caregivers_caregiver on public.patient_caregivers(caregiver_id);
create index idx_visits_patient on public.visits(patient_id);
create index idx_visits_clinician on public.visits(clinician_id);
create index idx_visits_scheduled_start on public.visits(scheduled_start);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_recipient on public.messages(recipient_id);
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_created on public.notifications(created_at desc);
create index idx_documents_patient on public.documents(patient_id);
create index idx_audit_logs_user on public.audit_logs(user_id);
create index idx_audit_logs_created on public.audit_logs(created_at desc);

-- Updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at_column();

create trigger update_patients_updated_at before update on public.patients
  for each row execute function update_updated_at_column();

create trigger update_caregivers_updated_at before update on public.caregivers
  for each row execute function update_updated_at_column();

create trigger update_clinicians_updated_at before update on public.clinicians
  for each row execute function update_updated_at_column();

create trigger update_agencies_updated_at before update on public.agencies
  for each row execute function update_updated_at_column();

create trigger update_care_plans_updated_at before update on public.care_plans
  for each row execute function update_updated_at_column();

create trigger update_care_plan_goals_updated_at before update on public.care_plan_goals
  for each row execute function update_updated_at_column();

create trigger update_visits_updated_at before update on public.visits
  for each row execute function update_updated_at_column();

create trigger update_visit_documentation_updated_at before update on public.visit_documentation
  for each row execute function update_updated_at_column();

create trigger update_messages_updated_at before update on public.messages
  for each row execute function update_updated_at_column();

create trigger update_documents_updated_at before update on public.documents
  for each row execute function update_updated_at_column();
