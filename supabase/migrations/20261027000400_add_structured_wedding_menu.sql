alter table public.website_content
  add column if not exists menu_sections jsonb;

comment on column public.website_content.menu_sections is
  'Structured optional wedding menu courses. NULL keeps the legacy menu_intro_text behavior.';
