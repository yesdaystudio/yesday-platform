export function buildGoogleCalendarUrl(project, locationOverride) {
  const datePart = normalizeDatePart(project?.wedding_date)
  const startTimePart = normalizeTimePart(project?.ceremony_time || '15:00:00')
  const endTimePart = normalizeTimePart(project?.end_time || '23:59:00')
  const location = locationOverride ?? [project?.venue_name, project?.venue_address].filter(Boolean).join(', ')
  const title = project?.couple_display_name
    ? `Svadba ${project.couple_display_name}`
    : 'Svadobný deň'

  const details = [
    'Tešíme sa na spoločný svadobný deň.',
    project?.venue_name ? `Miesto: ${project.venue_name}` : null,
    project?.venue_address ? `Adresa: ${project.venue_address}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(title)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}` +
    `&dates=${datePart}T${startTimePart}/${datePart}T${endTimePart}`
  )
}

function normalizeDatePart(value) {
  if (!value) return '20260101'
  return String(value).replaceAll('-', '')
}

function normalizeTimePart(value) {
  if (!value) return '150000'
  const compact = String(value).replaceAll(':', '')
  return compact.padEnd(6, '0').slice(0, 6)
}
