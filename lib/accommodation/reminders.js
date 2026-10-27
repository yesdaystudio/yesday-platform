import 'server-only'

import { getSupabaseAdmin } from '../supabaseAdmin'
import { createAccommodationReminderEmail } from '../email/templates'
import { sendTransactionalEmail, TransactionalEmailError } from '../email/sender'
import {
  buildReminderEmailData,
  buildReminderIdempotencyKey,
  getFinalDeliveryStatus,
  isReminderDueNow,
  requiresDateChangeConfirmation,
} from '../accommodationReminderRules.mjs'

const MAX_SEND_ATTEMPTS = 3
const STALE_PROCESSING_MINUTES = 15

export async function runAccommodationReminders({ now = new Date(), siteUrl } = {}) {
  const supabase = getSupabaseAdmin()
  const cleanSiteUrl = String(siteUrl || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MINUTES * 60_000).toISOString()

  await supabase
    .from('accommodation_reminder_deliveries')
    .update({
      status: 'needs_review',
      last_error: 'Spracovanie sa prerušilo bez potvrdenia výsledku. Automatické opakovanie bolo zastavené.',
      updated_at: now.toISOString(),
    })
    .eq('status', 'processing')
    .lt('created_at', staleBefore)

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, slug, couple_display_name, wedding_date, timezone, package_type, client_email, payment_status, project_status, accommodation_reminder_days, accommodation_reminder_setting_updated_at, accommodation_reminder_resend_confirmed_for_date')
    .not('accommodation_reminder_days', 'is', null)

  if (projectsError) throw new Error(`Reminder projects query failed: ${projectsError.message}`)
  if (!projects?.length) return emptyResult()

  const projectIds = projects.map((project) => project.id)
  const [jobsResult, deliveriesResult] = await Promise.all([
    supabase
      .from('onboarding_jobs')
      .select('project_id, payload_snapshot')
      .in('project_id', projectIds),
    supabase
      .from('accommodation_reminder_deliveries')
      .select('project_id, wedding_date, status')
      .in('project_id', projectIds),
  ])

  if (jobsResult.error) {
    throw new Error(`Test project verification failed: ${jobsResult.error.message}`)
  }
  if (deliveriesResult.error) {
    throw new Error(`Reminder history query failed: ${deliveriesResult.error.message}`)
  }

  const testProjectIds = new Set(
    (jobsResult.data || [])
      .filter((job) => job.payload_snapshot?.test_mode === true)
      .map((job) => job.project_id)
  )
  const deliveriesByProject = groupBy(deliveriesResult.data || [], 'project_id')
  const result = emptyResult()

  for (const project of projects) {
    if (testProjectIds.has(project.id)) {
      result.skipped_test_projects += 1
      continue
    }
    if (requiresDateChangeConfirmation(project, deliveriesByProject.get(project.id) || [])) {
      result.skipped_date_confirmation += 1
      continue
    }
    if (!isReminderDueNow(project, now)) continue

    result.due_projects += 1
    const projectResult = await processProjectReminders({ supabase, project, now, cleanSiteUrl })
    result.eligible_guests += projectResult.eligible
    result.accepted += projectResult.accepted
    result.failed += projectResult.failed
    result.needs_review += projectResult.needsReview
  }

  return result
}

async function processProjectReminders({ supabase, project, now, cleanSiteUrl }) {
  const [responsesResult, accommodationsResult, existingResult] = await Promise.all([
    supabase
      .from('rsvp_responses')
      .select('id, guest_name, contact_email, attending, needs_accommodation, accommodation_option_id, accommodation_room, accommodation_email_sent_at')
      .eq('project_id', project.id)
      .eq('attending', 'yes')
      .eq('needs_accommodation', true)
      .not('contact_email', 'is', null)
      .not('accommodation_option_id', 'is', null)
      .not('accommodation_email_sent_at', 'is', null),
    supabase
      .from('accommodation_options')
      .select('id, name, address, check_in, check_out, guest_note')
      .eq('project_id', project.id),
    supabase
      .from('accommodation_reminder_deliveries')
      .select('rsvp_response_id')
      .eq('project_id', project.id)
      .eq('wedding_date', project.wedding_date),
  ])

  if (responsesResult.error) throw new Error(`Reminder guests query failed: ${responsesResult.error.message}`)
  if (accommodationsResult.error) throw new Error(`Reminder accommodations query failed: ${accommodationsResult.error.message}`)
  if (existingResult.error) throw new Error(`Existing reminders query failed: ${existingResult.error.message}`)

  const accommodations = new Map((accommodationsResult.data || []).map((item) => [item.id, item]))
  const existingResponseIds = new Set((existingResult.data || []).map((item) => item.rsvp_response_id))
  const outcome = { eligible: 0, accepted: 0, failed: 0, needsReview: 0 }

  for (const guest of responsesResult.data || []) {
    const accommodation = accommodations.get(guest.accommodation_option_id)
    if (!accommodation || existingResponseIds.has(guest.id)) continue

    outcome.eligible += 1
    const delivery = await createDelivery({ supabase, project, guest, accommodation, now, cleanSiteUrl })
    if (!delivery) continue

    const deliveryResult = await sendDelivery({ supabase, delivery, now })
    if (deliveryResult === 'accepted') outcome.accepted += 1
    if (deliveryResult === 'failed') outcome.failed += 1
    if (deliveryResult === 'needs_review') outcome.needsReview += 1
  }

  return outcome
}

