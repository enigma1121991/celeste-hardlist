import { ProposalStatus } from '@prisma/client'
import { PROPOSAL_STATUS_LABELS } from '@/lib/types'

interface ProposalStatusBadgeProps {
  status: ProposalStatus
  className?: string
}

export default function ProposalStatusBadge({ status, className = '' }: ProposalStatusBadgeProps) {
  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'ACCEPTED':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'REJECTED_VETOED':
      case 'REJECTED_VOTES':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(status)} ${className}`}
    >
      {PROPOSAL_STATUS_LABELS[status]}
    </span>
  )
}

