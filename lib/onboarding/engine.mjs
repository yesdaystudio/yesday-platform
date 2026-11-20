import { randomUUID } from 'node:crypto'

export class OnboardingBusyError extends Error {
  constructor() { super('Onboarding job is already being processed') }
}

export function createOnboardingEngine({ db, envelope, prepareAccess, resolveIdentity, sendEmail, createMessage, palette, emailConfigured, notifyOwner = async () => {} }) {
  async function rpc(name, args) {
    const { data, error } = await db.rpc(name, args)
    if (error) { const problem = new Error('Onboarding database operation failed'); problem.code = error.code || 'onboarding_database'; throw problem }
    return data
  }
  function result(job) {
    const test = job.payload_snapshot?.test_mode === true
    const stored = test && job.access_payload_encrypted ? envelope.open(job.access_payload_encrypted, job.id) : null
    return { project_slug: job.slug, user_id: job.auth_user_id, access_url: test ? stored?.accessUrl || job.payload_snapshot?.test_access_url || null : null, email_sent: Boolean(job.access_email_sent_at || job.payload_snapshot?.access_email_sent_at) }
  }
  return async function run(raw) {
    const payload = validateOnboardingPayload(raw)
    const token = randomUUID()
    const claim = await rpc('claim_paid_onboarding', { p_payload: payload, p_token: token })
    if (claim.state === 'busy') throw new OnboardingBusyError()
    if (claim.state === 'completed') {
      await notifyOwner(claim.job, payload).catch(() => {})
      return result(claim.job)
    }
    if (claim.state !== 'claimed') throw new Error('Unable to claim onboarding')
    let job = claim.job
    try {
      // Production never falls back to a non-idempotent Auth email sender.
      if (!payload.test_mode && !emailConfigured()) throw Object.assign(new Error('Access email is not configured'), { code: 'email_not_configured' })
      let saved = job.access_payload_encrypted ? envelope.open(job.access_payload_encrypted, job.id) : null
      if (!job.auth_user_id && job.payload_snapshot?.access_email_sent_at) {
        if (!resolveIdentity) throw new Error('Legacy identity requires review')
        job = { ...job, auth_user_id: await resolveIdentity(payload) }
      }
      if (!job.project_ready_at || (!saved && !job.access_email_sent_at && !job.payload_snapshot?.access_email_sent_at)) {
        if (!saved && !job.access_email_sent_at && !job.payload_snapshot?.access_email_sent_at) {
          const access = await prepareAccess(payload)
          saved = { accessUrl: access.accessUrl, message: { to: payload.customer_email, ...createMessage(payload, access) } }
          job = { ...job, auth_user_id: access.userId }
        }
        job = await rpc('prepare_paid_onboarding', {
          p_id: job.id, p_token: token, p_user_id: job.auth_user_id,
          p_encrypted: envelope.seal(saved || { legacyDelivered: true }, job.id), p_palette: palette(payload.design_family),
        })
      }
      let emailSent = Boolean(job.access_email_sent_at || job.payload_snapshot?.access_email_sent_at)
      if (!emailSent && emailConfigured()) {
        if (!saved) throw new Error('Missing persisted access email')
        // This durable stamp is set BEFORE the external request. Uncertain retries
        // reuse exactly the same body/key; after 23 hours they require review.
        await rpc('begin_onboarding_delivery', { p_id: job.id, p_token: token })
        const delivered = await sendEmail({ ...saved.message, idempotencyKey: `onboarding-access/${job.id}` })
        job = await rpc('finish_onboarding_delivery', { p_id: job.id, p_token: token, p_delivery_id: delivered?.id || null })
        emailSent = true
      }
      job = await rpc('complete_paid_onboarding', { p_id: job.id, p_token: token, p_test_without_email: payload.test_mode && !emailConfigured() })
      await notifyOwner(job, payload).catch(() => {})
      return { ...result(job), email_sent: emailSent }
    } catch (error) {
      // A stale worker cannot overwrite a newer worker's checkpoint or status.
      await rpc('fail_paid_onboarding', { p_id: job.id, p_token: token, p_code: String(error.code || 'onboarding_step_failed').slice(0, 80) }).catch(() => {})
      throw error
    }
  }
}

export function validateOnboardingPayload(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid onboarding payload')
  const text = key => String(raw[key] || '').trim()
  const payload = {
    customer_email: text('customer_email').toLowerCase(), package_type: text('package_type').toLowerCase(),
    couple_display_name: text('couple_display_name'), design_family: text('design_family').toLowerCase() || 'diana',
    slug: text('slug').toLowerCase(), external_order_id: text('external_order_id'),
    external_event_id: text('external_event_id') || null, provider: text('provider').toLowerCase(), test_mode: raw.test_mode === true,
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customer_email) || payload.customer_email.length > 254) throw new Error('Invalid customer email')
  if (!['essential', 'signature', 'atelier'].includes(payload.package_type)) throw new Error('Invalid package')
  if (!payload.couple_display_name || payload.couple_display_name.length > 160) throw new Error('Invalid couple name')
  if (!['diana','botanique','penelope','chloe','fleurie','provence','lavande','veno','riviera'].includes(payload.design_family)) throw new Error('Invalid design')
  if (payload.provider !== 'stripe' || !payload.external_order_id.startsWith('cs_') || payload.external_order_id.length > 255) throw new Error('Invalid order identity')
  if (payload.slug && !/^[a-z0-9-]{1,80}$/.test(payload.slug)) throw new Error('Invalid slug')
  return payload
}
