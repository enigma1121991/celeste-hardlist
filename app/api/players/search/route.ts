import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ players: [] })
    }

    // Search all players by handle (case-insensitive)
    const players = await prisma.player.findMany({
      where: {
        handle: {
          contains: query,
          mode: 'insensitive',
        },
      },
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
      take: 100, // Limit search results
    })

    // Sort by number of clears (descending)
    const sortedPlayers = players.sort((a, b) => b.runs.length - a.runs.length)

    return NextResponse.json({ players: sortedPlayers })
  } catch (error) {
    console.error('Error searching players:', error)
    return NextResponse.json(
      { error: 'Failed to search players' },
      { status: 500 }
    )
  }
}



