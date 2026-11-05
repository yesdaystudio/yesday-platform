import { hasActivePremiumPackage } from './publicWedding.mjs'
import { normalizeRsvpSubmissionKey } from './rsvpSubmission.mjs'

export function createAccommodationEmailHandler({ getSupabaseAdmin, sendTransactionalEmail, createAccommodationEmail }) {
  const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

  return async function POST(request) {
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) return reply({ error: 'Prihlásenie vypršalo.' }, 401)
    let payload
    try { payload = await request.json() }
    catch { return reply({ error: 'Neplatné údaje e-mailu.' }, 400) }
    const responseId = normalizeRsvpSubmissionKey(payload?.response_id)
    const subject = String(payload?.subject || '').trim().slice(0, 180)
    const body = String(payload?.body || '').trim().slice(0, 10000)
    if (!responseId || !subject || !body) return reply({ error: 'Doplňte platného hosťa, predmet a text e-mailu.' }, 400)

    let db, rsvp, project, user
    try {
      db = getSupabaseAdmin()
      const { data, error: authError } = await db.auth.getUser(token)
      user = data?.user
      if (authError || !user) return reply({ error: 'Prihlásenie vypršalo.' }, 401)
      const responseResult = await db.from('rsvp_responses')
        .select('id,project_id,contact_email,attending,needs_accommodation').eq('id', responseId).maybeSingle()
      if (responseResult.error) throw responseResult.error
      rsvp = responseResult.data
      if (!rsvp) return reply({ error: 'Záznam hosťa nie je dostupný.' }, 404)
      const projectResult = await db.from('projects')
        .select('owner_user_id,client_email,couple_display_name,package_type,payment_status,project_status')
        .eq('id', rsvp.project_id).eq('owner_user_id', user.id).maybeSingle()
      if (projectResult.error) throw projectResult.error
      project = projectResult.data
      if (!project) return reply({ error: 'Záznam hosťa nie je dostupný.' }, 404)
      if (!hasActivePremiumPackage(project)) return reply({ error: 'Odosielanie ubytovacích e-mailov je dostupné pre aktívny zaplatený balík Signature alebo Atelier.' }, 403)
      if (rsvp.attending !== 'yes' || rsvp.needs_accommodation !== true) return reply({ error: 'E-mail s ubytovaním možno poslať potvrdenému hosťovi, ktorý žiada ubytovanie.' }, 400)
      if (!rsvp.contact_email) return reply({ error: 'Hosť nemá uloženú e-mailovú adresu.' }, 400)
    } catch (error) {
      console.error('[accommodation-email] Access verification failed', error.code || error.name || 'unknown')
      return reply({ error: 'Údaje hosťa sa nepodarilo overiť. E-mail nebol odoslaný.' }, 503)
    }

    let delivery
    try {
      const email = createAccommodationEmail({ subject, body })
      delivery = await sendTransactionalEmail({
        to: rsvp.contact_email,
        replyTo: project.client_email || user.email,
        fromName: project.couple_display_name ? `${project.couple_display_name} cez YesDay` : 'Nevesta a ženích cez YesDay',
        ...email,
      })
    } catch (error) {
      console.error('[accommodation-email] Delivery failed', error.code || error.name || 'unknown')
      const notConfigured = error.message === 'Transactional email is not configured'
      return reply({ error: notConfigured ? 'Odosielanie e-mailov ešte nie je aktivované.' : 'E-mail sa nepodarilo odoslať.' }, notConfigured ? 503 : 502)
    }
    const sentAt = new Date().toISOString()
    let statusSaved = false
    try {
      const { error } = await db.from('rsvp_responses').update({ accommodation_email_sent_at: sentAt }).eq('id', rsvp.id)
      if (error) throw error
      statusSaved = true
    } catch (error) {
      // The provider already accepted the message. Do not suggest resending it.
      console.error('[accommodation-email] Failed to save sent status', error.code || error.name || 'unknown')
    }
    return reply({ sent: true, sent_at: sentAt, email_id: delivery.id, status_saved: statusSaved })
  }
}
