alter table public.rsvp_responses
  add column if not exists submission_key uuid;

alter table public.rsvp_responses
  drop constraint if exists rsvp_responses_project_submission_key_unique;

alter table public.rsvp_responses
  add constraint rsvp_responses_project_submission_key_unique
  unique (project_id, submission_key);

drop policy if exists "Project owners can delete RSVP responses" on public.rsvp_responses;
create policy "Project owners can delete RSVP responses"
on public.rsvp_responses for delete to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = rsvp_responses.project_id
      and projects.owner_user_id = auth.uid()
  )
);

comment on column public.rsvp_responses.submission_key is
  'Per-browser-session key used to update an accidentally repeated generic RSVP instead of inserting a duplicate.';
