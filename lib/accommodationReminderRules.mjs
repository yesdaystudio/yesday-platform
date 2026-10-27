export const ACCOMMODATION_PACKAGES = new Set(['signature', 'atelier'])
export const DEFAULT_REMINDER_TIMEZONE = 'Europe/Bratislava'
export const REMINDER_CRON_UTC_HOUR = 8
export const REMINDER_CRON_WINDOW_HOURS = 1

const ACCEPTED_STATUS = 'accepted'

export function canUseAccommodation(packageType) {
  return ACCOMMODATION_PACKAGES.has(String(packageType || '').trim().toLowerCase())
}

export function normalizeReminderDays(value) {
  const days = Number(value)
  return days === 1 || days === 2 ? days : null
}

export function getDateInTimeZone(value = new Date(), timeZone = DEFAULT_REMINDER_TIMEZONE) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || DEFAULT_REMINDER_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    return `${values.year}-${values.month}-${values.day}`
  } catch {
    return getDateInTimeZone(date, DEFAULT_REMINDER_TIMEZONE)
  }
}

export function getCalendarDayDifference(laterDate, earlierDate) {
  const later = parseDateOnly(laterDate)
  const earlier = parseDateOnly(earlierDate)
  if (!later || !earlier) return null
  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000)
}

export function getReminderDate(weddingDate, reminderDays) {
  const wedding = parseDateOnly(weddingDate)
  const days = normalizeReminderDays(reminderDays)
  if (!wedding || !days) return null
  wedding.setUTCDate(wedding.getUTCDate() - days)
  return formatUtcDate(wedding)
}

export function getReminderWindow(weddingDate, reminderDays) {
  const reminderDate = getReminderDate(weddingDate, reminderDays)
  if (!reminderDate) return null
  const start = new Date(`${reminderDate}T${String(REMINDER_CRON_UTC_HOUR).padStart(2, '0')}:00:00.000Z`)
  const end = new Date(start.getTime() + REMINDER_CRON_WINDOW_HOURS * 3_600_000)
  return { reminderDate, start, end }
}

export function isReminderDueNow(project, now = new Date()) {
  const days = normalizeReminderDays(project?.accommodation_reminder_days)
  if (!days || !canUseAccommodation(project?.package_type) || !project?.wedding_date) return false
  if (!isProjectEligible(project)) return false

  const timeZone = project.timezone || DEFAULT_REMINDER_TIMEZONE
  const localDate = getDateInTimeZone(now, timeZone)
  const daysUntilWedding = getCalendarDayDifference(project.wedding_date, localDate)
  if (daysUntilWedding !== days) return false

  const window = getReminderWindow(project.wedding_date, days)
  const current = now instanceof Date ? now : new Date(now)
  if (!window || Number.isNaN(current.getTime()) || current < window.start || current >= window.end) return false

  const configuredAt = project.accommodation_reminder_setting_updated_at
    ? new Date(project.accommodation_reminder_setting_updated_at)
    : null
  return Boolean(configuredAt && !Number.isNaN(configuredAt.getTime()) && configuredAt <= window.start)
}

export function hasAcceptedReminderForAnotherDate(deliveries, weddingDate) {
  return (deliveries || []).some((delivery) => (
    delivery.status === ACCEPTED_STATUS && delivery.wedding_date !== weddingDate
  ))
}

export function requiresDateChangeConfirmation(project, deliveries) {
  if (!project?.wedding_date) return false
  if (!hasAcceptedReminderForAnotherDate(deliveries, project.wedding_date)) return false
  return project.accommodation_reminder_resend_confirmed_for_date !== project.wedding_date
}

