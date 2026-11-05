import { decodeDemoParams } from '../../../lib/demoWeddingServer'
import WeddingWebsite from '../../../components/WeddingWebsite'
import { readDemoState } from '../../../lib/demoWedding'

export const metadata = { title: 'Ukážka svadobného webu | YesDay', robots: { index: false, follow: false } }

export default async function DemoWebsite({ searchParams }) {
  const params = await searchParams
  const values = decodeDemoParams(params)
  const data = readDemoState(values)
  const query = new URLSearchParams({ details: JSON.stringify(data) }).toString()
  return <>
    <base target="_top" />
    <WeddingWebsite project={data.project} websiteContent={data.content} scheduleItems={data.schedule} rsvpHref={`/ukazka?${query}&tab=rsvp#demo-rsvp`} heroOnly={params?.preview === 'hero'} />
  </>
}
