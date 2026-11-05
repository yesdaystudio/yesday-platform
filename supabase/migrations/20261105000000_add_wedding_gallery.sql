-- Access goes through authenticated owner APIs or the published guest loader.
create table public.wedding_galleries (
  project_id uuid primary key references public.projects(id) on delete cascade,
  title text not null default 'Spomienky na náš deň' check (char_length(title) between 1 and 100),
  introduction text not null default '' check (char_length(introduction) <= 600),
  published boolean not null default false
);
create table public.wedding_gallery_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.wedding_galleries(project_id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 180),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (storage_path = project_id::text || '/' || id::text || '.jpg')
);
create index wedding_gallery_photos_project_order_idx on public.wedding_gallery_photos(project_id, sort_order, created_at);
alter table public.wedding_galleries enable row level security;
alter table public.wedding_gallery_photos enable row level security;
revoke all on public.wedding_galleries, public.wedding_gallery_photos from anon, authenticated;
grant all on public.wedding_galleries, public.wedding_gallery_photos to service_role;

-- Lock the parent so concurrent uploads cannot bypass the photo limit.
create function public.enforce_wedding_gallery_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform 1 from public.wedding_galleries where project_id = new.project_id for update;
  if (select count(*) from public.wedding_gallery_photos where project_id = new.project_id) >= 100 then
    raise exception 'Gallery photo limit reached' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger wedding_gallery_limit before insert on public.wedding_gallery_photos
  for each row execute function public.enforce_wedding_gallery_limit();
revoke all on function public.enforce_wedding_gallery_limit() from public;

-- Atomic reordering avoids partial saves and rejects foreign/duplicate IDs.
create function public.reorder_wedding_gallery(p_project_id uuid, p_ids uuid[]) returns void
language plpgsql set search_path = '' as $$
begin
  perform 1 from public.wedding_galleries where project_id = p_project_id for update;
  if cardinality(p_ids) <> (select count(*) from public.wedding_gallery_photos where project_id = p_project_id)
    or cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) as t(id))
    or exists (select 1 from unnest(p_ids) as t(id) where not exists
      (select 1 from public.wedding_gallery_photos p where p.id = t.id and p.project_id = p_project_id)) then
    raise exception 'Gallery changed; reload before reordering';
  end if;
  update public.wedding_gallery_photos p set sort_order = t.position::integer
  from unnest(p_ids) with ordinality as t(id, position)
  where p.id = t.id and p.project_id = p_project_id;
end;
$$;
revoke all on function public.reorder_wedding_gallery(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_wedding_gallery(uuid, uuid[]) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-gallery', 'wedding-gallery', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;
