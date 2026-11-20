import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

// Encrypted outbox: retries must reuse the exact original link and email body.
export function createAccessEnvelope(secret) {
  if (!secret) throw new Error('Onboarding encryption is not configured')
  const key = createHash('sha256').update(`yesday-onboarding-outbox-v1:${secret}`).digest()
  return {
    seal(value, jobId) {
      const iv = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', key, iv)
      cipher.setAAD(Buffer.from(jobId))
      const bytes = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
      return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), bytes.toString('base64url')].join('.')
    },
    open(value, jobId) {
      const [version, iv, tag, bytes, extra] = String(value || '').split('.')
      if (version !== 'v1' || !iv || !tag || !bytes || extra) throw new Error('Invalid access envelope')
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
      decipher.setAAD(Buffer.from(jobId))
      decipher.setAuthTag(Buffer.from(tag, 'base64url'))
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(bytes, 'base64url')), decipher.final()]).toString('utf8'))
    },
  }
}
