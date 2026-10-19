import { decodeDemoParams } from '../../lib/demoWeddingServer'
import WeddingDemo from '../../components/WeddingDemo'

export const metadata = { title: 'Vyskúšajte si svoju svadbu | YesDay Studio', description: 'Vyplňte svoje údaje a pozrite si svadobný web, pozvánku, QR kartičku aj dashboard v dizajnoch Diana, Botanique a Penelope.' }

export default async function DemoPage({ searchParams }) {
  return <WeddingDemo initialValues={decodeDemoParams(await searchParams)} />
}
