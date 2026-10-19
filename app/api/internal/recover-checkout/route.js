import { recoverCheckoutFromEventId } from '../../../../lib/stripeCheckoutOnboarding'

export const runtime = 'nodejs'

const RECOVERABLE_EVENTS = new Set([
  'evt_1USMXB4b6JcyBGQS6FlAYdxW',
  'evt_1USMZ94b6JcyBGQS4A57qvVp',
])

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const eventId = String(body?.event_id || '').trim()

  if (!RECOVERABLE_EVENTS.has(eventId)) {
    return Response.json({ error: 'Recovery is not allowed for this event' }, { status: 403 })
  }

  try {
    const result = await recoverCheckoutFromEventId(eventId)
    return Response.json({ recovered: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recovery failed'
    console.error('[checkout-recovery] Failed', { eventId, error: message })
    return Response.json({ error: message }, { status: 500 })
  }
}
