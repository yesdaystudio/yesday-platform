// Reception stationery must use the celebration fields, never the ceremony venue
// or a sample location when a client has not filled in their details yet.
export function getReceptionStationeryDetails(project = {}) {
  const name = String(project?.reception_venue_name || '').trim()
  const address = String(project?.reception_venue_address || '').trim()
  const value = String(project?.wedding_date || '').trim()
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : null
  const validDate = parsed && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  const timeValue = String(project?.reception_time || '').slice(0, 5)
  return {
    name,
    address,
    date: validDate ? new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Bratislava' }).format(parsed) : '',
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue) ? timeValue.replace(':', '.') : '',
  }
}
