import 'server-only'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export function isTransactionalEmailConfigured() {
  return Boolean(
    String(process.env.RESEND_API_KEY || '').trim() &&
    String(process.env.YESDAY_EMAIL_FROM || '').trim()
  )
}

export class TransactionalEmailError extends Error {
  constructor(message, { status = null, code = null, retryable = false, deliveryUncertain = false } = {}) {
    super(message)
    this.name = 'TransactionalEmailError'
    this.status = status
    this.code = code
    this.retryable = retryable
    this.deliveryUncertain = deliveryUncertain
  }
}

export async function sendTransactionalEmail({ to, subject, html, text, replyTo, fromName, idempotencyKey }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim()
  const from = String(process.env.YESDAY_EMAIL_FROM || '').trim()

  if (!apiKey || !from) {
    throw new Error('Transactional email is not configured')
  }

  let response
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': String(idempotencyKey).slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from: formatSender(from, fromName),
        to: [String(to || '').trim()],
        subject: String(subject || '').trim(),
        html,
        text,
        ...(replyTo ? { reply_to: String(replyTo).trim() } : {}),
      }),
    })
  } catch (error) {
    throw new TransactionalEmailError(
      error instanceof Error ? error.message : 'Email provider request failed',
      { retryable: Boolean(idempotencyKey), deliveryUncertain: true }
    )
  }

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = result?.message || result?.error || `Email provider returned ${response.status}`
    const code = String(result?.name || result?.code || result?.error || '').trim() || null
    const concurrentRequest = code === 'concurrent_idempotent_requests'
    const conflictingRequest = code === 'invalid_idempotent_request'
    const retryable = Boolean(idempotencyKey) && (response.status === 429 || response.status >= 500 || concurrentRequest)
    throw new TransactionalEmailError(String(message), {
      status: response.status,
      code,
      retryable,
      deliveryUncertain: concurrentRequest || conflictingRequest,
    })
  }

  return { id: result?.id || null }
}

function formatSender(configuredFrom, requestedName) {
  const name = String(requestedName || '').replace(/[<>\r\n]/g, '').trim()
  if (!name) return configuredFrom

  const bracketMatch = configuredFrom.match(/<([^>]+)>/)
  const address = String(bracketMatch?.[1] || configuredFrom).trim()
  return `${name} <${address}>`
}
