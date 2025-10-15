import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateWeightedStarScore } from '@/lib/players'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = 50

    const skip = (page - 1) * pageSize

    // Fetch all players and sort by run count (Prisma limitation)
    const [allPlayers, totalCount] = await Promise.all([
      prisma.player.findMany({
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
            },
          },
        },
      }),
      prisma.player.count(),
    ])

    const sortedPlayers = allPlayers.sort((a, b) => b.runs.length - a.runs.length)
    /*const sortedPlayers = allPlayers.sort((a, b) => {
      const scoreA = calculateWeightedStarScore(a.runs)
      const scoreB = calculateWeightedStarScore(b.runs)
      return scoreB - scoreA
    })*/
    const players = sortedPlayers.slice(skip, skip + pageSize)

    const hasMore = skip + players.length < totalCount

    return NextResponse.json({
      players,
      hasMore,
      page,
      totalCount,
    })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

