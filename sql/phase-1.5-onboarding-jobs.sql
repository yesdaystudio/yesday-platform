create extension if not exists pgcrypto;

create table if not exists public.onboarding_jobs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_order_id text not null,
  external_event_id text,
  status text not null default 'pending',
  payload_snapshot jsonb,
  auth_user_id uuid,
  project_id uuid,
  slug text,
  error_message text,
  retries integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists onboarding_jobs_provider_order_uidx
  on public.onboarding_jobs (provider, external_order_id);

create unique index if not exists onboarding_jobs_provider_event_uidx
  on public.onboarding_jobs (provider, external_event_id)
  where external_event_id is not null;
