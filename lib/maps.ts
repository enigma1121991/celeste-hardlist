import { prisma } from './prisma'
import { GmColor, GmTier } from '@prisma/client'

export interface MapFilters {
  search?: string
  stars?: number[]
  gmColor?: GmColor[]
  gmTier?: GmTier[]
  creator?: string
  tags?: string[]
  minLowDeath?: number
  maxLowDeath?: number
}

export async function getMaps(filters: MapFilters = {}) {
  const where: any = {}

  if (filters.search) {
    where.name = {
      contains: filters.search,
      mode: 'insensitive',
    }
  }

  if (filters.stars && filters.stars.length > 0) {
    where.stars = {
      in: filters.stars,
    }
  }

  if (filters.gmColor && filters.gmColor.length > 0) {
    where.gmColor = {
      in: filters.gmColor,
    }
  }

  if (filters.gmTier && filters.gmTier.length > 0) {
    where.gmTier = {
      in: filters.gmTier,
    }
  }

  if (filters.creator) {
    where.creator = {
      name: {
        contains: filters.creator,
        mode: 'insensitive',
      },
    }
  }

  if (filters.tags && filters.tags.length > 0) {
    // Tags are stored as JSON array, need to check if any of the filter tags exist
    where.AND = filters.tags.map((tag) => ({
      tags: {
        path: '$',
        array_contains: tag,
      },
    }))
  }

  if (filters.minLowDeath !== undefined || filters.maxLowDeath !== undefined) {
    where.lowDeathRecord = {}
    if (filters.minLowDeath !== undefined) {
      where.lowDeathRecord.gte = filters.minLowDeath
    }
    if (filters.maxLowDeath !== undefined) {
      where.lowDeathRecord.lte = filters.maxLowDeath
    }
  }

  const maps = await prisma.map.findMany({
    where,
    include: {
      creator: true,
      // Don't load all runs for list view - improves performance significantly
      // Individual map pages load full run data
      _count: {
        select: {
          runs: {
            where: {
              verifiedStatus: 'VERIFIED',
            },
          },
        },
      },
    },
    orderBy: [
      { stars: 'desc' },
      { name: 'asc' },
    ],
  })

  return maps
}

export async function getMapBySlug(slug: string) {
  return await prisma.map.findUnique({
    where: { slug },
    include: {
      creator: true,
      runs: {
        where: {
          verifiedStatus: 'VERIFIED',
        },
        include: {
          player: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })
}

export async function getAllCreators() {
  return await prisma.creatorProfile.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getAllTags() {
  const maps = await prisma.map.findMany({
    select: { tags: true },
  })

  const allTags = new Set<string>()
  maps.forEach((map) => {
    const tags = map.tags as string[]
    tags.forEach((tag) => allTags.add(tag))
  })

  return Array.from(allTags).sort()
}

export async function getMapStats(mapId: string) {
  const runs = await prisma.run.findMany({
    where: { 
      mapId,
      verifiedStatus: 'VERIFIED',
    },
  })

  const stats = {
    totalClears: runs.length,
    fullClearCount: runs.filter((r) =>
      ['FULL_CLEAR_VIDEO', 'FULL_CLEAR', 'FULL_CLEAR_GB'].includes(r.type)
    ).length,
    clearCount: runs.filter((r) =>
      ['CLEAR_VIDEO', 'CLEAR', 'CLEAR_GB'].includes(r.type)
    ).length,
    goldenBerryCount: runs.filter((r) =>
      ['FULL_CLEAR_GB', 'CLEAR_GB'].includes(r.type)
    ).length,
    creatorClearCount: runs.filter((r) => r.type === 'CREATOR_CLEAR').length,
    deathlessCount: runs.filter((r) => r.type === 'ALL_DEATHLESS_SEGMENTS')
      .length,
  }

  return stats
}

