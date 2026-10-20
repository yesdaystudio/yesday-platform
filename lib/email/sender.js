import 'server-only'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export function isTransactionalEmailConfigured() {
  return Boolean(
    String(process.env.RESEND_API_KEY || '').trim() &&
    String(process.env.YESDAY_EMAIL_FROM || '').trim()
  )
}

export async function sendTransactionalEmail({ to, subject, html, text, replyTo }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim()
  const from = String(process.env.YESDAY_EMAIL_FROM || '').trim()

  if (!apiKey || !from) {
    throw new Error('Transactional email is not configured')
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [String(to || '').trim()],
      subject: String(subject || '').trim(),
      html,
      text,
      ...(replyTo ? { reply_to: String(replyTo).trim() } : {}),
    }),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = result?.message || result?.error || `Email provider returned ${response.status}`
    throw new Error(String(message))
  }

  return { id: result?.id || null }
}
