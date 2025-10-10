import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'

export async function GET(request: Request) {
  try {
    // Check if user has verifier role
    await requireRole(UserRole.VERIFIER)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = 50 // Load 50 runs per page

    if (!status) {
      return NextResponse.json({ error: 'Status parameter required' }, { status: 400 })
    }

    const skip = (page - 1) * pageSize

    // Fetch runs for the requested status with pagination
    const [runs, totalCount] = await Promise.all([
      prisma.run.findMany({
        where: {
          verifiedStatus: status === 'all' 
            ? undefined 
            : status.toUpperCase() as 'PENDING' | 'VERIFIED' | 'DISPUTED',
        },
        include: {
          map: {
            include: {
              creator: true,
            },
          },
          player: true,
          submittedBy: true,
          verificationActions: {
            include: {
              verifier: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.run.count({
        where: {
          verifiedStatus: status === 'all' 
            ? undefined 
            : status.toUpperCase() as 'PENDING' | 'VERIFIED' | 'DISPUTED',
        },
      }),
    ])

    const hasMore = skip + runs.length < totalCount

    return NextResponse.json({ 
      runs, 
      hasMore,
      page,
      totalCount,
    })
  } catch (error) {
    console.error('Error fetching runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch runs' },
      { status: 500 }
    )
  }
}

