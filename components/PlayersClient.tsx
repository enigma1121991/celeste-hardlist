'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlayerWithRuns } from '@/lib/types'

interface PlayersClientProps {
  initialPlayers: PlayerWithRuns[]
  totalCount: number
}

export default function PlayersClient({ initialPlayers, totalCount }: PlayersClientProps) {
  const [search, setSearch] = useState('')
  const [players, setPlayers] = useState<PlayerWithRuns[]>(initialPlayers)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialPlayers.length < totalCount)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [searchMode, setSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState<PlayerWithRuns[]>([])
  const [searching, setSearching] = useState(false)

  // Hide initial loading animation after short delay
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 300)
    return () => clearTimeout(timer)
  }, [])

  // Search all players in database
  const handleSearch = async () => {
    if (!search.trim()) {
      handleClearSearch()
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/players/search?q=${encodeURIComponent(search)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.players)
        setSearchMode(true)
      }
    } catch (error) {
      console.error('Failed to search players:', error)
    } finally {
      setSearching(false)
    }
  }

  // Clear search and return to paginated view
  const handleClearSearch = () => {
    setSearchMode(false)
    setSearchResults([])
    setSearch('')
  }

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Load more players
  const loadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/players/paginated?page=${page + 1}`)
      if (response.ok) {
        const data = await response.json()
        if (data.players.length > 0) {
          setPlayers(prev => [...prev, ...data.players])
          setPage(page + 1)
          setHasMore(data.hasMore)
        } else {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error('Failed to load more players:', error)
    } finally {
      setLoading(false)
    }
  }

  // Infinite scroll detection
  useEffect(() => {
    if (searchMode) return // Don't infinite scroll during search

    const handleScroll = () => {
      if (loading || !hasMore) return

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
  }, [loading, hasMore, page, searchMode])

  // Use search results if in search mode, otherwise use paginated players
  const displayPlayers = searchMode ? searchResults : players

  const sortedPlayers = [...displayPlayers].sort((a, b) => {
    return b.runs.length - a.runs.length
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-8">
      {/* Initial Loading Animation */}
      {initialLoad && (
        <div className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-[var(--foreground)] animate-pulse">
              Loading players...
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-1">
          Players
        </h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          {searchMode 
            ? `${sortedPlayers.length} search result${sortedPlayers.length !== 1 ? 's' : ''}`
            : `${players.length} player${players.length !== 1 ? 's' : ''}`
          }
          {!searchMode && hasMore && ' (loading more as you scroll)'}
        </p>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search players... (press Enter to search)"
            disabled={searching}
            className="flex-1 px-4 py-2.5 text-sm border border-[var(--border)] rounded bg-[var(--background-elevated)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)] disabled:opacity-50"
          />
          {searchMode && (
            <button
              onClick={handleClearSearch}
              className="px-4 py-2.5 text-sm bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded font-medium hover:border-[var(--border-hover)] transition-colors"
            >
              Clear Search
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={searching || !search.trim()}
            className="px-6 py-2.5 text-sm bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchMode && (
          <div className="text-xs text-[var(--foreground-muted)] flex items-center gap-2">
            <span>🔍</span>
            <span>Showing search results for "{search}"</span>
          </div>
        )}
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedPlayers.map((player) => {
          const fullClears = player.runs.filter((r) =>
            ['FULL_CLEAR_VIDEO', 'FULL_CLEAR', 'FULL_CLEAR_GB'].includes(r.type)
          ).length
          const goldenBerries = player.runs.filter((r) =>
            ['FULL_CLEAR_GB', 'CLEAR_GB'].includes(r.type)
          ).length
          
          // Find hardest clear (highest star rating)
          const hardestClear = player.runs.reduce((max, run) => {
            const stars = run.map.stars || 0
            return stars > max ? stars : max
          }, 0)

          const getStarColor = (stars: number): string => {
            const colorMap: Record<number, string> = {
              1: '#9900ff',
              2: '#ff39d2',
              3: '#fe496a',
              4: '#ff5435',
              5: '#ffff32',
              6: '#32ff32',
              7: '#32ffa0',
              8: '#32ffff',
            }
            return colorMap[stars] || '#71717a'
          }

          return (
            <Link key={player.id} href={`/players/${encodeURIComponent(player.handle)}`}>
              <div 
            //   className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-5 hover:border-[var(--border-hover)] transition-colors h-full flex flex-col"
                className="bg-[var(--background-elevated)] border-2 rounded p-5 transition-colors relative border-[var(--border-color-default)] hover:border-[var(--border-color-hover)] h-full flex flex-col"
                  style={
                    {
                      // @ts-ignore
                      '--border-color-default': `${getStarColor(hardestClear)}40`,
                      '--border-color-hover': getStarColor(hardestClear),
                    } as React.CSSProperties
                  }>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="mb-2">
                    <h3 className="text-base font-semibold text-[var(--foreground)]">
                      {player.handle}
                    </h3>
                  </div>

                  {/* Main stats - right side */}
                  <div className="text-right flex-shrink-0">
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-[var(--foreground)]">
                        {player.runs.length}
                      </span>
                      <span className="text-sm text-[var(--foreground-muted)] ml-2">clears</span>
                    </div>
                    
                    {hardestClear > 0 && (
                      <div 
                        className="pr-1 py-1 rounded font-bold text-sm inline-block"
                        style={{ 
                          backgroundColor: `${getStarColor(hardestClear)}20`,
                          color: getStarColor(hardestClear),
                          border: `2px solid ${getStarColor(hardestClear)}40`
                        }}
                      >
                      <span className="text-sm text-[var(--foreground-muted)] ml-2">Hardest Clear:  </span>

                        {hardestClear}★
                        
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats aligned to bottom */}
                <div className="mt-auto pt-3 border-t border-[var(--border)] text-xs text-[var(--foreground-muted)]">
                  {fullClears} full clear{fullClears !== 1 ? 's' : ''}, {goldenBerries} golden{goldenBerries !== 1 ? 's' : ''}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {sortedPlayers.length === 0 && !loading && !searching && (
        <div className="text-center py-20">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No players found
          </h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            {searchMode ? 'Try a different search term' : 'No players available'}
          </p>
        </div>
      )}

      {/* Search Loading Indicator */}
      {searching && (
        <div className="py-12 flex flex-col items-center gap-3">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[var(--foreground-muted)] animate-pulse">
            Searching all players...
          </p>
        </div>
      )}

      {/* Infinite Scroll Loading Indicator */}
      {loading && !searchMode && (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[var(--foreground-muted)] animate-pulse">
            Loading more players...
          </p>
        </div>
      )}

      {/* End of Results Indicator */}
      {!loading && !hasMore && !searchMode && sortedPlayers.length > 0 && (
        <div className="py-6 text-center border-t border-[var(--border)]">
          <p className="text-sm text-[var(--foreground-muted)]">
            ✓ All {players.length} players loaded
          </p>
        </div>
      )}
    </div>
  )
}

