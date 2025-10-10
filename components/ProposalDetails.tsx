import { ProposalType } from '@prisma/client'
import {
  MapDifficultyProposalData,
  AddMapProposalData,
  ChangeRuleProposalData,
} from '@/lib/types'

interface ProposalDetailsProps {
  type: ProposalType
  proposalData: any
}

export default function ProposalDetails({ type, proposalData }: ProposalDetailsProps) {
  if (type === 'MAP_DIFFICULTY') {
    const data = proposalData as MapDifficultyProposalData
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-xs text-[var(--foreground-muted)] mb-1">Map</div>
            <div className="text-lg font-semibold text-[var(--foreground)]">
              {data.mapName}
            </div>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-xs text-[var(--foreground-muted)] mb-1">Scope</div>
            <div className="text-lg font-semibold text-[var(--foreground)]">
              {data.fullClearOnly ? 'Full Clear Only' : 'All Clears'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 py-6 bg-[var(--background)] border border-[var(--border)] rounded-lg">
          <div className="text-center">
            <div className="text-xs text-[var(--foreground-muted)] mb-2">Current Rating</div>
            <div className="text-4xl font-bold text-[var(--foreground)]">
              {data.currentStars ? `${data.currentStars}★` : 'Unrated'}
            </div>
          </div>
          <div className="text-2xl text-[var(--foreground-muted)]">→</div>
          <div className="text-center">
            <div className="text-xs text-[var(--foreground-muted)] mb-2">Proposed Rating</div>
            <div className="text-4xl font-bold text-blue-400">
              {data.proposedStars}★
            </div>
          </div>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">Reasoning</div>
          <div className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap">
            {data.reasoning}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'ADD_MAP') {
    const data = proposalData as AddMapProposalData
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-xs text-[var(--foreground-muted)] mb-1">Map Name</div>
            <div className="text-lg font-semibold text-[var(--foreground)]">
              {data.mapName}
            </div>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-xs text-[var(--foreground-muted)] mb-1">Creator</div>
            <div className="text-lg font-semibold text-[var(--foreground)]">
              {data.creatorName}
            </div>
          </div>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-xs text-[var(--foreground-muted)] mb-1">Proposed Rating</div>
          <div className="text-2xl font-bold text-blue-400">{data.stars}★</div>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">
            Evidence {data.evidenceUrls.length > 1 ? `URLs (${data.evidenceUrls.length})` : 'URL'}
          </div>
          <div className="space-y-2">
            {data.evidenceUrls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-400 hover:text-blue-300 transition-colors break-all"
              >
                {data.evidenceUrls.length > 1 && `${index + 1}. `}{url}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">Reasoning</div>
          <div className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap">
            {data.reasoning}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'CHANGE_RULE') {
    const data = proposalData as ChangeRuleProposalData
    return (
      <div className="space-y-4">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">Current Text</div>
          <div className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap bg-red-500/10 border border-red-500/30 rounded p-3">
            {data.currentText}
          </div>
        </div>

        <div className="text-center text-[var(--foreground-muted)]">↓</div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">Proposed Text</div>
          <div className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap bg-green-500/10 border border-green-500/30 rounded p-3">
            {data.proposedText}
          </div>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">Reasoning</div>
          <div className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap">
            {data.reasoning}
          </div>
        </div>
      </div>
    )
  }

  return null
}

