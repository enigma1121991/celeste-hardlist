import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ hasPendingClaim: false })
    }

    // Check for any existing claim
    const existingClaim = await prisma.playerClaim.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        status: true,
        claimToken: true,
      },
    })

    if (existingClaim) {
      // Only redirect to claim-pending if status is PENDING
      // Rejected claims should allow creating a new claim
      if (existingClaim.status === 'PENDING') {
        return NextResponse.json({
          hasPendingClaim: true,
          claimToken: existingClaim.claimToken,
        })
      }
    }

    return NextResponse.json({ hasPendingClaim: false })
  } catch (error) {
    console.error('Error checking claim status:', error)
    return NextResponse.json(
      { error: 'Failed to check claim status' },
      { status: 500 }
    )
  }
}

