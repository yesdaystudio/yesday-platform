-- Deploy the server-side guest loaders before applying this migration.
-- Guests use narrowly filtered server endpoints; authenticated clients own rows.
alter table public.projects enable row level security;
alter table public.website_content enable row level security;
alter table public.schedule_items enable row level security;

-- Remove old column-level grants as well as broad table-level grants.
do $$
declare t text; cols text; p record;
begin
  foreach t in array array['projects','website_content','schedule_items','rsvp_responses'] loop
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    select string_agg(quote_ident(column_name), ',') into cols
      from information_schema.columns where table_schema='public' and table_name=t;
    execute format('revoke select (%s), insert (%s), update (%s), references (%s) on public.%I from public, anon, authenticated',cols,cols,cols,cols,t);
    for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I',p.policyname,t);
    end loop;
  end loop;
end $$;

grant select on public.projects to authenticated;
grant update (
  couple_display_name, wedding_date, ceremony_time, reception_time,
  venue_name, venue_address, reception_venue_name, reception_venue_address,
  design_font_variant, design_text_color,
  accommodation_reminder_days, accommodation_reminder_resend_confirmed_for_date
) on public.projects to authenticated;
create policy "Owners read their projects" on public.projects for select to authenticated
  using (owner_user_id = (select auth.uid()));
create policy "Owners edit their projects" on public.projects for update to authenticated
  using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

grant select, insert, update, delete on public.website_content, public.schedule_items to authenticated;
create policy "Owners manage website content" on public.website_content for all to authenticated
  using (exists (select 1 from public.projects p where p.id=website_content.project_id and p.owner_user_id=(select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id=website_content.project_id and p.owner_user_id=(select auth.uid())));
create policy "Owners manage schedule" on public.schedule_items for all to authenticated
  using (exists (select 1 from public.projects p where p.id=schedule_items.project_id and p.owner_user_id=(select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id=schedule_items.project_id and p.owner_user_id=(select auth.uid())));

-- RSVP submission goes through validated server APIs, never direct REST inserts.
grant select, delete on public.rsvp_responses to authenticated;
grant update (accommodation_option_id, accommodation_hotel, accommodation_room,
  accommodation_internal_note, accommodation_email_sent_at) on public.rsvp_responses to authenticated;
create policy "Owners read guest responses" on public.rsvp_responses for select to authenticated
  using (exists (select 1 from public.projects p where p.id=rsvp_responses.project_id and p.owner_user_id=(select auth.uid())));
create policy "Owners delete guest responses" on public.rsvp_responses for delete to authenticated
  using (exists (select 1 from public.projects p where p.id=rsvp_responses.project_id and p.owner_user_id=(select auth.uid())));
create policy "Premium owners manage guest accommodation" on public.rsvp_responses for update to authenticated
  using (exists (select 1 from public.projects p where p.id=rsvp_responses.project_id and p.owner_user_id=(select auth.uid()) and p.package_type in ('signature','atelier')))
  with check (exists (select 1 from public.projects p where p.id=rsvp_responses.project_id and p.owner_user_id=(select auth.uid()) and p.package_type in ('signature','atelier')));

grant all on public.projects, public.website_content, public.schedule_items, public.rsvp_responses to service_role;
notify pgrst, 'reload schema';
