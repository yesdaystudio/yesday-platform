import { getRequestProtection } from '../../../lib/serverRequestProtection'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'
import { sendTransactionalEmail } from '../../../lib/email/sender'
import { createAccommodationEmail } from '../../../lib/email/templates'
import { createAccommodationEmailHandler } from '../../../lib/accommodationEmailApi.mjs'

export const runtime = 'nodejs'
export const POST = createAccommodationEmailHandler({ getSupabaseAdmin, sendTransactionalEmail, createAccommodationEmail, getProtection: getRequestProtection })
