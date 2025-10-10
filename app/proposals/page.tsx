import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProposalsClient from '@/components/ProposalsClient'

export default async function ProposalsPage() {
  const session = await auth()

  // Fetch initial proposals
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
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
  })

  // Check if user can create proposals (must have claimed player)
  let canCreateProposal = false
  if (session?.user) {
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
    })
    canCreateProposal = !!player
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">
              Community Proposals
            </h1>
            <p className="text-lg text-[var(--foreground-muted)]">
              Vote on map difficulty changes, new map additions, and rule modifications
            </p>
          </div>
          {session?.user && canCreateProposal && (
            <Link
              href="/proposals/new"
              className="px-6 py-3 bg-white text-black border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Create Proposal
            </Link>
          )}
        </div>

        {session?.user && !canCreateProposal && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-400">
              You need to claim or create a player profile to create proposals.{' '}
              <Link href="/auth/claim-player" className="underline hover:text-yellow-300">
                Claim a player
              </Link>
              {' or '}
              <Link href="/auth/create-new-player" className="underline hover:text-yellow-300">
                create a new player
              </Link>
            </p>
          </div>
        )}

        {!session?.user && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              Sign in to create proposals and vote on community suggestions
            </p>
          </div>
        )}
      </div>

      {/* Proposals List */}
      <ProposalsClient initialProposals={proposals} />
    </div>
  )
}

