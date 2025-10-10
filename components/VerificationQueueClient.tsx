'use client'

import { useState, useMemo, useEffect } from 'react'
import VerificationQueueItem from './VerificationQueueItem'

interface Map {
  id: string
  name: string
  slug: string
}

interface Player {
  id: string
  handle: string
}

interface Run {
  id: string
  type: string
  evidenceUrls: string[]
  submitterNotes: string | null
  verifiedStatus: string
  createdAt: Date
  updatedAt: Date
  mapId: string
  playerId: string
  map: {
    id: string
    name: string
    slug: string
    stars: number | null
    creator: {
      name: string
    }
  }
  player: {
    id: string
    handle: string
  }
  submittedBy: {
    name: string | null
    discordUsername: string | null
  } | null
  verificationActions: Array<{
    id: string
    action: string
    reason: string | null
    createdAt: Date
    verifier: {
      name: string | null
      discordUsername: string | null
      role: string
    }
  }>
}

interface VerificationQueueClientProps {
  runs: Run[]
  maps: Map[]
  players: Player[]
}

export default function VerificationQueueClient({ runs: initialRuns, maps, players }: VerificationQueueClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [mapFilter, setMapFilter] = useState<string>('all')
  const [playerFilter, setPlayerFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Lazy loading state
  const [allRuns, setAllRuns] = useState<Run[]>(initialRuns)
  const [loadedStatuses, setLoadedStatuses] = useState<Set<string>>(new Set(['PENDING']))
  const [loading, setLoading] = useState(false)
  
  // Infinite scroll state
  const [page, setPage] = useState<Record<string, number>>({ PENDING: 1 })
  const [hasMore, setHasMore] = useState<Record<string, boolean>>({ PENDING: true })
  const [loadingMore, setLoadingMore] = useState(false)

  // Lazy load runs for a specific status
  useEffect(() => {
    const loadStatus = async (status: string) => {
      if (loadedStatuses.has(status) || status === 'PENDING') {
        return // Already loaded or is the initial data
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/verification-queue/runs?status=${status}&page=1`)
        if (response.ok) {
          const data = await response.json()
          setAllRuns(prev => {
            // Merge new runs, avoiding duplicates
            const existingIds = new Set(prev.map(r => r.id))
            const newRuns = data.runs.filter((r: Run) => !existingIds.has(r.id))
            return [...prev, ...newRuns]
          })
          setLoadedStatuses(prev => new Set([...prev, status]))
          setPage(prev => ({ ...prev, [status]: 1 }))
          setHasMore(prev => ({ ...prev, [status]: data.hasMore }))
        }
      } catch (error) {
        console.error(`Failed to load ${status} runs:`, error)
      } finally {
        setLoading(false)
      }
    }

    if (statusFilter === 'all') {
      // Load both VERIFIED and DISPUTED if not already loaded
      if (!loadedStatuses.has('VERIFIED')) {
        loadStatus('VERIFIED')
      }
      if (!loadedStatuses.has('DISPUTED')) {
        loadStatus('DISPUTED')
      }
    } else if (statusFilter !== 'PENDING') {
      loadStatus(statusFilter)
    }
  }, [statusFilter, loadedStatuses])

  // Load more runs for current status (infinite scroll)
  const loadMore = async () => {
    if (loadingMore || !hasMore[statusFilter]) return

    const currentPage = page[statusFilter] || 1
    const nextPage = currentPage + 1

    setLoadingMore(true)
    try {
      const response = await fetch(`/api/verification-queue/runs?status=${statusFilter}&page=${nextPage}`)
      if (response.ok) {
        const data = await response.json()
        if (data.runs.length > 0) {
          setAllRuns(prev => {
            // Merge new runs, avoiding duplicates
            const existingIds = new Set(prev.map(r => r.id))
            const newRuns = data.runs.filter((r: Run) => !existingIds.has(r.id))
            return [...prev, ...newRuns]
          })
          setPage(prev => ({ ...prev, [statusFilter]: nextPage }))
          setHasMore(prev => ({ ...prev, [statusFilter]: data.hasMore }))
        } else {
          setHasMore(prev => ({ ...prev, [statusFilter]: false }))
        }
      }
    } catch (error) {
      console.error('Failed to load more runs:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      // Only trigger if we have data for this status and there's more to load
      if (loadingMore || hasMore[statusFilter] === false) return
      
      // Don't try to load more if we haven't loaded this status at all yet
      if (statusFilter !== 'PENDING' && !loadedStatuses.has(statusFilter) && statusFilter !== 'all') return

      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = document.documentElement.scrollTop
      const clientHeight = document.documentElement.clientHeight

      // Load more when user is 500px from bottom
      if (scrollHeight - scrollTop - clientHeight < 500) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMore, statusFilter, page, loadedStatuses])

  const filteredRuns = useMemo(() => {
    return allRuns.filter(run => {
      // Status filter
      if (statusFilter !== 'all' && run.verifiedStatus !== statusFilter) {
        return false
      }

      // Map filter
      if (mapFilter !== 'all' && run.mapId !== mapFilter) {
        return false
      }

      // Player filter
      if (playerFilter !== 'all' && run.playerId !== playerFilter) {
        return false
      }

      // Search filter (search in map name and player handle)
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesMap = run.map.name.toLowerCase().includes(search)
        const matchesPlayer = run.player.handle.toLowerCase().includes(search)
        if (!matchesMap && !matchesPlayer) {
          return false
        }
      }

      return true
    })
  }, [allRuns, statusFilter, mapFilter, playerFilter, searchTerm])

  const stats = useMemo(() => {
    const pending = allRuns.filter(r => r.verifiedStatus === 'PENDING').length
    const verified = allRuns.filter(r => r.verifiedStatus === 'VERIFIED').length
    const disputed = allRuns.filter(r => r.verifiedStatus === 'DISPUTED').length
    
    return {
      all: allRuns.length,
      pending,
      verified,
      disputed,
    }
  }, [allRuns])

  return (
    <div>
      {/* Info Notice */}
      {statusFilter !== 'PENDING' && !loadedStatuses.has(statusFilter) && statusFilter !== 'all' && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-blue-400">
          ℹ️ Click "All", "Verified", or "Disputed" to load those runs. Once loaded, they're cached for instant switching!
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-4 mb-6">
        {/* Status Filter Buttons with Lazy Loading */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setStatusFilter('all')}
            disabled={loading && statusFilter !== 'all'}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-black'
                : 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)]'
            }`}
          >
            All ({stats.all})
            {loading && statusFilter === 'all' && <span className="ml-2 animate-pulse">...</span>}
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              statusFilter === 'PENDING'
                ? 'bg-white text-black'
                : 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)]'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            disabled={loading && statusFilter !== 'VERIFIED'}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              statusFilter === 'VERIFIED'
                ? 'bg-white text-black'
                : 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)]'
            }`}
          >
            Verified ({loadedStatuses.has('VERIFIED') ? stats.verified : '?'})
            {loading && statusFilter === 'VERIFIED' && <span className="ml-2 animate-pulse">...</span>}
          </button>
          <button
            onClick={() => setStatusFilter('DISPUTED')}
            disabled={loading && statusFilter !== 'DISPUTED'}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              statusFilter === 'DISPUTED'
                ? 'bg-white text-black'
                : 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)]'
            }`}
          >
            Disputed ({loadedStatuses.has('DISPUTED') ? stats.disputed : '?'})
            {loading && statusFilter === 'DISPUTED' && <span className="ml-2 animate-pulse">...</span>}
          </button>
        </div>

        {/* Dropdown Filters and Search */}
        <div className="grid md:grid-cols-3 gap-3">
          {/* Map Filter */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
              Map
            </label>
            <select
              value={mapFilter}
              onChange={(e) => setMapFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] text-sm focus:outline-none focus:border-white"
            >
              <option value="all">All Maps</option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
          </div>

          {/* Player Filter */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
              Player
            </label>
            <select
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] text-sm focus:outline-none focus:border-white"
            >
              <option value="all">All Players</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.handle}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Map or player..."
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:border-white"
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        {(mapFilter !== 'all' || playerFilter !== 'all' || searchTerm) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
            <span>Active filters:</span>
            {mapFilter !== 'all' && (
              <span className="px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded">
                Map: {maps.find(m => m.id === mapFilter)?.name}
              </span>
            )}
            {playerFilter !== 'all' && (
              <span className="px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded">
                Player: {players.find(p => p.id === playerFilter)?.handle}
              </span>
            )}
            {searchTerm && (
              <span className="px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded">
                Search: "{searchTerm}"
              </span>
            )}
            <button
              onClick={() => {
                setMapFilter('all')
                setPlayerFilter('all')
                setSearchTerm('')
              }}
              className="ml-2 text-[var(--foreground)] hover:text-[var(--foreground-muted)] underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-[var(--foreground-muted)]">
          Showing {filteredRuns.length} run{filteredRuns.length !== 1 ? 's' : ''}
        </span>
        {loading && (
          <span className="text-sm text-blue-400 flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Loading {statusFilter} runs...
          </span>
        )}
      </div>

      {/* Runs List */}
      {loading && filteredRuns.length === 0 ? (
        <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-12 text-center">
          <p className="text-[var(--foreground-muted)] text-lg mb-2">Loading...</p>
          <p className="text-sm text-[var(--foreground-muted)]">Fetching {statusFilter} runs</p>
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-12 text-center">
          <p className="text-[var(--foreground-muted)] text-lg">
            No runs match the current filters
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {filteredRuns.map((run) => (
              <VerificationQueueItem key={run.id} run={run} />
            ))}
          </div>

          {/* Infinite Scroll Loading Indicator */}
          {loadingMore && (
            <div className="mt-8 py-8 flex flex-col items-center gap-3">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm text-[var(--foreground-muted)] animate-pulse">
                Loading more runs...
              </p>
            </div>
          )}

          {/* End of Results Indicator */}
          {!loadingMore && hasMore[statusFilter] === false && filteredRuns.length > 0 && (
            <div className="mt-8 py-6 text-center border-t border-[var(--border)]">
              <p className="text-sm text-[var(--foreground-muted)]">
                ✓ All {statusFilter.toLowerCase()} runs loaded ({filteredRuns.length} total)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

