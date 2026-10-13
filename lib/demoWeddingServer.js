import { inflateSync } from 'node:zlib'

export function decodeDemoParams(params = {}) {
  if (typeof params.packed !== 'string' || params.packed.length > 12000) return params
  try {
    return { ...params, details: inflateSync(Buffer.from(params.packed, 'base64url'), { maxOutputLength: 40000 }).toString('utf8') }
  } catch { return params }
}
