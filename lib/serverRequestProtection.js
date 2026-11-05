import 'server-only'
import { getSupabaseAdmin } from './supabaseAdmin'
import { createRequestProtection } from './requestProtection.mjs'

export function getRequestProtection() {
  return createRequestProtection({ db: getSupabaseAdmin(), secret: process.env.SUPABASE_SERVICE_ROLE_KEY, vercel: process.env.VERCEL === '1' })
}
