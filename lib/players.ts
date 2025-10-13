import { prisma } from './prisma'
import { RunType } from '@prisma/client'

export async function getPlayers() {
  return await prisma.player.findMany({
    include: {
      runs: {
        where: {
          verifiedStatus: 'VERIFIED',
        },
        include: {
          map: {
            select: {
              stars: true,
            },
          },
        },
        // Only load minimal run data needed for stats
        // This improves performance vs loading all run details
        take: 1000, // Reasonable limit per player
      },
    },
    orderBy: {
      handle: 'asc',
    },
  })
}

export async function getPlayerByHandle(handle: string) {
  return await prisma.player.findUnique({
    where: { handle },
    include: {
      user: {
        select: {
          id: true,
          role: true,
        },
      },
      runs: {
        where: {
          verifiedStatus: 'VERIFIED',
        },
        include: {
          map: {
            include: {
              creator: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })
}

export interface PlayerStats {
  totalClears: number
  fullClearWithVideo: number
  fullClear: number
  clearWithVideo: number
  clear: number
  fullClearGB: number
  clearGB: number
  creatorClear: number
  allDeathlessSegments: number
  totalDeaths: number
  averageDeaths: number
}

export function calculatePlayerStats(runs: any[]): PlayerStats {
  const stats: PlayerStats = {
    totalClears: runs.length,
    fullClearWithVideo: 0,
    fullClear: 0,
    clearWithVideo: 0,
    clear: 0,
    fullClearGB: 0,
    clearGB: 0,
    creatorClear: 0,
    allDeathlessSegments: 0,
    totalDeaths: 0,
    averageDeaths: 0,
  }

  runs.forEach((run) => {
    switch (run.type) {
      case 'FULL_CLEAR_VIDEO':
        stats.fullClearWithVideo++
        break
      case 'FULL_CLEAR':
        stats.fullClear++
        break
      case 'CLEAR_VIDEO':
        stats.clearWithVideo++
        break
      case 'CLEAR':
        stats.clear++
        break
      case 'FULL_CLEAR_GB':
        stats.fullClearGB++
        break
      case 'CLEAR_GB':
        stats.clearGB++
        break
      case 'CREATOR_CLEAR':
        stats.creatorClear++
        break
      case 'ALL_DEATHLESS_SEGMENTS':
        stats.allDeathlessSegments++
        break
    }

    if (run.deaths !== null) {
      stats.totalDeaths += run.deaths
    }
  })

  const runsWithDeaths = runs.filter((r) => r.deaths !== null).length
  stats.averageDeaths = runsWithDeaths > 0 ? stats.totalDeaths / runsWithDeaths : 0

  return stats
}

export function getRunTypeBadge(type: RunType): {
  label: string
  icon: string
  color: string
} {
  const badges: Record<
    RunType,
    { label: string; icon: string; color: string }
  > = {
    FULL_CLEAR_VIDEO: {
      label: 'Full Clear (Video)',
      icon: '⭐',
      color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    },
    FULL_CLEAR: {
      label: 'Full Clear',
      icon: '⭐',
      color: 'bg-gradient-to-r from-gray-300 to-gray-500',
    },
    CLEAR_VIDEO: {
      label: 'Clear (Video)',
      icon: '🏅',
      color: 'bg-gradient-to-r from-orange-400 to-orange-600',
    },
    CLEAR: {
      label: 'Clear',
      icon: '🏅',
      color: 'bg-gradient-to-r from-gray-400 to-gray-600',
    },
    FULL_CLEAR_GB: {
      label: 'Full Clear (Golden)',
      icon: '🍓',
      color: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    },
    CLEAR_GB: {
      label: 'Clear (Golden)',
      icon: '🍓',
      color: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    },
    CREATOR_CLEAR: {
      label: 'Creator Clear',
      icon: '👑',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
    ALL_DEATHLESS_SEGMENTS: {
      label: 'All Deathless',
      icon: '💀',
      color: 'bg-gradient-to-r from-red-500 to-rose-600',
    },
    UNKNOWN: {
      label: 'Unknown',
      icon: '❓',
      color: 'bg-gray-500',
    },
    CREATOR_FULL_CLEAR: {
      label: 'Creator Full Clear',
      icon: '👑',
      color: 'bg-gradient-to-r from-purple-600 to-purple-800',
    },
    CREATOR_GOLDEN: {
      label: 'Creator Golden',
      icon: '🍓',
      color: 'bg-gradient-to-r from-purple-500 to-pink-600',
    },
    CREATOR_FULL_CLEAR_GOLDEN: {
      label: 'Creator Full Clear (Golden)',
      icon: '👑',
      color: 'bg-gradient-to-r from-purple-700 to-pink-700',
    },
    GOLDEN_AND_FULL_CLEAR: {
      label: 'Golden & Full Clear',
      icon: '🍓',
      color: 'bg-gradient-to-r from-yellow-600 to-amber-700',
    },
    CLEAR_VIDEO_AND_FC: {
      label: 'Clear Video & FC',
      icon: '🏅',
      color: 'bg-gradient-to-r from-orange-500 to-red-600',
    },
  }

  return badges[type]
}

