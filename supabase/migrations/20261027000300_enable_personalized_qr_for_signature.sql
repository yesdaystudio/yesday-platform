drop policy if exists "Atelier owners can view invitation recipients" on public.invitation_recipients;
drop policy if exists "Atelier owners can create invitation recipients" on public.invitation_recipients;
drop policy if exists "Atelier owners can update invitation recipients" on public.invitation_recipients;
drop policy if exists "Atelier owners can delete invitation recipients" on public.invitation_recipients;
drop policy if exists "Signature and Atelier owners can view invitation recipients" on public.invitation_recipients;
drop policy if exists "Signature and Atelier owners can create invitation recipients" on public.invitation_recipients;
drop policy if exists "Signature and Atelier owners can update invitation recipients" on public.invitation_recipients;
drop policy if exists "Signature and Atelier owners can delete invitation recipients" on public.invitation_recipients;

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

comment on table public.invitation_recipients is
  'Signature and Atelier recipient list for personalized QR cards. Public access is only through server routes using an unguessable token.';
