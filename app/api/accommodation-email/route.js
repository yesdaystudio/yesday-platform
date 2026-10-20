import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'
import { sendTransactionalEmail } from '../../../lib/email/sender'
import { createAccommodationEmail } from '../../../lib/email/templates'

export const runtime = 'nodejs'

export async function POST(request) {
  const token = getBearerToken(request.headers.get('authorization'))
  if (!token) return Response.json({ error: 'Prihlásenie vypršalo.' }, { status: 401 })

  let payload
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Neplatné údaje e-mailu.' }, { status: 400 })
  }

  const responseId = String(payload?.response_id || '').trim()
  const subject = String(payload?.subject || '').trim().slice(0, 180)
  const body = String(payload?.body || '').trim().slice(0, 10000)
  if (!responseId || !subject || !body) {
    return Response.json({ error: 'Doplňte predmet a text e-mailu.' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return Response.json({ error: 'Prihlásenie vypršalo.' }, { status: 401 })

  const { data: rsvp, error: rsvpError } = await supabaseAdmin
    .from('rsvp_responses')
    .select('id, project_id, contact_email')
    .eq('id', responseId)
    .single()

  if (rsvpError || !rsvp?.contact_email) {
    return Response.json({ error: 'Hosť nemá uloženú e-mailovú adresu.' }, { status: 404 })
  }

  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('owner_user_id, client_email, couple_display_name')
    .eq('id', rsvp.project_id)
    .single()

  if (projectError || project?.owner_user_id !== user.id) {
    return Response.json({ error: 'K tomuto hosťovi nemáte prístup.' }, { status: 403 })
  }

  const email = createAccommodationEmail({ subject, body })

  try {
    const delivery = await sendTransactionalEmail({
      to: rsvp.contact_email,
      replyTo: project.client_email || user.email,
      fromName: project.couple_display_name
        ? `${project.couple_display_name} cez YesDay`
        : 'Nevesta a ženích cez YesDay',
      ...email,
    })
    const sentAt = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('rsvp_responses')
      .update({ accommodation_email_sent_at: sentAt })
      .eq('id', rsvp.id)

    if (updateError) console.error('[accommodation-email] Failed to save sent status', updateError)

    return Response.json({ sent: true, sent_at: sentAt, email_id: delivery.id })
  } catch (error) {
    console.error('[accommodation-email] Delivery failed', error)
    const notConfigured = error instanceof Error && error.message === 'Transactional email is not configured'
    return Response.json(
      { error: notConfigured ? 'Odosielanie e-mailov ešte nie je aktivované.' : 'E-mail sa nepodarilo odoslať.' },
      { status: notConfigured ? 503 : 502 }
    )
  }
}

function getBearerToken(value) {
  const match = String(value || '').match(/^Bearer\s+(.+)$/i)
  return match?.[1] || ''
}
