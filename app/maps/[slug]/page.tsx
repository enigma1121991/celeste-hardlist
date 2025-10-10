import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getMapBySlug } from '@/lib/maps'
import { GM_TIER_LABELS, RUN_TYPE_LABELS } from '@/lib/types'
import { getYouTubeThumbnailFromUrl, getYouTubeEmbedUrl } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

interface MapPageProps {
  params: {
    slug: string
  }
}

export default async function MapPage({ params }: MapPageProps) {
  const map = await getMapBySlug(params.slug)

  if (!map) {
    notFound()
  }

  const tags = (map.tags as string[]) || []
  const clearCount = map.runs.length

  const getGmColorClass = (color: string | null) => {
    if (!color) return 'bg-gray-500'
    if (color === 'GREEN') return 'bg-[#16a34a]'
    if (color === 'YELLOW') return 'bg-[#ca8a04]'
    if (color === 'RED') return 'bg-[#dc2626]'
    return 'bg-gray-500'
  }

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

  const embedUrl = map.canonicalVideoUrl ? getYouTubeEmbedUrl(map.canonicalVideoUrl) : null

  // Group runs by player first
  const runsByPlayer = map.runs.reduce((acc, run) => {
    const playerId = run.playerId
    if (!acc[playerId]) {
      acc[playerId] = []
    }
    acc[playerId].push(run)
    return acc
  }, {} as Record<string, typeof map.runs>)

  // For each player, get the primary run (with video if possible) and additional runs
  const playerRunsData = Object.values(runsByPlayer).map((playerRuns) => {
    // Sort to prioritize runs with YouTube video thumbnails
    const sorted = [...playerRuns].sort((a, b) => {
      const aHasVideo = a.evidenceUrls?.[0] && getYouTubeThumbnailFromUrl(a.evidenceUrls[0], 'default') !== null
      const bHasVideo = b.evidenceUrls?.[0] && getYouTubeThumbnailFromUrl(b.evidenceUrls[0], 'default') !== null
      if (aHasVideo && !bHasVideo) return -1
      if (!aHasVideo && bHasVideo) return 1
      return 0
    })
    
    return {
      player: playerRuns[0].player,
      primaryRun: sorted[0],
      additionalRuns: sorted.slice(1),
    }
  })

  // Group by run type for display
  const runsByType = playerRunsData.reduce((acc, data) => {
    const type = data.primaryRun.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(data)
    return acc
  }, {} as Record<string, typeof playerRunsData>)

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {/* Back button */}
      <Link
        href="/maps"
        className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-6"
      >
        ← Back to Maps
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-[var(--foreground)] tracking-tight mb-2">
              {map.name}
            </h1>
            <p className="text-lg text-[var(--foreground-muted)]">
              by {map.creator.name}
            </p>
          </div>

          {/* Star rating */}
          {map.stars && (
            <div
              className="px-4 py-2 rounded-lg font-bold text-2xl"
              style={{
                backgroundColor: `${getStarColor(map.stars)}20`,
                color: getStarColor(map.stars),
                border: `2px solid ${getStarColor(map.stars)}40`,
              }}
            >
              {map.stars}★
            </div>
          )}
        </div>

        {/* Badges and stats row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* GM Tier */}
          {map.gmColor && map.gmTier && (
            <span
              className={`px-3 py-1.5 ${getGmColorClass(
                map.gmColor
              )} text-white rounded text-sm font-medium`}
            >
              {GM_TIER_LABELS[map.gmTier]}
            </span>
          )}

          {/* Stats */}
          <div className="flex gap-6 text-lg">
            <div className="text-[var(--foreground)]">
              <span className="font-bold text-xl">{clearCount}</span>
              <span className="text-[var(--foreground-muted)] ml-2">
                clear{clearCount !== 1 ? 's' : ''}
              </span>
            </div>
            {map.lowDeathRecord !== null && (
              <div className="text-[var(--foreground)]">
                <span className="font-bold text-xl">{map.lowDeathRecord}</span>
                <span className="text-[var(--foreground-muted)] ml-2">
                  death{map.lowDeathRecord !== 1 ? 's' : ''} (record)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[var(--background-elevated)] border border-[var(--border)] text-[var(--foreground-muted)] rounded text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Run Type Breakdown */}
      {(() => {
        const runTypeCounts = map.runs.reduce((acc, run) => {
          acc[run.type] = (acc[run.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const breakdownItems = Object.entries(runTypeCounts)
          .filter(([_, count]) => count > 0)
          .sort((a, b) => {
            // Sort by run type priority
            const priority: Record<string, number> = {
              FULL_CLEAR_GB: 1,
              CLEAR_GB: 2,
              FULL_CLEAR_VIDEO: 3,
              FULL_CLEAR: 4,
              CLEAR_VIDEO: 5,
              CLEAR: 6,
              ALL_DEATHLESS_SEGMENTS: 7,
              CREATOR_CLEAR: 8,
              UNKNOWN: 9,
            }
            return (priority[a[0]] || 999) - (priority[b[0]] || 999)
          })

        if (breakdownItems.length === 0) return null

        return (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {breakdownItems.map(([type, count]) => (
                <div
                  key={type}
                  className="bg-[var(--background-elevated)] border border-[var(--border)] rounded px-3 py-2 hover:border-[var(--border-hover)] transition-colors"
                >
                  <span className="text-base font-bold text-[var(--foreground)] mr-2">
                    {count}
                  </span>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {RUN_TYPE_LABELS[type]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Video */}
      {embedUrl && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Video</h2>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full rounded-lg border border-[var(--border)]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Clears */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Clears ({clearCount})
        </h2>

        {map.runs.length === 0 ? (
          <div className="text-center py-12 bg-[var(--background-elevated)] border border-[var(--border)] rounded">
            <p className="text-[var(--foreground-muted)]">No clears yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(runsByType)
              .sort((a, b) => {
                // Sort by run type priority
                const priority: Record<string, number> = {
                  FULL_CLEAR_GB: 1,
                  CLEAR_GB: 2,
                  FULL_CLEAR_VIDEO: 3,
                  FULL_CLEAR: 4,
                  CLEAR_VIDEO: 5,
                  CLEAR: 6,
                  ALL_DEATHLESS_SEGMENTS: 7,
                  CREATOR_CLEAR: 8,
                  UNKNOWN: 9,
                }
                return (priority[a] || 999) - (priority[b] || 999)
              })
              .map((type) => {
                const playerRuns = runsByType[type]
                return (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                      {RUN_TYPE_LABELS[type]} ({playerRuns.length})
                    </h3>
                    <div className="grid gap-3">
                      {playerRuns.map((data) => {
                        const { player, primaryRun, additionalRuns } = data
                        const thumbnailUrl = primaryRun.evidenceUrls?.[0]
                          ? getYouTubeThumbnailFromUrl(primaryRun.evidenceUrls[0], 'default')
                          : null
                        const hasVideo = thumbnailUrl !== null
                        const hasAdditionalRuns = additionalRuns.length > 0
                        const hasMultipleUrls = primaryRun.evidenceUrls && primaryRun.evidenceUrls.length > 1

                        return (
                          <div
                            key={primaryRun.id}
                            className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-4 hover:border-[var(--border-hover)] transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {/* Thumbnail */}
                              {thumbnailUrl && primaryRun.evidenceUrls?.[0] && (
                                <a
                                  href={primaryRun.evidenceUrls[0]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 w-32 h-20 bg-[var(--background-hover)] rounded overflow-hidden group/thumb relative"
                                >
                                  <Image
                                    src={thumbnailUrl}
                                    alt={`${player.handle} clear`}
                                    fill
                                    className="object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                                      <span className="text-black text-sm ml-0.5">▶</span>
                                    </div>
                                  </div>
                                </a>
                              )}

                              {/* Player info */}
                              <div className="flex-1">
                                <Link
                                  href={`/players/${encodeURIComponent(player.handle)}`}
                                  className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--foreground-muted)] transition-colors"
                                >
                                  {player.handle}
                                </Link>
                                {primaryRun.deaths !== null && (
                                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                                    {primaryRun.deaths} death{primaryRun.deaths !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>

                              {/* Evidence links - show if no video OR has additional URLs/runs */}
                              {(!hasVideo || hasMultipleUrls || hasAdditionalRuns) && primaryRun.evidenceUrls && primaryRun.evidenceUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {primaryRun.evidenceUrls.map((url: string, index: number) => (
                                    <a
                                      key={index}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-4 py-2 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm font-medium hover:border-[var(--border-hover)] transition-colors"
                                    >
                                      {primaryRun.evidenceUrls.length > 1 ? `Evidence ${index + 1}` : 'Evidence'} →
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Additional runs section */}
                            {hasAdditionalRuns && (
                              <details className="mt-4">
                                <summary className="cursor-pointer text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                                  + {additionalRuns.length} more video{additionalRuns.length !== 1 ? 's' : ''} 
                                </summary>
                                <div className="mt-3 space-y-3 pl-4 border-l-2 border-[var(--border)]">
                                  {additionalRuns.map((run) => {
                                    const additionalThumbnailUrl = run.evidenceUrls?.[0]
                                      ? getYouTubeThumbnailFromUrl(run.evidenceUrls[0], 'default')
                                      : null
                                    const hasAdditionalVideo = additionalThumbnailUrl !== null
                                    const hasMultipleAdditionalUrls = run.evidenceUrls && run.evidenceUrls.length > 1

                                    return (
                                      <div
                                        key={run.id}
                                        className="flex items-center gap-3 text-sm"
                                      >
                                        {/* Small thumbnail */}
                                        {additionalThumbnailUrl && run.evidenceUrls?.[0] && (
                                          <a
                                            href={run.evidenceUrls[0]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0 w-20 h-12 bg-[var(--background-hover)] rounded overflow-hidden group/thumb relative"
                                          >
                                            <Image
                                              src={additionalThumbnailUrl}
                                              alt={`${player.handle} additional clear`}
                                              fill
                                              className="object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                              <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                                                <span className="text-black text-xs ml-0.5">▶</span>
                                              </div>
                                            </div>
                                          </a>
                                        )}

                                        {/* Run info */}
                                        <div className="flex-1">
                                          <span className="text-[var(--foreground-muted)]">
                                            {RUN_TYPE_LABELS[run.type]}
                                          </span>
                                          {run.deaths !== null && (
                                            <span className="text-[var(--foreground-muted)] ml-2">
                                              • {run.deaths} death{run.deaths !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                        </div>

                                        {/* Evidence links - show all if no video OR has multiple URLs */}
                                        {(!hasAdditionalVideo || hasMultipleAdditionalUrls) && run.evidenceUrls && run.evidenceUrls.length > 0 && (
                                          <div className="flex gap-2">
                                            {run.evidenceUrls.map((url: string, index: number) => (
                                              <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap text-xs"
                                              >
                                                {run.evidenceUrls.length > 1 ? `Evidence ${index + 1}` : 'Evidence'} →
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </details>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

