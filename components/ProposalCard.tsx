import Link from 'next/link'
import { Proposal } from '@prisma/client'
import ProposalStatusBadge from './ProposalStatusBadge'
import ProposalTypeBadge from './ProposalTypeBadge'

interface ProposalCardProps {
  proposal: Proposal & {
    createdBy: {
      id: string
      name: string | null
      image: string | null
      discordUsername: string | null
    }
    _count: {
      votes: number
      comments: number
    }
  }
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Link href={`/proposals/${proposal.id}`}>
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--foreground-muted)] transition-colors cursor-pointer">
        {/* Header with badges */}
        <div className="flex items-start gap-2 mb-3">
          <ProposalTypeBadge type={proposal.type} />
          <ProposalStatusBadge status={proposal.status} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          {proposal.title}
        </h3>

        {/* Description preview */}
        <p className="text-sm text-[var(--foreground-muted)] mb-4 line-clamp-2">
          {proposal.description}
        </p>

        {/* Footer with stats and author */}
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <div className="flex items-center gap-4">
            <span>
              {proposal._count.votes} {proposal._count.votes === 1 ? 'vote' : 'votes'}
            </span>
            <span>
              {proposal._count.comments} {proposal._count.comments === 1 ? 'comment' : 'comments'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>by {proposal.createdBy.name || proposal.createdBy.discordUsername || 'Unknown'}</span>
            <span>•</span>
            <span>{formatDate(proposal.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

