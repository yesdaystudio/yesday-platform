import { findPublicWedding } from '../../../../lib/publicWeddingServer'

export const dynamic = 'force-dynamic'
export async function GET(_request, { params }) {
  const { slug } = await params
  const { data, error } = await findPublicWedding(slug)
  const options = { headers: { 'Cache-Control': 'no-store' } }
  if (error) return Response.json({ error: 'Projekt sa momentálne nepodarilo načítať.' }, { ...options, status: 503 })
  if (!data) return Response.json({ error: 'Svadobný projekt nie je dostupný.' }, { ...options, status: 404 })
  return Response.json({ project: { id: data.id, slug: data.slug, package_type: data.package_type } }, options)
}
