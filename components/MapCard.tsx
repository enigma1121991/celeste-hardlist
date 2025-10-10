import Link from 'next/link'
import Image from 'next/image'
import { MapWithDetails } from '@/lib/types'
import { GM_TIER_LABELS } from '@/lib/types'
import { getYouTubeThumbnailFromUrl } from '@/lib/youtube'

interface MapCardProps {
  map: MapWithDetails
}

export default function MapCard({ map }: MapCardProps) {
  const tags = (map.tags as string[]) || []
  const clearCount = map._count.runs
  const thumbnailUrl = map.canonicalVideoUrl ? getYouTubeThumbnailFromUrl(map.canonicalVideoUrl, 'medium') : null

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

  return (
    <Link href={`/maps/${map.slug}`}>
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded overflow-hidden hover:border-[var(--border-hover)] transition-colors h-full flex flex-col group">
        {/* Thumbnail */}
        {thumbnailUrl && (
          <div className="relative w-full h-48 bg-[var(--background-hover)] overflow-hidden">
            <Image 
              src={thumbnailUrl} 
              alt={`${map.name} thumbnail`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {map.canonicalVideoUrl && (
              <a 
                href={map.canonicalVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <span className="text-black text-xl ml-1">▶</span>
                </div>
              </a>
            )}
          </div>
        )}
        
        <div className="p-5 flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-[var(--foreground)] line-clamp-2">
              {map.name}
            </h3>
          </div>

          {/* Creator */}
          <p className="text-sm text-[var(--foreground-muted)] mb-3">
            {map.creator.name}
          </p>

          {/* GM Tier Badge */}
          {map.gmColor && map.gmTier && (
            <div className="mb-3">
              <span
                className={`inline-block px-2 py-1 ${getGmColorClass(
                  map.gmColor
                )} text-white rounded text-sm font-medium`}
              >
                {GM_TIER_LABELS[map.gmTier]}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-4 mb-3 text-xl mt-auto">
            <div className="text-[var(--foreground)]">
              <span className="font-bold text-2xl">{clearCount}</span>
              <span className="text-[var(--foreground-muted)] ml-2">clears</span>
            </div>
            {map.lowDeathRecord !== null && (
              <div className="text-[var(--foreground)]">
                <span className="font-bold text-2xl">{map.lowDeathRecord}</span>
                <span className="text-[var(--foreground-muted)] ml-2">deaths</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground-muted)] rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 4 && (
                <span className="px-2 py-0.5 text-[var(--foreground-muted)] text-xs">
                  +{tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

