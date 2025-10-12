import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProposalStatusBadge from '@/components/ProposalStatusBadge'
import ProposalTypeBadge from '@/components/ProposalTypeBadge'
import ProposalDetails from '@/components/ProposalDetails'
import ProposalVoteSection from '@/components/ProposalVoteSection'
import ProposalDiscussion from '@/components/ProposalDiscussion'
import { updateProposalStatus } from '@/lib/actions/proposal-actions'
import { Metadata } from 'next'

export async function generateMetadata({ params }: ProposalPageProps): Promise<Metadata> {
    const { id } = await params
  const session = await auth()

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          role: true,
          name: true,
          image: true,
          discordUsername: true,
        },
      },
      closedBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      votes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              discordUsername: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      comments: {
        where: {
          parentId: null,
        },
        include: {
          user: {
            select: {
              role: true,
              id: true,
              name: true,
              image: true,
              discordUsername: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  role: true,
                  id: true,
                  name: true,
                  image: true,
                  discordUsername: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      role: true,
                      id: true,
                      name: true,
                      image: true,
                      discordUsername: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!proposal) {
    return {
        title: 'Proposal not found! - Hard Clears',
        openGraph: {
            title: 'Proposal not found! - Hard Clears',
            type: 'website',

        }
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return {
    title: `[${proposal.type}] ${proposal.title} - Hard Clears`,
    description: `Proposed by ${proposal.createdBy.name || proposal.createdBy.discordUsername || 'Unknown'}. ${
        proposal.closedAt && proposal.closedBy ? `Closed by ${proposal.closedBy.name || 'Admin'} on ${formatDate(proposal.closedAt)}` : ""}`,
    openGraph: {
      title: `[${proposal.type}] ${proposal.title} - Hard Clears`,
      description: `Proposed by ${proposal.createdBy.name || proposal.createdBy.discordUsername || 'Unknown'}. ${
        proposal.closedAt && proposal.closedBy && `Closed by ${proposal.closedBy.name || 'Admin'} on ${formatDate(proposal.closedAt)}`}`,
      type: 'website',
      url: `https://hardclears.com/proposals/${proposal.id}`,
    },
    twitter: {
      card: 'summary',
      title: `[${proposal.type}] ${proposal.title} - Hard Clears`,
      description: `Proposed by ${proposal.createdBy.name || proposal.createdBy.discordUsername || 'Unknown'}. ${
        proposal.closedAt && proposal.closedBy && `Closed by ${proposal.closedBy.name || 'Admin'} on ${formatDate(proposal.closedAt)}`}`,
    },
  }
}

interface ProposalPageProps {
  params: Promise<{ id: string }>
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params
  const session = await auth()

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
          image: true,
          discordUsername: true,
        },
      },
      closedBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      votes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              discordUsername: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      comments: {
        where: {
          parentId: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              image: true,
              discordUsername: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                  image: true,
                  discordUsername: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      role: true,
                      image: true,
                      discordUsername: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!proposal) {
    notFound()
  }

  const canModerateProposal = session?.user && (session.user.role === 'ADMIN' || session.user.role === 'MOD')

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Link */}
      <Link
        href="/proposals"
        className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors mb-6"
      >
        ← Back to Proposals
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-4">
          <ProposalTypeBadge type={proposal.type} />
          <ProposalStatusBadge status={proposal.status} />
        </div>

        <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
          {proposal.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
          <span>
            Proposed by {proposal.createdBy.name || proposal.createdBy.discordUsername || 'Unknown'}
          </span>
          <span>•</span>
          <span>{formatDate(proposal.createdAt)}</span>
        </div>

        {proposal.closedAt && proposal.closedBy && (
          <div className="mt-3 text-sm text-[var(--foreground-muted)]">
            Closed by {proposal.closedBy.name || 'Admin'} on {formatDate(proposal.closedAt)}
            {proposal.closedReason && (
              <span className="block mt-1">Reason: {proposal.closedReason}</span>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-8 bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
        <p className="text-[var(--foreground-muted)] whitespace-pre-wrap">
          {proposal.description}
        </p>
      </div>

      {/* Proposal Details */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Proposal Details
        </h2>
        <ProposalDetails type={proposal.type} proposalData={proposal.proposalData} />
      </div>

      {/* Admin Actions */}
      {canModerateProposal && proposal.status === 'PENDING' && (
        <div className="mb-8 bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Admin Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <form action={async () => {
              'use server'
              const { id: proposalId } = await params
              await updateProposalStatus(proposalId, 'ACCEPTED', 'Accepted by admin')
            }}>
              <button
                type="submit"
                className="px-6 py-2 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Accept Proposal
              </button>
            </form>

            <form action={async () => {
              'use server'
              const { id: proposalId } = await params
              await updateProposalStatus(proposalId, 'REJECTED_VETOED', 'Vetoed by admin')
            }}>
              <button
                type="submit"
                className="px-6 py-2 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Reject (Veto)
              </button>
            </form>

            <form action={async () => {
              'use server'
              const { id: proposalId } = await params
              await updateProposalStatus(proposalId, 'REJECTED_VOTES', 'Not enough community support')
            }}>
              <button
                type="submit"
                className="px-6 py-2 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Reject (Not Enough Votes)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Voting Section */}
      <div className="mb-8 bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
          Voting
        </h2>
        <ProposalVoteSection
          proposalId={proposal.id}
          votes={proposal.votes}
          currentUserId={session?.user?.id}
          proposalStatus={proposal.status}
        />
      </div>

      {/* Discussion */}
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
        <ProposalDiscussion
          proposalId={proposal.id}
          comments={proposal.comments}
          currentUserId={session?.user?.id}
          originalPosterId={proposal.createdBy.id}
        />
      </div>
    </div>
  )
}

