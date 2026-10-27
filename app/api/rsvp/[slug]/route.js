import { normalizePersonalizedRsvp } from '../../../../lib/personalizedInvitations.mjs'
import { normalizeRsvpSubmissionKey } from '../../../../lib/rsvpSubmission.mjs'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(request, { params }) {
  const slug = String((await params)?.slug || '').trim()
  if (!slug) return Response.json({ error: 'Svadobný projekt sa nenašiel.' }, { status: 404 })

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Neplatné údaje RSVP.' }, { status: 400 })
  }

  const submissionKey = normalizeRsvpSubmissionKey(body?.submission_key)
  if (!submissionKey) return Response.json({ error: 'Odpoveď sa nepodarilo bezpečne identifikovať.' }, { status: 400 })

  const supabaseAdmin = getSupabaseAdmin()
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id, package_type')
    .eq('slug', slug)
    .maybeSingle()

  if (projectError || !project) {
    return Response.json({ error: 'Svadobný projekt sa nenašiel.' }, { status: 404 })
  }

  const validation = normalizePersonalizedRsvp(body)
  if (validation.error) return Response.json({ error: validation.error }, { status: 400 })

  const value = { ...validation.value }
  const packageType = String(project.package_type || 'signature').toLowerCase().trim()
  if (packageType === 'essential') {
    value.needs_accommodation = false
    value.transport = null
    value.contact_email = null
    value.contact_phone = null
  }

  const { count } = await supabaseAdmin
    .from('rsvp_responses')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)
    .eq('submission_key', submissionKey)

  const { error } = await supabaseAdmin
    .from('rsvp_responses')
    .upsert({
      ...value,
      project_id: project.id,
      submission_key: submissionKey,
    }, { onConflict: 'project_id,submission_key' })

  if (error) {
    console.error('[generic-rsvp] Save failed', error)
    return Response.json({ error: 'Odpoveď sa nepodarilo uložiť.' }, { status: 500 })
  }

  return Response.json({ saved: true, updated: Number(count || 0) > 0 })
}
