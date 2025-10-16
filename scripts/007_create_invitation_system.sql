-- Invitation System for MediHealth
-- Allows patients to invite clinicians and vice versa

-- Patient-Clinician relationships table (similar to patient_caregivers)
create table if not exists public.patient_clinicians (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references public.clinicians(id) on delete cascade,
  relationship_type text not null default 'assigned' check (relationship_type in ('primary', 'assigned', 'consulting')),
  access_level text not null default 'standard' check (access_level in ('standard', 'full')),
  can_view_records boolean default true,
  can_message boolean default true,
  can_schedule boolean default true,
  can_document boolean default true,
  assigned_at timestamptz default now(),
  assigned_by uuid references public.profiles(id),
  revoked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(patient_id, clinician_id)
);

-- Invitations table
create table if not exists public.invitations (
  id uuid primary key default uuid_generate_v4(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email text not null,
  invitee_id uuid references public.profiles(id) on delete cascade,
  invitation_type text not null check (invitation_type in ('patient_to_clinician', 'clinician_to_patient')),
  patient_id uuid references public.patients(id) on delete cascade,
  clinician_id uuid references public.clinicians(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  message text,
  expires_at timestamptz default (now() + interval '7 days'),
  responded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index idx_patient_clinicians_patient on public.patient_clinicians(patient_id);
create index idx_patient_clinicians_clinician on public.patient_clinicians(clinician_id);
create index idx_invitations_inviter on public.invitations(inviter_id);
create index idx_invitations_invitee_email on public.invitations(invitee_email);
create index idx_invitations_invitee_id on public.invitations(invitee_id);
create index idx_invitations_status on public.invitations(status);

-- Updated_at trigger for patient_clinicians
create trigger update_patient_clinicians_updated_at before update on public.patient_clinicians
  for each row execute function update_updated_at_column();

-- Updated_at trigger for invitations
create trigger update_invitations_updated_at before update on public.invitations
  for each row execute function update_updated_at_column();

-- Enable RLS
alter table public.patient_clinicians enable row level security;
alter table public.invitations enable row level security;

-- RLS Policies for patient_clinicians

-- Patients can view their assigned clinicians
create policy "Patients can view their clinicians"
  on public.patient_clinicians for select
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_clinicians.patient_id
      and p.profile_id = auth.uid()
    )
  );

-- Clinicians can view their assigned patients
create policy "Clinicians can view their patients"
  on public.patient_clinicians for select
  using (
    exists (
      select 1 from public.clinicians c
      where c.id = patient_clinicians.clinician_id
      and c.profile_id = auth.uid()
    )
  );

-- Caregivers can view patient's clinicians
create policy "Caregivers can view patient clinicians"
  on public.patient_clinicians for select
  using (
    exists (
      select 1 from public.patient_caregivers pc
      join public.caregivers cg on cg.id = pc.caregiver_id
      where pc.patient_id = patient_clinicians.patient_id
      and cg.profile_id = auth.uid()
      and pc.can_view_records = true
      and pc.revoked_at is null
    )
  );

-- RLS Policies for invitations

-- Users can view invitations they sent
create policy "Users can view sent invitations"
  on public.invitations for select
  using (inviter_id = auth.uid());

-- Users can view invitations sent to them (by email or user ID)
create policy "Users can view received invitations"
  on public.invitations for select
  using (
    invitee_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.email = invitations.invitee_email
    )
  );

-- Users can send invitations
create policy "Users can send invitations"
  on public.invitations for insert
  with check (inviter_id = auth.uid());

-- Users can update invitations they received (to accept/decline)
create policy "Users can respond to invitations"
  on public.invitations for update
  using (
    invitee_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.email = invitations.invitee_email
    )
  );

-- Users can cancel invitations they sent
create policy "Users can cancel sent invitations"
  on public.invitations for update
  using (inviter_id = auth.uid());

-- Function to automatically create patient_clinicians relationship when invitation is accepted
create or replace function handle_invitation_acceptance()
returns trigger as $$
begin
  -- Only proceed if status changed to 'accepted'
  if new.status = 'accepted' and old.status = 'pending' then
    -- Set responded_at timestamp
    new.responded_at = now();
    
    -- Create the relationship based on invitation type
    if new.invitation_type = 'patient_to_clinician' then
      -- Patient invited clinician
      insert into public.patient_clinicians (
        patient_id,
        clinician_id,
        relationship_type,
        assigned_by
      ) values (
        new.patient_id,
        new.clinician_id,
        'assigned',
        new.inviter_id
      )
      on conflict (patient_id, clinician_id) do nothing;
      
    elsif new.invitation_type = 'clinician_to_patient' then
      -- Clinician invited patient
      insert into public.patient_clinicians (
        patient_id,
        clinician_id,
        relationship_type,
        assigned_by
      ) values (
        new.patient_id,
        new.clinician_id,
        'assigned',
        new.inviter_id
      )
      on conflict (patient_id, clinician_id) do nothing;
    end if;
    
    -- Create notification for the inviter
    insert into public.notifications (
      user_id,
      title,
      message,
      type,
      priority,
      action_url
    ) values (
      new.inviter_id,
      'Invitation Accepted',
      'Your invitation has been accepted!',
      'system',
      'normal',
      '/dashboard/team'
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to handle invitation acceptance
create trigger on_invitation_acceptance
  before update on public.invitations
  for each row
  when (new.status = 'accepted' and old.status = 'pending')
  execute function handle_invitation_acceptance();

-- Function to expire old invitations
create or replace function expire_old_invitations()
returns void as $$
begin
  update public.invitations
  set status = 'expired'
  where status = 'pending'
  and expires_at < now();
end;
$$ language plpgsql security definer;
