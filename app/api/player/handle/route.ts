import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 })
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { handle: true },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    return NextResponse.json({ handle: player.handle })
  } catch (error) {
    console.error('Error fetching player handle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player handle' },
      { status: 500 }
    )
  }
}



