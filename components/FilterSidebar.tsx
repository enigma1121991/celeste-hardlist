'use client'

import { useState, useEffect } from 'react'

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void
  creators: string[]
  tags: string[]
}

export interface FilterState {
  search: string
  stars: number[]
  creator: string
  tags: string[]
}

export default function FilterSidebar({
  onFilterChange,
  creators,
  tags,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    stars: [],
    creator: '',
    tags: [],
  })

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: 'stars' | 'tags', value: any) => {
    setFilters((prev) => {
      const current = prev[key] as any[]
      const newValue = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [key]: newValue }
    })
  }

  const getStarColorClass = (star: number, isSelected: boolean) => {
    if (!isSelected) return 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)]'
    
    const colorMap: Record<number, string> = {
      1: 'bg-[#9900ff] text-white border-0 font-bold',
      2: 'bg-[#ff39d2] text-white border-0 font-bold',
      3: 'bg-[#fe496a] text-white border-0 font-bold',
      4: 'bg-[#ff5435] text-white border-0 font-bold',
      5: 'bg-[#ffff32] text-black border-0 font-bold',
      6: 'bg-[#32ff32] text-black border-0 font-bold',
      7: 'bg-[#32ffa0] text-black border-0 font-bold',
      8: 'bg-[#32ffff] text-black border-0 font-bold',
    }
    
    return colorMap[star] || 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)]'
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      stars: [],
      creator: '',
      tags: [],
    })
  }

  return (
    <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-5 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Filters</h2>
        <button
          onClick={clearFilters}
          className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Search */}
      <div>
        <label className="block text-xs font-medium mb-2 text-[var(--foreground-muted)]">Map Name</label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search..."
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
        />
      </div>

      {/* Stars */}
      <div>
        <label className="block text-xs font-medium mb-2 text-[var(--foreground-muted)]">Difficulty</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((star) => (
            <button
              key={star}
              onClick={() => toggleArrayFilter('stars', star)}
              className={`px-2 py-1.5 rounded text-xs transition-colors ${getStarColorClass(star, filters.stars.includes(star))}`}
            >
              {star}★
            </button>
          ))}
        </div>
      </div>

      {/* Creator */}
      <div>
        <label className="block text-xs font-medium mb-2 text-[var(--foreground-muted)]">Creator</label>
        <input
          type="text"
          value={filters.creator}
          onChange={(e) => updateFilter('creator', e.target.value)}
          placeholder="Filter by creator..."
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium mb-2 text-[var(--foreground-muted)]">Tags</label>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {tags.map((tag) => (
            <label key={tag} className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.tags.includes(tag)}
                onChange={() => toggleArrayFilter('tags', tag)}
                className="rounded border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
              />
              <span className="text-xs text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]">{tag}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

