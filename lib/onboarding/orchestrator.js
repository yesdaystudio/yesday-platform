import 'server-only'

import { getSupabaseAdmin } from '../supabaseAdmin'
import { getDefaultDresscodePalette } from '../dresscodePalette'
import { isTransactionalEmailConfigured, sendTransactionalEmail } from '../email/sender'
import { createOrderNotificationEmail, createWelcomeEmail } from '../email/templates'
import { createAccessEnvelope } from './accessEnvelope.mjs'
import { createOnboardingEngine } from './engine.mjs'

export async function runOnboarding(payload) {
  const db = getSupabaseAdmin()
  const run = createOnboardingEngine({
    db,
    envelope: createAccessEnvelope(process.env.ONBOARDING_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    prepareAccess: value => prepareAccess(db, value),
    resolveIdentity: value => resolveLegacyIdentity(db, value),
    sendEmail: sendTransactionalEmail,
    createMessage: (value, access) => ({
      ...createWelcomeEmail({ coupleDisplayName: value.couple_display_name, packageType: value.package_type, accessUrl: access.accessUrl, existingUser: access.existingUser }),
      sender: String(process.env.YESDAY_EMAIL_FROM || '').trim(),
    }),
    palette: getDefaultDresscodePalette,
    emailConfigured: isTransactionalEmailConfigured,
    notifyOwner: (job, value) => notifyOwner(db, job, value),
  })
  return run(payload)
}

// generateLink creates/resolves identity without sending an Auth email.
async function prepareAccess(db, payload) {
  const redirectTo = `${siteUrl()}/reset-password`
  const invite = await db.auth.admin.generateLink({
    type: 'invite', email: payload.customer_email,
    options: { redirectTo, data: { source: payload.test_mode ? 'yesday-test-checkout' : 'yesday-checkout' } },
  })
  if (invite.data?.user?.id && invite.data?.properties?.hashed_token) return accessResult(invite.data, false)
  const duplicate = /already|exists/i.test(String(invite.error?.message || ''))
  if (!duplicate) throw Object.assign(new Error('Unable to prepare client identity'), { code: 'auth_invite_failed' })
  const recovery = await db.auth.admin.generateLink({ type: 'recovery', email: payload.customer_email, options: { redirectTo } })
  if (recovery.error || !recovery.data?.user?.id || !recovery.data?.properties?.hashed_token) throw Object.assign(new Error('Unable to prepare existing client access'), { code: 'auth_recovery_failed' })
  return accessResult(recovery.data, true)
}

function accessResult(data, existingUser) {
  const type = data.properties.verification_type || (existingUser ? 'recovery' : 'invite')
  const query = new URLSearchParams({ token_hash: data.properties.hashed_token, type })
  return { userId: data.user.id, accessUrl: `${siteUrl()}/reset-password?${query}`, existingUser }
}
function siteUrl() {
  const url = String(process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')
  if (!url || !/^https?:\/\//.test(url)) throw new Error('Missing site URL')
  return url
}
async function notifyOwner(db, job, payload) {
  if (job.payload_snapshot?.order_notification_sent_at || !isTransactionalEmailConfigured()) return
  const recipient = String(process.env.YESDAY_ORDER_NOTIFICATION_TO || 'info.yesdaystudio@gmail.com').trim()
  if (!recipient) return
  const message = createOrderNotificationEmail({ coupleDisplayName: payload.couple_display_name, customerEmail: payload.customer_email, packageType: payload.package_type, designFamily: payload.design_family, projectUrl: `${siteUrl()}/${job.slug}/client`, orderId: payload.external_order_id, testMode: payload.test_mode })
  try {
    await sendTransactionalEmail({ to: recipient, ...message, idempotencyKey: `order-notification/${payload.provider}/${payload.external_order_id}` })
    // Immutable order fields and the outbox are never overwritten here.
    const { error } = await db.rpc('mark_onboarding_notification', { p_id: job.id })
    if (error) console.error('[onboarding] Notification checkpoint failed', error.code || 'unknown')
  } catch (error) { console.error('[onboarding] Owner notification failed', error.code || 'email_error') }
}

async function resolveLegacyIdentity(db, payload) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw Object.assign(new Error('Legacy identity lookup failed'), { code: 'legacy_identity_lookup' })
    const user = data.users.find(item => String(item.email || '').toLowerCase() === payload.customer_email)
    if (user) return user.id
    if (data.users.length < 200) throw Object.assign(new Error('Legacy identity requires review'), { code: 'legacy_identity_missing' })
  }
}
