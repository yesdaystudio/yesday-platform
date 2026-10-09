alter table public.rsvp_responses replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rsvp_responses'
  ) then
    alter publication supabase_realtime add table public.rsvp_responses;
  end if;
end
$$;
