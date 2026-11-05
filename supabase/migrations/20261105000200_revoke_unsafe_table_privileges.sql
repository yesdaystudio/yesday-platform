-- RLS does not govern TRUNCATE. No browser role needs DDL-like capabilities.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('revoke truncate, references, trigger on public.%I from public, anon, authenticated',t.tablename);
  end loop;
end $$;
alter default privileges in schema public revoke truncate, references, trigger on tables from public, anon, authenticated;
notify pgrst, 'reload schema';
