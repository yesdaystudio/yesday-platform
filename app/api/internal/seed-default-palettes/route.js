import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { getDefaultDresscodePalette } from '../../../../lib/dresscodePalette'

export const runtime = 'nodejs'

const RECOVERABLE_SLUGS = ['lea-a-mario', 'mila-a-marco', 'mia-jonas']

export async function POST() {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: projects, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id, slug, design_family')
    .in('slug', RECOVERABLE_SLUGS)

  if (projectError) {
    return Response.json({ error: projectError.message }, { status: 500 })
  }

  const updated = []
  for (const project of projects || []) {
    const { data: content, error: contentError } = await supabaseAdmin
      .from('website_content')
      .select('id, dresscode_palette_enabled, dresscode_palette')
      .eq('project_id', project.id)
      .maybeSingle()

    if (contentError) {
      return Response.json({ error: contentError.message }, { status: 500 })
    }

    const hasPalette = Array.isArray(content?.dresscode_palette) && content.dresscode_palette.length > 0
    if (!content?.id || hasPalette) continue

    const { error: updateError } = await supabaseAdmin
      .from('website_content')
      .update({
        dresscode_palette_enabled: true,
        dresscode_palette: getDefaultDresscodePalette(project.design_family),
      })
      .eq('id', content.id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 })
    }

    updated.push(project.slug)
  }

  return Response.json({ updated })
}
