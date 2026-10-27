import { runAccommodationReminders } from '../../../../lib/accommodation/reminders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request) {
  const cronSecret = String(process.env.CRON_SECRET || '').trim()
  const authorization = request.headers.get('authorization')
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runAccommodationReminders({
      now: new Date(),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error('[accommodation-reminders] Cron failed', error)
    return Response.json({ error: 'Accommodation reminder job failed' }, { status: 500 })
  }
}
