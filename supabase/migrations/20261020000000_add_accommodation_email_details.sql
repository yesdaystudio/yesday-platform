alter table public.rsvp_responses
  add column if not exists accommodation_hotel_address text,
  add column if not exists accommodation_check_in text,
  add column if not exists accommodation_check_out text,
  add column if not exists accommodation_guest_note text;
