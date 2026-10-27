import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { normalizeInvitationToken, normalizePersonalizedRsvp } from '../../../../lib/personalizedInvitations.mjs'

export const runtime = 'nodejs'

export async function GET(_request, { params }) {
  const token = normalizeInvitationToken((await params)?.token)
  if (!token) return Response.json({ error: 'Neplatný odkaz na pozvánku.' }, { status: 400 })

  const invitation = await loadInvitation(token)
  if (!invitation) return Response.json({ error: 'Pozvánka sa nenašla.' }, { status: 404 })

  const supabaseAdmin = getSupabaseAdmin()
  const { count } = await supabaseAdmin
    .from('rsvp_responses')
    .select('id', { count: 'exact', head: true })
    .eq('invitation_recipient_id', invitation.id)

  return Response.json({
    recipient_label: invitation.recipient_label,
    salutation: invitation.salutation || invitation.recipient_label,
    recipient_type: invitation.recipient_type,
    project_slug: invitation.project.slug,
    couple_display_name: invitation.project.couple_display_name,
    has_responded: Number(count || 0) > 0,
  })
}

export async function POST(request, { params }) {
  const token = normalizeInvitationToken((await params)?.token)
  if (!token) return Response.json({ error: 'Neplatný odkaz na pozvánku.' }, { status: 400 })

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Neplatné údaje RSVP.' }, { status: 400 })
  }

  const invitation = await loadInvitation(token)
  if (!invitation) return Response.json({ error: 'Pozvánka sa nenašla.' }, { status: 404 })

  const validation = normalizePersonalizedRsvp(body)
  if (validation.error) return Response.json({ error: validation.error }, { status: 400 })

  const supabaseAdmin = getSupabaseAdmin()
  const payload = {
    ...validation.value,
    project_id: invitation.project_id,
    invitation_recipient_id: invitation.id,
  }
  const { data: existing } = await supabaseAdmin
    .from('rsvp_responses')
    .select('id')
    .eq('invitation_recipient_id', invitation.id)
    .maybeSingle()

  const query = existing?.id
    ? supabaseAdmin.from('rsvp_responses').update(payload).eq('id', existing.id)
    : supabaseAdmin.from('rsvp_responses').insert(payload)
  const { error } = await query

  if (error) {
    console.error('[personalized-rsvp] Save failed', error)
    return Response.json({ error: 'Odpoveď sa nepodarilo uložiť.' }, { status: 500 })
  }

  return Response.json({ saved: true, updated: Boolean(existing?.id) })
}

async function loadInvitation(token) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: invitation, error } = await supabaseAdmin
    .from('invitation_recipients')
    .select('id, project_id, recipient_type, recipient_label, salutation')
    .eq('token', token)
    .maybeSingle()

  if (error || !invitation) return null

  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('slug, couple_display_name, package_type, project_status, payment_status')
    .eq('id', invitation.project_id)
    .maybeSingle()

  const packageType = String(project?.package_type || '').toLowerCase()
  if (projectError || !project || !['signature', 'atelier'].includes(packageType)) return null
  return { ...invitation, project }
}

