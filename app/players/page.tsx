import { prisma } from '@/lib/prisma'
import PlayersClient from '@/components/PlayersClient'
import { Metadata } from 'next'
import { calculateWeightedStarScore } from '@/lib/players'
export async function generateMetadata(): Promise<Metadata> {

  return {
    title: 'Player Search - Hard Clears',
    description: 'Search for a player. Loading more as you scroll. ',
    openGraph: {
      title: 'Player Search - Hard Clears',
      description: 'Search for a player. Loading more as you scroll. ',
      type: 'website',
      url: 'https://hardclears.com/players',
      images: [{url: "/metadata-image.png", width: 256, height: 256}],
    },
    twitter: {
      card: 'summary',
      title: `Player Search - Hard Clears`,
      description: `Search for a player. Loading more as you scroll. `,
      images: [{url: "/metadata-image.png", width: 256, height: 256}],
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function PlayersPage() {
  const pageSize = 50
  
  // Load first page of players with limited run data for performance
  // Note: We fetch all players to sort by run count, then take first page
  // This is necessary because Prisma doesn't support ordering by relation count with pagination
  const allPlayers = await prisma.player.findMany({
    include: {
      runs: {
        where: {
          verifiedStatus: 'VERIFIED',
        },
        include: {
          map: {
            select: {
              stars: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          role: true,
          image: true,
        },
      },
    },
  })
  const sortedPlayers = allPlayers.sort((a: any, b: any) => b.runs.length - a.runs.length)

  // Sort by number of clears (descending), then take first page
  /*const sortedPlayers = allPlayers.sort((a: any, b: any) => {
    const scoreA = calculateWeightedStarScore(a.runs)
    const scoreB = calculateWeightedStarScore(b.runs)
    return scoreB - scoreA
  })*/
 const players = sortedPlayers.slice(0, pageSize)

  const totalCount = await prisma.player.count()

  return <PlayersClient initialPlayers={players} totalCount={totalCount} />
}

