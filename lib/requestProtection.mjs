import { createHash, createHmac, randomUUID } from 'node:crypto'
import { isIP } from 'node:net'
import { normalizeRsvpSubmissionKey } from './rsvpSubmission.mjs'

export class RequestProtectionError extends Error {
  constructor(message, status = 400, retryAfter = null) { super(message); this.status = status; this.retryAfter = retryAfter }
}
export function protectionResponse(error) {
  const status = error instanceof RequestProtectionError ? error.status : 503
  if (status === 503) console.error('[request-protection] Verification unavailable', error.code || error.name || 'unknown')
  return Response.json({ error: status === 503 ? 'Požiadavku teraz nevieme bezpečne spracovať. Skúste to o chvíľu.' : error.message }, {
    status, headers: { 'Cache-Control': 'no-store', ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}) },
  })
}
export async function readProtectedJson(request, maxBytes = 65536) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new RequestProtectionError('Neplatný formát formulára.', 415)
  if (Number(request.headers.get('content-length')) > maxBytes) throw new RequestProtectionError('Formulár obsahuje príliš veľa údajov.', 413)
  const reader = request.body?.getReader()
  if (!reader) throw new RequestProtectionError('Formulár je prázdny.')
  const chunks = []; let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > maxBytes) { await reader.cancel(); throw new RequestProtectionError('Formulár obsahuje príliš veľa údajov.', 413) }
      chunks.push(value)
    }
    const buffer = Buffer.concat(chunks)
    let body
    try { body = JSON.parse(buffer.toString('utf8')) } catch { throw new RequestProtectionError('Neplatné údaje formulára.') }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestProtectionError('Neplatné údaje formulára.')
    if (body.company_website !== undefined && (typeof body.company_website !== 'string' || body.company_website.trim())) throw new RequestProtectionError('Formulár sa nepodarilo overiť. Obnovte stránku a skúste to znova.')
    return body
  } finally { reader.releaseLock() }
}
export function requestIp(request, vercel = false) {
  const header = vercel ? request.headers.get('x-vercel-forwarded-for') : request.headers.get('x-forwarded-for')
  const ip = String(header || '').split(',')[0].trim()
  if (isIP(ip)) return ip
  if (vercel) throw new RequestProtectionError('Požiadavku sa nepodarilo overiť.', 503)
  return 'local-development'
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}
export function createRequestProtection({ db, secret, vercel = false }) {
  if (!secret) throw new RequestProtectionError('Request protection not configured', 503)
  const hash = value => createHmac('sha256', secret).update(JSON.stringify(canonical(value))).digest('hex')
  async function limit(scope, identity, maximum, seconds) {
    const { data, error } = await db.rpc('consume_request_limit', { p_key_hash: hash([scope, identity]), p_limit: maximum, p_window_seconds: seconds })
    if (error || typeof data?.allowed !== 'boolean') throw error || new RequestProtectionError('Rate limit unavailable', 503)
    if (!data.allowed) throw new RequestProtectionError(`Príliš veľa pokusov. Skúste to znova o ${data.retry_after} sekúnd.`, 429, data.retry_after)
  }
  async function check(request, policy, identity = '') {
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin) throw new RequestProtectionError('Formulár odošlite priamo z webu YesDay.', 403)
    const ip = requestIp(request, vercel)
    if (policy === 'rsvp') {
      await limit('rsvp:ip', ip, 600, 600)
      if (identity) await limit('rsvp:answer', identity, 8, 60)
    } else if (policy === 'checkout') {
      await limit('checkout:ip', ip, 30, 900)
    } else if (policy === 'email') {
      await limit('email:ip', ip, 120, 60)
    }
  }
  async function run({ scope, actor, requestKey, payload }, work) {
    const key = normalizeRsvpSubmissionKey(requestKey)
    if (!key) throw new RequestProtectionError('Obnovte formulár a skúste ho odoslať znova.')
    // Stable across secret rotation; the random request ID prevents dictionary attacks.
    const operationKey = createHash('sha256').update(JSON.stringify([scope, actor, key])).digest('hex')
    const claimToken = randomUUID()
    const { data, error } = await db.rpc('claim_request_operation', { p_operation_key: operationKey, p_payload_hash: hash(payload), p_claim_token: claimToken })
    if (error) throw error
    if (data?.status === 'replay') return data.result
    if (data?.status === 'busy') throw new RequestProtectionError('Táto požiadavka sa už spracúva. Skúste to o chvíľu.', 409, 3)
    if (data?.status === 'conflict') throw new RequestProtectionError('Údaje formulára sa zmenili. Otvorte nový formulár.', 409)
    if (data?.status === 'expired') throw new RequestProtectionError('Platnosť pôvodného pokusu vypršala. Otvorte nový formulár.', 409)
    if (data?.status !== 'claimed') throw new RequestProtectionError('Operation unavailable', 503)
    try {
      const result = await work(`yesday-${scope}-${operationKey}`)
      try {
        const saved = await db.rpc('finish_request_operation', { p_operation_key: operationKey, p_claim_token: claimToken, p_result: result })
        if (saved.error || saved.data !== true) throw saved.error || new Error('Claim changed')
      } catch (saveError) { console.error('[request-protection] Accepted operation result not cached', saveError.code || saveError.name || 'unknown') }
      return result
    } catch (workError) {
      try { await db.rpc('release_request_operation', { p_operation_key: operationKey, p_claim_token: claimToken }) } catch {}
      throw workError
    }
  }
  return { check, limit, run }
}
