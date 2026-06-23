alter table public.website_content
  add column if not exists dresscode_palette_enabled boolean not null default false,
  add column if not exists dresscode_palette jsonb not null default '[]'::jsonb;
