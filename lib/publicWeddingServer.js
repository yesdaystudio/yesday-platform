import 'server-only'
import { getSupabaseAdmin } from './supabaseAdmin'
import { PUBLIC_PROJECT_FIELDS } from './publicWedding.mjs'

export function findPublicWedding(slug) {
  return getSupabaseAdmin().from('projects')
    .select([...PUBLIC_PROJECT_FIELDS, 'package_type', 'payment_status', 'project_status'].join(','))
    .eq('slug', slug).eq('payment_status', 'paid').eq('project_status', 'active').maybeSingle()
}
