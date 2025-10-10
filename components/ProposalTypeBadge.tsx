import { ProposalType } from '@prisma/client'
import { PROPOSAL_TYPE_LABELS } from '@/lib/types'

interface ProposalTypeBadgeProps {
  type: ProposalType
  className?: string
}

export default function ProposalTypeBadge({ type, className = '' }: ProposalTypeBadgeProps) {
  const getTypeColor = (type: ProposalType) => {
    switch (type) {
      case 'MAP_DIFFICULTY':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'ADD_MAP':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'CHANGE_RULE':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(type)} ${className}`}
    >
      {PROPOSAL_TYPE_LABELS[type]}
    </span>
  )
}

