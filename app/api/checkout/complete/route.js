import { completeCheckoutFromSessionId } from '../../../../lib/stripeCheckoutOnboarding'

export const runtime = 'nodejs'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const result = await completeCheckoutFromSessionId(body?.session_id)
    return Response.json(result, { status: result.ready ? 200 : 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout completion failed'
    console.error('[checkout-complete] Failed', { error: message })
    return Response.json({ error: 'Objednávku sa nepodarilo automaticky dokončiť.' }, { status: 500 })
  }
}
