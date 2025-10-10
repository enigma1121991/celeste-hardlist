'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapWithDetails } from '@/lib/types'
import { GM_TIER_LABELS } from '@/lib/types'

interface MapTableProps {
  maps: MapWithDetails[]
}

type SortField = 'name' | 'creator' | 'stars' | 'gmTier' | 'lowDeathRecord' | 'clears'
type SortDirection = 'asc' | 'desc'

export default function MapTable({ maps }: MapTableProps) {
  const [sortField, setSortField] = useState<SortField>('stars')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedMaps = [...maps].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'creator':
        aValue = a.creator.name.toLowerCase()
        bValue = b.creator.name.toLowerCase()
        break
      case 'stars':
        aValue = a.stars ?? 0
        bValue = b.stars ?? 0
        break
      case 'gmTier':
        aValue = a.gmTier ?? ''
        bValue = b.gmTier ?? ''
        break
      case 'lowDeathRecord':
        aValue = a.lowDeathRecord ?? 999999
        bValue = b.lowDeathRecord ?? 999999
        break
      case 'clears':
        aValue = a._count.runs
        bValue = b._count.runs
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getGmColorClass = (color: string | null) => {
    if (!color) return 'bg-gray-500'
    if (color === 'GREEN') return 'bg-[#16a34a]'
    if (color === 'YELLOW') return 'bg-[#ca8a04]'
    if (color === 'RED') return 'bg-[#dc2626]'
    return 'bg-gray-500'
  }

  const getStarColorClass = (stars: number | null) => {
    if (!stars) return 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)]'
    
    const colorMap: Record<number, string> = {
      1: 'bg-[#9900ff] text-white',
      2: 'bg-[#ff39d2] text-white',
      3: 'bg-[#fe496a] text-white',
      4: 'bg-[#ff5435] text-white',
      5: 'bg-[#ffff32] text-black',
      6: 'bg-[#32ff32] text-black',
      7: 'bg-[#32ffa0] text-black',
      8: 'bg-[#32ffff] text-black',
    }
    
    return colorMap[stars] || 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)]'
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400">⇅</span>
    return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--background-hover)] border-b border-[var(--border)] sticky top-0">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-4 py-3 text-left cursor-pointer hover:bg-[var(--background)] transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                  Map Name <SortIcon field="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('creator')}
                className="px-4 py-3 text-left cursor-pointer hover:bg-[var(--background)] transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                  Creator <SortIcon field="creator" />
                </div>
              </th>
              <th
                onClick={() => handleSort('stars')}
                className="px-4 py-3 text-center cursor-pointer hover:bg-[var(--background)] transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                  Stars <SortIcon field="stars" />
                </div>
              </th>
              <th
                onClick={() => handleSort('gmTier')}
                className="px-4 py-3 text-center cursor-pointer hover:bg-[var(--background)] transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                  GM Tier <SortIcon field="gmTier" />
                </div>
              </th>
              <th
                onClick={() => handleSort('lowDeathRecord')}
                className="px-4 py-3 text-center cursor-pointer hover:bg-[var(--background)] transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                  Low Deaths <SortIcon field="lowDeathRecord" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)]">Tags</th>
              <th
                onClick={() => handleSort('clears')}
                className="px-4 py-3 text-center cursor-pointer hover:bg-[var(--background)] transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                  Clears <SortIcon field="clears" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMaps.map((map, index) => {
              const tags = (map.tags as string[]) || []
              return (
                <tr
                  key={map.id}
                  className="border-b border-[var(--border)] hover:bg-[var(--background-hover)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/maps/${map.slug}`}
                      className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--foreground-muted)] transition-colors"
                    >
                      {map.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                    {map.creator.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {map.stars && (
                      <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${getStarColorClass(map.stars)}`}>
                        {map.stars}★
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {map.gmColor && map.gmTier && (
                      <span
                        className={`inline-block px-2 py-1 ${getGmColorClass(
                          map.gmColor
                        )} text-white rounded text-sm font-medium`}
                      >
                        {GM_TIER_LABELS[map.gmTier]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-[var(--foreground)]">
                    {map.lowDeathRecord ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground-muted)] rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-xs text-[var(--foreground-muted)]">+{tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-[var(--foreground)]">
                    {map._count.runs}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {sortedMaps.length === 0 && (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          No maps found matching your filters.
        </div>
      )}
    </div>
  )
}

