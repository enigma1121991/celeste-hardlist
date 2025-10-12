'use client'

import { useState, useEffect } from 'react'
import { Proposal, ProposalType, ProposalStatus } from '@prisma/client'
import ProposalCard from './ProposalCard'

type ProposalWithDetails = Proposal & {
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

interface ProposalsClientProps {
  initialProposals: ProposalWithDetails[]
}

export default function ProposalsClient({ initialProposals }: ProposalsClientProps) {
  const [proposals, setProposals] = useState(initialProposals)
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<ProposalType | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<'recent' | 'votes' | 'discussed'>('recent')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchProposals()
  }, [statusFilter, typeFilter, sortBy])

  const fetchProposals = async () => {
    setIsLoading(true)

    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (typeFilter !== 'ALL') params.set('type', typeFilter)
      params.set('sortBy', sortBy)

      const response = await fetch(`/api/proposals?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setProposals(data.proposals)
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProposals = proposals.filter((proposal) => {
    if (statusFilter !== 'ALL' && proposal.status !== statusFilter) return false
    if (typeFilter !== 'ALL' && proposal.type !== typeFilter) return false
    return true
  })

  const sortedProposals = [...filteredProposals].sort((a, b) => {
    if (sortBy === 'votes') {
      return b._count.votes - a._count.votes
    } else if (sortBy === 'discussed') {
      return b._count.comments - a._count.comments
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('ACCEPTED')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'ACCEPTED'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED_VETOED')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'REJECTED_VETOED'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
              }`}
            >
              Rejected (Vetoed)
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED_VOTES')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'REJECTED_VOTES'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
              }`}
            >
              Rejected (Votes)
            </button>
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                typeFilter === 'ALL'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('MAP_DIFFICULTY')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                typeFilter === 'MAP_DIFFICULTY'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
              }`}
            >
              Map Difficulty
            </button>
            <button
              onClick={() => setTypeFilter('ADD_MAP')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                typeFilter === 'ADD_MAP'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
              }`}
            >
              Add Map
            </button>
            <button
              onClick={() => setTypeFilter('CHANGE_RULE')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                typeFilter === 'CHANGE_RULE'
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--background-hover)]'
              }`}
            >
              Change Rule
            </button>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'votes' | 'discussed')}
            className="px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)]"
          >
            <option value="recent">Most Recent</option>
            <option value="votes">Most Votes</option>
            <option value="discussed">Most Discussed</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          Loading proposals...
        </div>
      )}

      {/* Proposals List */}
      {!isLoading && sortedProposals.length === 0 && (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          No proposals found matching your filters.
        </div>
      )}

      {!isLoading && sortedProposals.length > 0 && (
        <div className="flex flex-col gap-4">
          {sortedProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  )
}

