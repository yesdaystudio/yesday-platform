alter table public.rsvp_responses
  add column if not exists accommodation_hotel text,
  add column if not exists accommodation_room text,
  add column if not exists accommodation_internal_note text;

create table if not exists public.accommodation_options (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  address text,
  check_in text,
  check_out text,
  guest_note text,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create index if not exists accommodation_options_project_id_idx
  on public.accommodation_options(project_id);

grant select, insert, update, delete on public.accommodation_options to authenticated;

alter table public.rsvp_responses
  add column if not exists accommodation_option_id uuid references public.accommodation_options(id) on delete set null;

alter table public.accommodation_options enable row level security;

drop policy if exists "Project owners can view accommodation options" on public.accommodation_options;
create policy "Project owners can view accommodation options"
  on public.accommodation_options for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = accommodation_options.project_id
        and projects.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Project owners can create accommodation options" on public.accommodation_options;
create policy "Project owners can create accommodation options"
  on public.accommodation_options for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = accommodation_options.project_id
        and projects.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Project owners can update accommodation options" on public.accommodation_options;
create policy "Project owners can update accommodation options"
  on public.accommodation_options for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = accommodation_options.project_id
        and projects.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = accommodation_options.project_id
        and projects.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Project owners can delete accommodation options" on public.accommodation_options;
create policy "Project owners can delete accommodation options"
  on public.accommodation_options for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = accommodation_options.project_id
        and projects.owner_user_id = auth.uid()
    )
  );

insert into public.accommodation_options (project_id, name, address, check_in, check_out, guest_note)
select
  project_id,
  trim(accommodation_hotel),
  max(accommodation_hotel_address),
  max(accommodation_check_in),
  max(accommodation_check_out),
  max(accommodation_guest_note)
from public.rsvp_responses
where nullif(trim(accommodation_hotel), '') is not null
group by project_id, trim(accommodation_hotel)
on conflict (project_id, name) do nothing;

update public.rsvp_responses as response
set accommodation_option_id = option.id
from public.accommodation_options as option
where response.project_id = option.project_id
  and trim(response.accommodation_hotel) = option.name
  and response.accommodation_option_id is null;
