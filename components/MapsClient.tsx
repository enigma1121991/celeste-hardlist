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

  // Listen for reset filters event from navbar
  useEffect(() => {
    const handleResetFilters = () => {
      setFilters({
        search: '',
        stars: [],
        creator: '',
        tags: [],
      })
    }

    window.addEventListener('resetFilters', handleResetFilters)
    return () => window.removeEventListener('resetFilters', handleResetFilters)
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
    <div className="flex flex-col lg:flex-row justify-center items-start gap-8 container mx-auto px-4">
      {initialLoad && (
        <div className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm z-50 flex items-center justify-center">
        </div>
      )}

      {/* --- Sidebar --- */}
      <aside className="sticky top-3/8 w-full lg:w-1/4 overflow-y-auto">
        <FilterSidebar
          onFilterChange={handleFilterChange}
          creators={creators}
          tags={tags}
        />
      </aside>

      {/* --- Main Content --- */}
      <div className="w-full lg:w-1/2">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-2">
            Maps
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            {filteredMaps.length} map{filteredMaps.length !== 1 ? 's' : ''} (sorted alphabetically in tiers)
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

      <div className="hidden lg:block w-1/4"></div>
    </div>
  )
}
