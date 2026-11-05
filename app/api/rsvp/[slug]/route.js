import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { getRequestProtection } from '../../../../lib/serverRequestProtection'
import { createGenericRsvpHandler } from '../../../../lib/rsvpApi.mjs'

export const runtime = 'nodejs'
export const POST = createGenericRsvpHandler({ getSupabaseAdmin, getProtection: getRequestProtection })
