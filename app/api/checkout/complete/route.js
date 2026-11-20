import { completeCheckoutFromSessionId } from '../../../../lib/stripeCheckoutOnboarding'

import { getRequestProtection } from '../../../../lib/serverRequestProtection'
import { readProtectedJson, protectionResponse } from '../../../../lib/requestProtection.mjs'

const headers = { 'Cache-Control': 'no-store' }
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request) {
  let body
  try {
    body = await readProtectedJson(request, 2048)
    await getRequestProtection().check(request, 'checkoutComplete')
  } catch (error) { return protectionResponse(error) }

  try {
    const result = await completeCheckoutFromSessionId(body?.session_id)
    return Response.json(result, { status: result.expired ? 410 : result.ready ? 200 : 202, headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout completion failed'

    if (message === 'Onboarding job is already being processed') {
      return Response.json({ ready: false, processing: true }, { status: 202, headers })
    }

    console.error('[checkout-complete] Failed', { code: error.code || error.name || 'unknown' })
    return Response.json({ error: 'Objednávku sa nepodarilo automaticky dokončiť.' }, { status: 503, headers })
  }
}