export function getReminderStatus({ project, guest, deliveries = [], now = new Date() }) {
  if (!canUseAccommodation(project?.package_type)) return status('not_applicable', 'Nevzťahuje sa', 'Balík neobsahuje manažment ubytovania.')

  const days = normalizeReminderDays(project?.accommodation_reminder_days)
  if (!days) return status('disabled', 'Vypnutá', 'Automatická pripomienka je vypnutá.')
  if (!project?.wedding_date) return status('not_applicable', 'Nevzťahuje sa', 'Chýba dátum svadby.')

  const email = guest?.contact_email || guest?.email
  const accommodationId = guest?.assignedAccommodationId || guest?.accommodation_option_id
  const initialSentAt = guest?.emailSentAt || guest?.accommodation_email_sent_at
  if (!email) return status('not_applicable', 'Nevzťahuje sa', 'Hosť nemá e-mailovú adresu.')
  if (!accommodationId) return status('not_applicable', 'Nevzťahuje sa', 'Hosť nemá priradené ubytovanie.')
  if (!initialSentAt) return status('not_applicable', 'Najprv odošlite informácie', 'Pripomienka nadväzuje na prvý e-mail o ubytovaní.')

  const guestDeliveries = deliveries.filter((delivery) => (
    delivery.rsvp_response_id === guest.id
  ))
  const currentDelivery = guestDeliveries.find((delivery) => delivery.wedding_date === project.wedding_date)
  if (currentDelivery?.status === 'accepted') {
    return status('accepted', 'Odoslaná', 'E-mail prijala služba Resend.', currentDelivery.accepted_at)
  }
  if (currentDelivery?.status === 'needs_review') {
    return status('needs_review', 'Vyžaduje kontrolu', 'Nie je bezpečné automaticky zopakovať odoslanie.')
  }
  if (currentDelivery?.status === 'failed') {
    return status('failed', 'Neúspešná', 'Služba e-mail odmietla. Správu je potrebné skontrolovať.')
  }
  if (currentDelivery?.status === 'processing') {
    return status('processing', 'Spracováva sa', 'Pripomienka sa práve odosiela.')
  }

  if (requiresDateChangeConfirmation(project, deliveries)) {
    return status('confirmation_required', 'Čaká na potvrdenie', 'Dátum svadby sa po odoslaní pripomienky zmenil.')
  }

  if (!isProjectEligible(project)) return status('not_applicable', 'Nevzťahuje sa', 'Projekt nie je aktívny alebo zaplatený.')

  const timeZone = project.timezone || DEFAULT_REMINDER_TIMEZONE
  const localDate = getDateInTimeZone(now, timeZone)
  const daysUntilWedding = getCalendarDayDifference(project.wedding_date, localDate)
  if (daysUntilWedding === null || daysUntilWedding <= 0) {
    return status('expired', 'Termín uplynul', 'Pripomienka sa spätne neodošle.')
  }

  const window = getReminderWindow(project.wedding_date, days)
  const current = now instanceof Date ? now : new Date(now)
  const configuredAt = project.accommodation_reminder_setting_updated_at
    ? new Date(project.accommodation_reminder_setting_updated_at)
    : null

  if (!window || !configuredAt || Number.isNaN(configuredAt.getTime())) {
    return status('missed', 'Termín uplynul', 'Nastavenie nemá platný čas aktivácie.')
  }
  if (configuredAt > window.start) {
    return status('missed', 'Termín uplynul', 'Pripomienka bola zapnutá až po plánovanom čase.')
  }
  if (daysUntilWedding < days || current >= window.end) {
    return status('missed', 'Termín uplynul', 'Pripomienka sa spätne neodošle.')
  }
  if (current >= window.start) {
    return status('processing_window', 'Čaká na dnešné spracovanie', 'Automatické odoslanie prebehne v rannom intervale.')
  }

  return status('scheduled', 'Naplánovaná', `Odošle sa ${formatDateSk(window.reminderDate)} ráno.`, window.start.toISOString())
}

export function buildReminderIdempotencyKey({ projectId, responseId, weddingDate }) {
  return `accommodation-reminder/${projectId}/${responseId}/${weddingDate}`
}

export function buildReminderEmailData({ project, guest, accommodation, siteUrl }) {
  const cleanSiteUrl = String(siteUrl || '').trim().replace(/\/+$/, '')
  return {
    guestName: guest?.guest_name,
    coupleDisplayName: project?.couple_display_name,
    weddingDate: project?.wedding_date,
    reminderDays: project?.accommodation_reminder_days,
    accommodationName: accommodation?.name,
    address: accommodation?.address,
    room: guest?.accommodation_room,
    checkIn: accommodation?.check_in,
    checkOut: accommodation?.check_out,
    guestNote: accommodation?.guest_note,
    websiteUrl: cleanSiteUrl && project?.slug ? `${cleanSiteUrl}/${project.slug}` : '',
  }
}

export function getFinalDeliveryStatus({ deliveryUncertain = false } = {}) {
  return deliveryUncertain ? 'needs_review' : 'failed'
}

export function isProjectEligible(project) {
  const projectStatus = String(project?.project_status || '').trim().toLowerCase()
  const paymentStatus = String(project?.payment_status || '').trim().toLowerCase()
  if (projectStatus && projectStatus !== 'active') return false
  if (paymentStatus && paymentStatus !== 'paid') return false
  return true
}

function status(code, label, detail, timestamp = null) {
  return { code, label, detail, timestamp }
}

function parseDateOnly(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return Number.isNaN(date.getTime()) ? null : date
}

function formatUtcDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function formatDateSk(value) {
  const date = parseDateOnly(value)
  if (!date) return value
  return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)
}