async function createDelivery({ supabase, project, guest, accommodation, now, cleanSiteUrl }) {
  const email = createAccommodationReminderEmail(
    buildReminderEmailData({ project, guest, accommodation, siteUrl: cleanSiteUrl })
  )
  const idempotencyKey = buildReminderIdempotencyKey({
    projectId: project.id,
    responseId: guest.id,
    weddingDate: project.wedding_date,
  })
  const payload = {
    to: guest.contact_email,
    replyTo: project.client_email || null,
    fromName: project.couple_display_name
      ? `${project.couple_display_name} cez YesDay`
      : 'Nevesta a ženích cez YesDay',
    ...email,
  }

  const { data, error } = await supabase
    .from('accommodation_reminder_deliveries')
    .upsert({
      project_id: project.id,
      rsvp_response_id: guest.id,
      wedding_date: project.wedding_date,
      reminder_days: project.accommodation_reminder_days,
      status: 'processing',
      idempotency_key: idempotencyKey,
      payload_snapshot: payload,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }, {
      onConflict: 'rsvp_response_id,wedding_date',
      ignoreDuplicates: true,
    })
    .select('id, idempotency_key, payload_snapshot, attempt_count')
    .maybeSingle()

  if (error) throw new Error(`Reminder delivery claim failed: ${error.message}`)
  return data || null
}

async function sendDelivery({ supabase, delivery, now }) {
  let lastError = null
  let attempts = Number(delivery.attempt_count || 0)

  while (attempts < MAX_SEND_ATTEMPTS) {
    attempts += 1
    const attemptedAt = new Date(now.getTime() + (attempts - 1) * 500).toISOString()
    const attemptUpdate = await supabase
      .from('accommodation_reminder_deliveries')
      .update({ attempt_count: attempts, last_attempt_at: attemptedAt, updated_at: attemptedAt })
      .eq('id', delivery.id)
      .eq('status', 'processing')

    if (attemptUpdate.error) throw new Error(`Reminder attempt log failed: ${attemptUpdate.error.message}`)

    try {
      const provider = await sendTransactionalEmail({
        ...delivery.payload_snapshot,
        idempotencyKey: delivery.idempotency_key,
      })
      const acceptedAt = new Date().toISOString()
      const acceptedUpdate = await supabase
        .from('accommodation_reminder_deliveries')
        .update({
          status: 'accepted',
          accepted_at: acceptedAt,
          resend_email_id: provider.id,
          last_error: null,
          updated_at: acceptedAt,
        })
        .eq('id', delivery.id)
        .eq('status', 'processing')

      if (acceptedUpdate.error) {
        throw new TransactionalEmailError(
          `Reminder acceptance log failed: ${acceptedUpdate.error.message}`,
          { deliveryUncertain: true }
        )
      }
      return 'accepted'
    } catch (error) {
      lastError = error
      const retryable = error instanceof TransactionalEmailError && error.retryable
      if (!retryable || attempts >= MAX_SEND_ATTEMPTS) break
      await delay(attempts * 350)
    }
  }

  const deliveryUncertain = lastError instanceof TransactionalEmailError && lastError.deliveryUncertain
  const finalStatus = getFinalDeliveryStatus({ deliveryUncertain })
  const failedAt = new Date().toISOString()
  const failedUpdate = await supabase
    .from('accommodation_reminder_deliveries')
    .update({
      status: finalStatus,
      last_error: safeErrorMessage(lastError),
      updated_at: failedAt,
    })
    .eq('id', delivery.id)
    .eq('status', 'processing')

  if (failedUpdate.error) throw new Error(`Reminder failure log failed: ${failedUpdate.error.message}`)
  return finalStatus
}

function emptyResult() {
  return {
    due_projects: 0,
    eligible_guests: 0,
    accepted: 0,
    failed: 0,
    needs_review: 0,
    skipped_test_projects: 0,
    skipped_date_confirmation: 0,
  }
}

function groupBy(rows, key) {
  const grouped = new Map()
  rows.forEach((row) => {
    const value = row[key]
    grouped.set(value, [...(grouped.get(value) || []), row])
  })
  return grouped
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : 'Unknown email delivery error'
  return String(message).slice(0, 1000)
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
