import { getMaps, getAllCreators, getAllTags } from '@/lib/maps'
import MapsClient from '@/components/MapsClient'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {

  return {
    title: 'Maps - Hard Clears',
    description: 'List of all hard list maps, sorted by descending difficulty. ',
    openGraph: {
      title: 'Maps - Hard Clears',
      description: 'List of all hard list maps, sorted by descending difficulty. ',
      type: 'website',
      url: 'https://hardclears.com/maps',
    },
    twitter: {
      card: 'summary',
      title: 'Maps - Hard Clears',
      description: 'List of all hard list maps, sorted by descending difficulty. ',
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function MapsPage() {
  const [maps, creators, tags] = await Promise.all([
    getMaps(),
    getAllCreators(),
    getAllTags(),
  ])

  const creatorNames = creators.map((c: { name: any }) => c.name)

  return <MapsClient initialMaps={maps} creators={creatorNames} tags={tags} />
}

