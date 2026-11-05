import { normalizeRsvpSubmissionKey } from './rsvpSubmission.mjs'

const requests = new Map()
export async function getFormRequestKey(scope, payload) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)))
  const fingerprint = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')
  const storageKey = `yesday:request:${scope}:${fingerprint}`
  let record = requests.get(storageKey)
  try { record = JSON.parse(sessionStorage.getItem(storageKey) || 'null') || record } catch {}
  const age = Date.now() - record?.createdAt
  if (!normalizeRsvpSubmissionKey(record?.id) || !Number.isFinite(record?.createdAt) || age < 0 || age >= 23 * 60 * 60 * 1000) record = { id: crypto.randomUUID(), createdAt: Date.now() }
  requests.set(storageKey, record)
  try { sessionStorage.setItem(storageKey, JSON.stringify(record)) } catch {}
  return record.id
}
