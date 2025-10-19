import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPlayerByHandle, calculatePlayerStats, getPlayers, calculateWeightedStarScore } from '@/lib/players'
import RoleBadge from '@/components/RoleBadge'
import DiscordTag from '@/components/DiscordTag'
import { RUN_TYPE_LABELS } from '@/lib/types'
import { getYouTubeThumbnailFromUrl, getYouTubeEmbedUrl } from '@/lib/youtube'
import { Metadata } from 'next'
import { getStarColor } from "@/components/utils/colors"
import { TwemojiFlag } from "@/components/utils/country"

export async function generateMetadata({params}: { params: { handle: string }}): Promise<Metadata> {
  const player = await getPlayerByHandle(decodeURIComponent(params.handle))

  if (!player) {
    notFound()
  }

  const stats = calculatePlayerStats(player.runs)

  const hardestClear = [...player.runs]
    .filter(run => run.map.stars && run.map.stars > 0)
    .sort((a, b) => (b.map.stars || 0) - (a.map.stars || 0))[0]

    if (!hardestClear) {
      return {
        title: `${player.handle} - Profile - Hard Clears`,
        description: `${player.handle}'s player profile. `,
        openGraph: {
          title: `${player.handle} - Profile - Hard Clears`,
          description: `${player.handle}'s player profile. `,
          type: 'profile',
          url: `https://hardclears.com/players/${player.handle}`,
        },
        twitter: {
          card: 'summary',
          title: `${player.handle} - Profile - Hard Clears`,
          description: `${player.handle}'s player profile. `,
        },
      }
    }

  return {
    title: `${player.handle} - Profile - Hard Clears`,
    description: `${player.handle}'s player profile. ${stats.totalClears} Total Clears. Hardest Clear: ${hardestClear.map.stars}★`,
    openGraph: {
      title: `${player.handle} - Profile - Hard Clears`,
      description: `${player.handle}'s player profile. ${stats.totalClears} Total Clears. Hardest Clear: ${hardestClear.map.stars}★`,
      type: 'profile',
      url: `https://hardclears.com/players/${player.handle}`,
      images: [{url: `${player.user?.image || "/metadata-image.png"}`, width: 256, height: 256}],
    },
    twitter: {
      card: 'summary',
      title: `${player.handle} - Profile - Hard Clears`,
      description: `${player.handle}'s player profile. ${stats.totalClears} Total Clears. Hardest Clear: ${hardestClear.map.stars}★`,
      images: [{url: `${player.user?.image || "/metadata-image.png"}`, width: 256, height: 256}],
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const player = await getPlayerByHandle(decodeURIComponent(handle))

  if (!player) {
    notFound()
  }

  const stats = calculatePlayerStats(player.runs)

  // Calculate player rank
  const allPlayers = await getPlayers()
  
  const playerScores = allPlayers.map((p: { id: any; runs: string | any[] }) => ({
    id: p.id,
    clears: p.runs.length
  })).sort((a: { clears: number }, b: { clears: number }) => b.clears - a.clears)
  
 /*
  const playerScores = allPlayers.map((p: { id: any; runs: any[] }) => ({
    id: p.id,
    score: calculateWeightedStarScore(p.runs)
  })).sort((a: { score: number }, b: { score: number }) => b.score - a.score)
  */
  let rank = 1
  let currentRank = 1
  let previousClears = -1
  
  for (const p of playerScores) {
    if (p.clears !== previousClears) {
      currentRank = rank
      previousClears = p.clears
    }
    if (p.id === player.id) {
      break
    }
    rank++
  }
  
  // const playerRank = currentRank

  // Get hardest clears (sorted by star rating)
  const hardestClears = [...player.runs]
    .filter(run => run.map.stars && run.map.stars > 0)
    .sort((a, b) => (b.map.stars || 0) - (a.map.stars || 0))
    .slice(0, 4) // Get top 4

  // Sort runs by star rating for the table
  const sortedRuns = [...player.runs].sort((a, b) => {
    const aStar = a.map.stars || 0
    const bStar = b.map.stars || 0
    if (bStar !== aStar) return bStar - aStar
    return a.map.name.localeCompare(b.map.name)
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-6 relative" 
           style={{ 
             minHeight: (player.youtubeUrl || player.twitchUrl || player.user?.name) ? '140px' : '120px',
             transition: 'min-height 0.2s ease'
           }}>
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-1 items-center h-full">
            <div className="flex items-center gap-3 flex-wrap">
              {player.user && (
                <Image
                    src={player.user.image || ""}
                    alt={''}
                    width={48}  
                    height={48}
                    className="rounded-full"
                ></Image>
              )}
              <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight flex items-center">
                {player.handle}
                {player.user?.pronouns && (
                  <span className="text-lg font-normal text-[var(--foreground-muted)] ml-3 align-middle">
                  • &nbsp;&nbsp;{player.user.pronouns}
                  </span>)}
              </h1> 
              {player.user?.countryCode && (<TwemojiFlag code={player.user.countryCode} />)}
              {player.user && <RoleBadge role={player.user.role} size="md" />}
            </div>
          </div>

          {/* Rank Badge 
          <div 
            className="px-4 py-2 rounded text-xl font-bold flex items-center gap-2 flex-shrink-0"
            style={{
              backgroundColor: playerRank === 1 ? '#FFC70030' : playerRank === 2 ? '#E8E8E830' : playerRank === 3 ? '#CD7F3230' : 'var(--background-hover)',
              border: '2px solid',
              borderColor: playerRank === 1 ? '#FFC700' : playerRank === 2 ? '#C0C0C0' : playerRank === 3 ? '#CD7F32' : 'var(--border-hover)',
              color: playerRank === 1 ? '#FFC700' : playerRank === 2 ? '#E8E8E8' : playerRank === 3 ? '#CD7F32' : 'var(--foreground)'
            }}
          >
            #{playerRank}
          </div>
          */}
            {/* wonder whats up there */}

            {/* Total Clears */}
            <div className="text-center">
                <div className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                {stats.totalClears}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                Total Clears
                </div>
            </div>
        </div>
        {player.bio && (
            <p className="text-[var(--foreground-muted)] mt-3 max-w-2xl whitespace-pre-wrap">
            {player.bio}
            </p>
        )}
        {player.user?.inputMethod && (
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--background-hover)] text-[var(--foreground-muted)]">
              Input Method: {player.user.inputMethod}
            </span>
          </div>
        )}

        {/* Social Links - bottom right (absolute positioned) */}
        {(player.youtubeUrl || player.twitchUrl || player.user?.name) && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10" 
               style={{ 
                 transform: 'translateY(0)',
                 transition: 'transform 0.2s ease'
               }}>
            {player.youtubeUrl && (
              <a
                href={
                  player.youtubeUrl.startsWith('http')
                  ? player.youtubeUrl
                  : `https://${player.youtubeUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 bg-[#FF0000] border border-[#FF0000] text-white rounded text-sm font-medium hover:bg-[#CC0000] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            )}
            {player.twitchUrl && (
              <a
                href={
                  player.twitchUrl.startsWith('http')
                  ? player.twitchUrl
                  : `https://${player.twitchUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 bg-[#9146FF] border border-[#9146FF] text-white rounded text-sm font-medium hover:bg-[#772CE8] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </a>
            )}
            {player.user?.name && (
              <DiscordTag tag={player.user.discordUsername} />
            )}
          </div>
        )}
      </div>

      {/* Hardest Clears */}
      {hardestClears.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Hardest Clears</h2>
          <div className="space-y-4">
            {/* Primary hardest clear with video */}
            {hardestClears[0] && (() => {
              const primaryRun = hardestClears[0]
              
              // Try to get embed URL, prioritize player evidence, fallback to map canonical
              let embedUrl = null
              let videoSource = null
              
              if (primaryRun.evidenceUrls && primaryRun.evidenceUrls.length > 0) {
                embedUrl = getYouTubeEmbedUrl(primaryRun.evidenceUrls[0])
                videoSource = 'player'
              }
              
              if (!embedUrl && primaryRun.map.canonicalVideoUrl) {
                embedUrl = getYouTubeEmbedUrl(primaryRun.map.canonicalVideoUrl)
                videoSource = 'map'
              }

              return (
                <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        href={`/maps/${primaryRun.map.slug}`}
                        className="text-xl font-bold text-[var(--foreground)] hover:text-[var(--foreground-muted)] transition-colors"
                      >
                        {primaryRun.map.name}
                      </Link>
                      <p className="text-sm text-[var(--foreground-muted)] mt-1">
                        {primaryRun.map.creator.name}
                      </p>
                    </div>
                    {primaryRun.map.stars && (
                      <div 
                        className="px-3 py-1.5 rounded font-bold text-lg"
                        style={{ 
                          backgroundColor: `${getStarColor(primaryRun.map.stars)}20`,
                          color: getStarColor(primaryRun.map.stars),
                          border: `2px solid ${getStarColor(primaryRun.map.stars)}40`
                        }}
                      >
                        {primaryRun.map.stars}★
                      </div>
                    )}
                  </div>
                  {embedUrl && (
                    <div className="max-w-2xl mx-auto">
                      <div className="relative w-full mb-3" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={embedUrl}
                          className="absolute top-0 left-0 w-full h-full rounded border border-[var(--border)]"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-[var(--foreground-muted)]">
                    {RUN_TYPE_LABELS[primaryRun.type]}
                  </div>
                </div>
              )
            })()}

            {/* Next 3 hardest with smaller thumbnails */}
            {hardestClears.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {hardestClears.slice(1, 4).map((run) => {
                  // Try to get thumbnail URL, prioritize player evidence, fallback to map canonical
                  let thumbnailUrl = null
                  let videoUrl = null
                  
                  if (run.evidenceUrls && run.evidenceUrls.length > 0) {
                    thumbnailUrl = getYouTubeThumbnailFromUrl(run.evidenceUrls[0], 'medium')
                    videoUrl = run.evidenceUrls[0]
                  }
                  
                  if (!thumbnailUrl && run.map.canonicalVideoUrl) {
                    thumbnailUrl = getYouTubeThumbnailFromUrl(run.map.canonicalVideoUrl, 'medium')
                    videoUrl = run.map.canonicalVideoUrl
                  }

                  return (
                    <div key={run.id} className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-3 hover:border-[var(--border-hover)] transition-colors">
                      {thumbnailUrl && videoUrl && (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative w-full h-32 bg-[var(--background-hover)] rounded overflow-hidden mb-3 group"
                        >
                          <Image
                            src={thumbnailUrl}
                            alt={run.map.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <span className="text-black text-base ml-0.5">▶</span>
                            </div>
                          </div>
                        </a>
                      )}
                      <Link
                        href={`/maps/${run.map.slug}`}
                        className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--foreground-muted)] transition-colors"
                      >
                        {run.map.name}
                      </Link>
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        {run.map.creator.name}
                      </p>
                      {run.map.stars && (
                        <div 
                          className="mt-2 px-2 py-1 rounded font-bold text-xs inline-block"
                          style={{ 
                            backgroundColor: `${getStarColor(run.map.stars)}20`,
                            color: getStarColor(run.map.stars),
                            border: `2px solid ${getStarColor(run.map.stars)}40`
                          }}
                        >
                          {run.map.stars}★
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clears Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-[var(--foreground)]">All Clears</h2>
        <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--background-hover)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)]">Stars</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)]">Map</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)]">Creator</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)]">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--foreground-muted)]">Proof</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--foreground-muted)]">Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedRuns.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--background-hover)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      {run.map.stars ? (
                        <div 
                          className="px-2 py-1 rounded font-bold text-xs inline-block"
                          style={{ 
                            backgroundColor: `${getStarColor(run.map.stars)}20`,
                            color: getStarColor(run.map.stars),
                            border: `2px solid ${getStarColor(run.map.stars)}40`
                          }}
                        >
                          {run.map.stars}★
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--foreground-muted)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/maps/${run.map.slug}`}
                        className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--foreground-muted)] transition-colors"
                      >
                        {run.map.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                      {run.map.creator.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--foreground-muted)]">{RUN_TYPE_LABELS[run.type]}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {run.evidenceUrls && run.evidenceUrls.length > 0 ? (
                        run.evidenceUrls.length === 1 ? (
                          <a
                            href={run.evidenceUrls[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-2 py-1 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded text-xs hover:border-[var(--border-hover)] transition-colors"
                          >
                            {run.evidenceUrls[0].includes("youtu") ? "YouTube" : 
                            (run.evidenceUrls[0].includes("bilibili") || run.evidenceUrls[0].includes("b23.tv")) ? "Bilibili" :
                            run.evidenceUrls[0].includes("catbox") ? "Catbox" :
                            run.evidenceUrls[0].includes("discord") ? "Discord" : "Other"}
                          </a>
                        ) : (
                          <div className="flex gap-1 justify-center">
                            {run.evidenceUrls.map((url: string, index: number) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-2 py-1 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded text-xs hover:border-[var(--border-hover)] transition-colors"
                              >
                                {index + 1}
                              </a>
                            ))}
                          </div>
                        )
                      ) : (
                        <span className="text-[var(--foreground-muted)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-[var(--foreground-muted)]">
                      {new Date(run.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}