create table if not exists public.invitation_recipients (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  recipient_type text not null default 'individual'
    check (recipient_type in ('individual', 'couple', 'family')),
  recipient_label text not null check (char_length(trim(recipient_label)) between 1 and 120),
  salutation text check (salutation is null or char_length(trim(salutation)) between 1 and 160),
  token text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitation_recipients_project_id_idx
  on public.invitation_recipients(project_id, created_at);

alter table public.invitation_recipients enable row level security;

drop policy if exists "Signature and Atelier owners can view invitation recipients" on public.invitation_recipients;
create policy "Signature and Atelier owners can view invitation recipients"
on public.invitation_recipients for select to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = invitation_recipients.project_id
      and projects.owner_user_id = auth.uid()
      and lower(coalesce(projects.package_type, '')) in ('signature', 'atelier')
  )
);

drop policy if exists "Signature and Atelier owners can create invitation recipients" on public.invitation_recipients;
create policy "Signature and Atelier owners can create invitation recipients"
on public.invitation_recipients for insert to authenticated
with check (
  exists (
    select 1 from public.projects
    where projects.id = invitation_recipients.project_id
      and projects.owner_user_id = auth.uid()
      and lower(coalesce(projects.package_type, '')) in ('signature', 'atelier')
  )
);

drop policy if exists "Signature and Atelier owners can update invitation recipients" on public.invitation_recipients;
create policy "Signature and Atelier owners can update invitation recipients"
on public.invitation_recipients for update to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = invitation_recipients.project_id
      and projects.owner_user_id = auth.uid()
      and lower(coalesce(projects.package_type, '')) in ('signature', 'atelier')
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = invitation_recipients.project_id
      and projects.owner_user_id = auth.uid()
      and lower(coalesce(projects.package_type, '')) in ('signature', 'atelier')
  )
);

drop policy if exists "Signature and Atelier owners can delete invitation recipients" on public.invitation_recipients;
create policy "Signature and Atelier owners can delete invitation recipients"
on public.invitation_recipients for delete to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = invitation_recipients.project_id
      and projects.owner_user_id = auth.uid()
      and lower(coalesce(projects.package_type, '')) in ('signature', 'atelier')
  )
);

alter table public.rsvp_responses
  add column if not exists invitation_recipient_id uuid
  references public.invitation_recipients(id) on delete set null;

create unique index if not exists rsvp_responses_invitation_recipient_id_unique
  on public.rsvp_responses(invitation_recipient_id)
  where invitation_recipient_id is not null;

-- RSVP answers contain private guest details. Public visitors only need INSERT.
drop policy if exists "Allow public RSVP reads" on public.rsvp_responses;
drop policy if exists "Allow authenticated RSVP select" on public.rsvp_responses;
create policy "Project owners can view RSVP responses"
on public.rsvp_responses for select to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = rsvp_responses.project_id
      and projects.owner_user_id = auth.uid()
  )
);

comment on table public.invitation_recipients is
  'Signature and Atelier recipient list for personalized QR cards. Public access is only through server routes using an unguessable token.';

