'use client'

import { useCallback, useEffect, useState } from 'react'
import MapList from '@/components/MapList'
import FilterSidebar, { FilterState } from '@/components/FilterSidebar'
import { MapWithDetails } from '@/lib/types'

interface MapsClientProps {
  initialMaps: MapWithDetails[]
  creators: string[]
  tags: string[]
}

export default function MapsClient({ initialMaps, creators, tags }: MapsClientProps) {
  const [filteredMaps, setFilteredMaps] = useState(initialMaps)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    stars: [],
    creator: '',
    tags: [],
  })
  const [initialLoad, setInitialLoad] = useState(true)

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  // Hide initial loading animation after short delay
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let result = [...initialMaps]

    // Apply filters
    if (filters.search) {
      result = result.filter((map) =>
        map.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.stars.length > 0) {
      result = result.filter((map) => map.stars && filters.stars.includes(map.stars))
    }

    if (filters.creator) {
      result = result.filter((map) =>
        map.creator.name.toLowerCase().includes(filters.creator.toLowerCase())
      )
    }

    if (filters.tags.length > 0) {
      result = result.filter((map) => {
        const mapTags = (map.tags as string[]) || []
        return filters.tags.every((tag) => mapTags.includes(tag))
      })
    }

    // Sort by stars (descending), then by name
    result.sort((a, b) => {
      if (a.stars !== b.stars) {
        return (b.stars || 0) - (a.stars || 0)
      }
      return a.name.localeCompare(b.name)
    })

    setFilteredMaps(result)
  }, [filters, initialMaps])

  return (
    <div className="relative">
      {/* Initial Loading Animation */}
      {initialLoad && (
        <div className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-[var(--foreground)] animate-pulse">
              Loading maps...
            </p>
          </div>
        </div>
      )}

      {/* Fixed filter sidebar - centered in left margin */}
      <aside className="fixed top-0 bottom-0 pointer-events-none z-10 w-1/5 px-10">
        <div className="h-full flex items-center">
          <div className="w-full max-h-[80vh] overflow-y-auto pointer-events-auto">
            <FilterSidebar
              onFilterChange={handleFilterChange}
              creators={creators}
              tags={tags}
            />
          </div>
        </div>
      </aside>

      {/* Main content - centered */}
      <div className="w-4/5 ml-auto pr-30">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-2">
            Maps
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            {filteredMaps.length} map{filteredMaps.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Maps display */}
        <MapList maps={filteredMaps} />

        {filteredMaps.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No maps found
            </h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
