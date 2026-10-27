import supabase from '../../lib/supabase'
import { getSupabaseAdmin } from '../../lib/supabaseAdmin'
import { sortScheduleItemsChronologically } from '../../lib/schedule'
import WeddingWebsite, { WeddingNotFound } from '../../components/WeddingWebsite'

export const dynamic = 'force-dynamic'

export default async function WeddingPage({ params, searchParams }) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const slug = resolvedParams?.slug

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()

  if (projectError || !project) {
    return <WeddingNotFound />
  }

  const { data: loadedScheduleItems = [], error: scheduleError } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true })
  const scheduleItems = sortScheduleItemsChronologically(loadedScheduleItems)

  const { data: websiteContent } = await supabase
    .from('website_content')
    .select('*')
    .eq('project_id', project.id)
    .single()

  const invitation = await loadInvitationForProject(resolvedSearchParams?.invite, project.id)
  const invitationQuery = invitation ? `?invite=${encodeURIComponent(invitation.token)}` : ''

  return (
    <WeddingWebsite
      project={project}
      websiteContent={websiteContent || {}}
      scheduleItems={scheduleItems}
      scheduleError={scheduleError}
      rsvpHref={`/${slug}/rsvp${invitationQuery}`}
      invitationRecipient={invitation}
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
