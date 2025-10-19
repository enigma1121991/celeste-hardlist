import { prisma } from './prisma'

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
          image: true,
          name: true,
          pronouns: true,
          inputMethod: true,
          countryCode: true,
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
export function calculateWeightedStarScore(runs: any[]): number {
  // Get all runs with star ratings, sorted by stars descending
  const runsWithStars = runs
    .filter(run => run.map.stars && run.map.stars > 0)
    .sort((a, b) => (b.map.stars || 0) - (a.map.stars || 0))
    .slice(0, 10) // Only take top 10 hardest clears
  
  // Calculate weighted score: 10x hardest + 9x second + ... + 1x tenth
  let score = 0
  for (let i = 0; i < runsWithStars.length; i++) {
    const weight = 10 - i
    score += (runsWithStars[i].map.stars || 0) * weight
  }
  
  return score
}