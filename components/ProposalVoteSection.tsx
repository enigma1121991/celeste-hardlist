'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VoteType, ProposalVote } from '@prisma/client'
import { VOTE_TYPE_LABELS } from '@/lib/types'

interface ProposalVoteSectionProps {
  proposalId: string
  votes: (ProposalVote & {
    user: {
      id: string
      name: string | null
      image: string | null
      discordUsername: string | null
    }
  })[]
  currentUserId?: string
  proposalStatus: string
  proposalType: string
}

export default function ProposalVoteSection({
  proposalId,
  votes,
  currentUserId,
  proposalStatus,
  proposalType,
}: ProposalVoteSectionProps) {
  const router = useRouter()
  const [isVoting, setIsVoting] = useState(false)
  const [showForceHighlightModal, setShowForceHighlightModal] = useState(false)
  const [forceHighlightReasoning, setForceHighlightReasoning] = useState('')
  const [pendingVote, setPendingVote] = useState<VoteType | null>(null)
  const [showClearedOnly, setShowClearedOnly] = useState(false)

  const userVote = votes.find((v) => v.userId === currentUserId)
  const isOpen = proposalStatus === 'PENDING'

  const displayedVotes = showClearedOnly
    ? votes.filter((v) => v.hasCleared || v.forceHighlight)
    : votes

  const displayedVoteCounts = {
    YES: displayedVotes.filter((v) => v.vote === 'YES').length,
    NO: displayedVotes.filter((v) => v.vote === 'NO').length,
    ABSTAIN: displayedVotes.filter((v) => v.vote === 'ABSTAIN').length,
  }
  const totalDisplayedVotes = displayedVotes.length

  const handleVote = async (vote: VoteType, forceHighlight: boolean = false) => {
    if (!currentUserId) {
      alert('You must be signed in to vote')
      return
    }

    if (!isOpen) {
      alert('This proposal is no longer accepting votes')
      return
    }

    setIsVoting(true)

    try {
      const response = await fetch(`/api/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote,
          forceHighlight,
          reasoning: forceHighlight ? forceHighlightReasoning : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to submit vote')
        return
      }

      router.refresh()
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to submit vote')
    } finally {
      setIsVoting(false)
      setShowForceHighlightModal(false)
      setForceHighlightReasoning('')
      setPendingVote(null)
    }
  }

  const handleVoteWithForceHighlight = (vote: VoteType) => {
    setPendingVote(vote)
    setShowForceHighlightModal(true)
  }

  const handleRemoveVote = async () => {
    if (!currentUserId) {
      alert('You must be signed in to remove your vote')
      return
    }

    if (!isOpen) {
      alert('This proposal is no longer accepting vote changes')
      return
    }

    setIsVoting(true)

    try {
      const response = await fetch(`/api/proposals/${proposalId}/vote`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to remove vote')
        return
      }

      router.refresh()
    } catch (error) {
      console.error('Error removing vote:', error)
      alert('Failed to remove vote')
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Vote Buttons */}
      {currentUserId && isOpen && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleVote('YES')}
              disabled={isVoting}
              className="px-6 py-3 bg-white text-black border border-gray-300 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Yes
            </button>
            <button
              onClick={() => handleVote('NO')}
              disabled={isVoting}
              className="px-6 py-3 bg-white text-black border border-gray-300 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              No
            </button>
            <button
              onClick={() => handleVote('ABSTAIN')}
              disabled={isVoting}
              className="px-6 py-3 bg-white text-black border border-gray-300 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Abstain
            </button>
          </div>
          
          {/* Remove Vote Button */}
          {userVote && (
            <div className="text-center">
              <button
                onClick={handleRemoveVote}
                disabled={isVoting}
                className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                Remove my vote
              </button>
            </div>
          )}
        </div>
      )}

      {/* Request Highlight Option */}
      {currentUserId && isOpen && userVote && !userVote.hasCleared && !userVote.forceHighlight && proposalType === 'MAP_DIFFICULTY' && (
        <div className="text-center">
          <button
            onClick={() => handleVoteWithForceHighlight(userVote.vote)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Request vote highlight (requires reasoning)
          </button>
        </div>
      )}

      {/* Vote Counts */}
      <div className="space-y-3">
      {[
          { voteType: 'YES', count: displayedVoteCounts.YES, colorClass: 'bg-green-500' },
          { voteType: 'NO', count: displayedVoteCounts.NO, colorClass: 'bg-red-500' },
          { voteType: 'ABSTAIN', count: displayedVoteCounts.ABSTAIN, colorClass: 'bg-gray-500' },
      ].map((bar) => (
          <div key={bar.voteType} className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--foreground)] w-20">
              {VOTE_TYPE_LABELS[bar.voteType]}
          </span>
          <div className="flex-1 bg-[var(--background)] rounded-full h-6 overflow-hidden border border-[var(--border)]">
              <div
              className={`${bar.colorClass} h-full transition-all duration-300`}
              style={{
                  width: totalDisplayedVotes > 0
                  ? `${(bar.count / totalDisplayedVotes) * 100}%`
                  : '0%',
              }}
              />
          </div>
          <span className="text-sm text-[var(--foreground-muted)] w-12 text-right">
              {bar.count}
          </span>
          </div>
      ))}
      </div>

      {/* Voter List */}
      {votes.length > 0 && (
        <div className="space-y-2">
        <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">
            Votes ({displayedVotes.length})
            </h4>
            {proposalType === 'MAP_DIFFICULTY' && (
            <button
            onClick={() => setShowClearedOnly(!showClearedOnly)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                showClearedOnly
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                : 'bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
            }`}
            >
            Cleared Only
            </button>
            )}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
            {displayedVotes.map((vote) => {
            const hasSpecialHighlight = vote.hasCleared || vote.forceHighlight;
            const borderClass = vote.hasCleared
                ? 'border-yellow-500/50 bg-yellow-500/5'
                : vote.forceHighlight
                ? 'border-blue-500/50 bg-blue-500/5'
                : 'border-[var(--border)]';

            const tooltipText = vote.forceHighlight && vote.reasoning 
                ? vote.reasoning 
                : vote.hasCleared 
                ? 'This user has cleared this map'
                : '';

            return (
                <div
                key={vote.id}
                className={`flex items-center justify-between p-3 bg-[var(--background-elevated)] border rounded ${borderClass} ${hasSpecialHighlight ? 'cursor-help' : ''}`}
                title={tooltipText}
                >
                <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-[var(--foreground)]">
                    {vote.user.name || vote.user.discordUsername || 'Unknown'}
                    </div>
                    {vote.hasCleared && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs">
                        Cleared
                    </span>
                    )}
                    {vote.forceHighlight && !vote.hasCleared && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs">
                        Highlighted
                    </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                    vote.vote === 'YES' ? 'text-green-400' :
                    vote.vote === 'NO' ? 'text-red-400' :
                    'text-gray-400'
                    }`}>
                    {VOTE_TYPE_LABELS[vote.vote]}
                    </span>
                </div>
                </div>
            );
            })}

            {displayedVotes.length === 0 && showClearedOnly && (
            <div className="text-center text-sm text-[var(--foreground-muted)] py-4">
                No votes from players who have cleared the map.
            </div>
            )}
        </div>
        </div>
      )}

      {/* Force Highlight Modal */}
      {showForceHighlightModal && proposalType === 'MAP_DIFFICULTY' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Request Vote Highlight
            </h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              Please provide reasoning for why your vote should be highlighted (e.g., "I've cleared 90% of this map").
            </p>
            <textarea
              value={forceHighlightReasoning}
              onChange={(e) => setForceHighlightReasoning(e.target.value)}
              placeholder="Enter your reasoning..."
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] text-sm resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  if (!forceHighlightReasoning.trim()) {
                    alert('Please provide reasoning')
                    return
                  }
                  if (pendingVote) {
                    handleVote(pendingVote, true)
                  }
                }}
                disabled={isVoting || !forceHighlightReasoning.trim()}
                className="flex-1 px-4 py-2 bg-white text-black border border-gray-300 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowForceHighlightModal(false)
                  setForceHighlightReasoning('')
                  setPendingVote(null)
                }}
                disabled={isVoting}
                className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded hover:bg-[var(--background-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

