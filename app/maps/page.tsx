import { getMaps, getAllCreators, getAllTags } from '@/lib/maps'
import MapsClient from '@/components/MapsClient'

export const dynamic = 'force-dynamic'

export default async function MapsPage() {
  const [maps, creators, tags] = await Promise.all([
    getMaps(),
    getAllCreators(),
    getAllTags(),
  ])

  const creatorNames = creators.map((c) => c.name)

  return <MapsClient initialMaps={maps} creators={creatorNames} tags={tags} />
}

