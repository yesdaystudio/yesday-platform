import supabase from '../../lib/supabase'
import { sortScheduleItemsChronologically } from '../../lib/schedule'
import WeddingWebsite, { WeddingNotFound } from '../../components/WeddingWebsite'

export const dynamic = 'force-dynamic'

export default async function WeddingPage({ params }) {
  const resolvedParams = await params
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

  return <WeddingWebsite project={project} websiteContent={websiteContent || {}} scheduleItems={scheduleItems} scheduleError={scheduleError} rsvpHref={`/${slug}/rsvp`} />
}
