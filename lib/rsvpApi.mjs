import { normalizePersonalizedRsvp, normalizeInvitationToken } from './personalizedInvitations.mjs'
import { normalizeRsvpSubmissionKey } from './rsvpSubmission.mjs'
import { readProtectedJson, protectionResponse } from './requestProtection.mjs'

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export function createGenericRsvpHandler({ getSupabaseAdmin, getProtection }) {
  return async function POST(request, { params }) {
    try {
      const slug = String((await params)?.slug || '').trim()
      if (!slug || slug.length > 160) return reply({ error: 'Svadobný projekt sa nenašiel.' }, 404)
      const body = await readProtectedJson(request)
      const submissionKey = normalizeRsvpSubmissionKey(body.submission_key)
      if (!submissionKey) return reply({ error: 'Odpoveď sa nepodarilo bezpečne identifikovať.' }, 400)
      await getProtection().check(request, 'rsvp', ['generic', slug, submissionKey])
      const db = getSupabaseAdmin()
      const { data: project, error } = await db.from('projects').select('id,package_type')
        .eq('slug', slug).eq('payment_status', 'paid').eq('project_status', 'active').maybeSingle()
      if (error) throw error
      if (!project) return reply({ error: 'Svadobný projekt sa nenašiel.' }, 404)
      const validation = normalizePersonalizedRsvp(body)
      if (validation.error) return reply({ error: validation.error }, 400)
      const value = { ...validation.value }
      if (project.package_type === 'essential') Object.assign(value, { needs_accommodation: false, transport: null, contact_email: null, contact_phone: null })
      const { count } = await db.from('rsvp_responses').select('id', { count: 'exact', head: true }).eq('project_id', project.id).eq('submission_key', submissionKey)
      const saved = await db.from('rsvp_responses').upsert({ ...value, project_id: project.id, submission_key: submissionKey }, { onConflict: 'project_id,submission_key' })
      if (saved.error) throw saved.error
      return reply({ saved: true, updated: Number(count || 0) > 0 })
    } catch (error) { return protectionResponse(error) }
  }
}

export function createPersonalizedRsvpHandler({ getSupabaseAdmin, getProtection, loadInvitation }) {
  return async function POST(request, { params }) {
    try {
      const token = normalizeInvitationToken((await params)?.token)
      if (!token) return reply({ error: 'Neplatný odkaz na pozvánku.' }, 400)
      const body = await readProtectedJson(request)
      await getProtection().check(request, 'rsvp', ['invitation', token])
      const invitation = await loadInvitation(token)
      if (!invitation) return reply({ error: 'Pozvánka sa nenašla.' }, 404)
      const validation = normalizePersonalizedRsvp(body)
      if (validation.error) return reply({ error: validation.error }, 400)
      const db = getSupabaseAdmin()
      const { count } = await db.from('rsvp_responses').select('id', { count: 'exact', head: true }).eq('invitation_recipient_id', invitation.id)
      const saved = await db.from('rsvp_responses').upsert({ ...validation.value, project_id: invitation.project_id, invitation_recipient_id: invitation.id }, { onConflict: 'invitation_recipient_id' })
      if (saved.error) throw saved.error
      return reply({ saved: true, updated: Number(count || 0) > 0 })
    } catch (error) { return protectionResponse(error) }
  }
}
