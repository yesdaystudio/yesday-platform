import { getRequestProtection } from '../../../../lib/serverRequestProtection'
import { createPersonalizedRsvpHandler } from '../../../../lib/rsvpApi.mjs'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { normalizeInvitationToken } from '../../../../lib/personalizedInvitations.mjs'
import { isPublicWedding } from '../../../../lib/publicWedding.mjs'

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

export const POST = createPersonalizedRsvpHandler({ getSupabaseAdmin, getProtection: getRequestProtection, loadInvitation })

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
  if (projectError || !isPublicWedding(project) || !['signature', 'atelier'].includes(packageType)) return null
  return { ...invitation, project }
}

