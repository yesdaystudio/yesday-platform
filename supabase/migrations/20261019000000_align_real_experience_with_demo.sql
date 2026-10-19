alter table public.projects
  add column if not exists design_font_variant text not null default 'serif',
  add column if not exists design_text_color text not null default 'primary';

alter table public.rsvp_responses
  add column if not exists transport text;
