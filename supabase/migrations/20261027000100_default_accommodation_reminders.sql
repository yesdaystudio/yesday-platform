-- Automatic accommodation reminders are part of Signature and Atelier by default.
-- Essential keeps this feature unavailable. Projects can still turn reminders off.
update public.projects
set
  accommodation_reminder_days = 2,
  accommodation_reminder_setting_updated_at = now()
where lower(coalesce(package_type, '')) in ('signature', 'atelier')
  and accommodation_reminder_days is null;
