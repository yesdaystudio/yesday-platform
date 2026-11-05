import { getSupabaseAdmin } from '../../lib/supabaseAdmin'
import { sortScheduleItemsChronologically } from '../../lib/schedule'
import WeddingWebsite, { WeddingNotFound } from '../../components/WeddingWebsite'
import { readWeddingGallery } from '../../lib/weddingGallery'
import { findPublicWedding } from '../../lib/publicWeddingServer'
import { PUBLIC_CONTENT_FIELDS, PUBLIC_SCHEDULE_FIELDS, publicProject } from '../../lib/publicWedding.mjs'

export const dynamic = 'force-dynamic'

export default async function WeddingPage({ params, searchParams }) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const slug = resolvedParams?.slug

  const { data: project, error: projectError } = await findPublicWedding(slug)

  if (projectError || !project) {
    return <WeddingNotFound />
  }

  const { data: loadedScheduleItems = [], error: scheduleError } = await getSupabaseAdmin()
    .from('schedule_items')
    .select(PUBLIC_SCHEDULE_FIELDS.join(','))
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true })
  const scheduleItems = sortScheduleItemsChronologically(loadedScheduleItems)

  const { data: websiteContent } = await getSupabaseAdmin()
    .from('website_content')
    .select(PUBLIC_CONTENT_FIELDS.join(','))
    .eq('project_id', project.id)
    .single()

  const invitation = await loadInvitationForProject(resolvedSearchParams?.invite, project.id)
  const invitationQuery = invitation ? `?invite=${encodeURIComponent(invitation.token)}` : ''
  let gallery = null
  try { gallery = await readWeddingGallery(project) }
  catch (error) { console.error('Published wedding gallery unavailable:', error.code || error.name || 'unknown') }

  return (
    <WeddingWebsite
      project={publicProject(project)}
      websiteContent={websiteContent || {}}
      scheduleItems={scheduleItems}
      scheduleError={scheduleError}
      rsvpHref={`/${slug}/rsvp${invitationQuery}`}
      invitationRecipient={invitation}
      gallery={gallery}
    />
  )
}

async function loadInvitationForProject(rawToken, projectId) {
  const token = String(rawToken || '').trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(token)) return null

  const { data } = await getSupabaseAdmin()
    .from('invitation_recipients')
    .select('token, recipient_label, salutation')
    .eq('token', token)
    .eq('project_id', projectId)
    .maybeSingle()

  return data || null
}
