import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProposalType, ProposalStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as ProposalType | null
    const status = searchParams.get('status') as ProposalStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    // const sortBy = searchParams.get('sortBy') || 'recent' // recent, votes, discussed

    const skip = (page - 1) * limit

    // Build where clause
    const where: { type?: ProposalType; status?: ProposalStatus } = {}
    if (type) where.type = type
    if (status) where.status = status

    // Build orderBy clause - currently just by createdAt
    // Note: Sorting by vote/comment count would require more complex query
    const orderBy = { createdAt: 'desc' as const }

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              image: true,
              discordUsername: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.proposal.count({ where }),
    ])

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, title, description, proposalData } = body

    if (!type || !title || !description || !proposalData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use server action for validation and creation
    const { createProposal } = await import('@/lib/actions/proposal-actions')
    const result = await createProposal({
      type,
      title,
      description,
      proposalData,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, proposalId: result.proposalId })
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    )
  }
}

