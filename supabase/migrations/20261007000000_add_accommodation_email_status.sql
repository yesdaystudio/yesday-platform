alter table public.rsvp_responses
  add column if not exists accommodation_email_sent_at timestamptz;
