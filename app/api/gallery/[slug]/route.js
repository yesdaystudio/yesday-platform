import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { readWeddingGallery } from '../../../../lib/weddingGallery'
import { createGalleryHandlers } from '../../../../lib/galleryApi.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const handlers = createGalleryHandlers({ getSupabaseAdmin, readWeddingGallery, randomUUID })
export const GET = handlers.GET
export const POST = handlers.POST
export const DELETE = handlers.DELETE
