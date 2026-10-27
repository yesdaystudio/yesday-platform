alter table public.projects
  add column if not exists accommodation_reminder_days smallint,
  add column if not exists accommodation_reminder_setting_updated_at timestamptz,
  add column if not exists accommodation_reminder_resend_confirmed_for_date date,
  add column if not exists timezone text not null default 'Europe/Bratislava';

alter table public.projects
  drop constraint if exists projects_accommodation_reminder_days_check;

alter table public.projects
  add constraint projects_accommodation_reminder_days_check
  check (accommodation_reminder_days is null or accommodation_reminder_days in (1, 2));

create or replace function public.set_accommodation_reminder_setting_timestamp()
returns trigger
language plpgsql
as $$
begin
  if new.accommodation_reminder_days is distinct from old.accommodation_reminder_days then
    new.accommodation_reminder_setting_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists projects_set_accommodation_reminder_setting_timestamp on public.projects;
create trigger projects_set_accommodation_reminder_setting_timestamp
before update of accommodation_reminder_days on public.projects
for each row execute function public.set_accommodation_reminder_setting_timestamp();

create table if not exists public.accommodation_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  rsvp_response_id uuid not null references public.rsvp_responses(id) on delete cascade,
  wedding_date date not null,
  reminder_days smallint not null check (reminder_days in (1, 2)),
  status text not null default 'processing'
    check (status in ('processing', 'accepted', 'failed', 'needs_review')),
  idempotency_key text not null,
  payload_snapshot jsonb not null,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  accepted_at timestamptz,
  resend_email_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rsvp_response_id, wedding_date),
  unique (idempotency_key)
);

create index if not exists accommodation_reminder_deliveries_project_id_idx
  on public.accommodation_reminder_deliveries(project_id);

create index if not exists accommodation_reminder_deliveries_status_idx
  on public.accommodation_reminder_deliveries(status, created_at);

alter table public.accommodation_reminder_deliveries enable row level security;

grant select on public.accommodation_reminder_deliveries to authenticated;

drop policy if exists "Project owners can view accommodation reminders" on public.accommodation_reminder_deliveries;
create policy "Project owners can view accommodation reminders"
  on public.accommodation_reminder_deliveries for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = accommodation_reminder_deliveries.project_id
        and projects.owner_user_id = auth.uid()
    )
  );

comment on column public.projects.accommodation_reminder_days is
  'NULL disables automatic reminders. Existing projects stay disabled; new checkout projects set this to 2 explicitly.';

comment on column public.projects.accommodation_reminder_resend_confirmed_for_date is
  'Explicit client approval to send reminders again after the wedding date changes.';

comment on column public.accommodation_reminder_deliveries.status is
  'accepted means the provider accepted the request; it does not prove inbox delivery.';
