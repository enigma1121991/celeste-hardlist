import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateWeightedStarScore } from '@/lib/players'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = 50
    const skip = (page - 1) * pageSize

    const q = (searchParams.get("q") ?? "").trim();
    const starsParam = searchParams.get("stars") ?? "";
    const stars = starsParam
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 8);
    const countryParam = (searchParams.get('country') ?? '').trim();
    const country = countryParam ? countryParam.toUpperCase() : null;

    const sort = (searchParams.get("sort") ?? "clears").trim();
    const hardest = (searchParams.get("hardest") ?? 'false').trim().toLowerCase() === 'true';

    const where: any = {};

    if (q) {
      where.OR = [
        { handle: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (country) {
        where.user = { countryCode: country };
    }

    if (stars.length > 0 && !hardest) {
      where.runs = {
        some: {
          verifiedStatus: "VERIFIED",
          map: { stars: { in: stars } },
        },
      };
    }

    let orderBy: any;

    if (sort === "alphabetical") {
    orderBy = [{ handle: "asc" }];
    } else {
    orderBy = [{ runs: { _count: "desc" } }, { handle: "asc" }];
    }

    const [allPlayers, totalCount] = await Promise.all([
      prisma.player.findMany({
        where,
        include: {
          _count: {
            select: {runs: true},
          },
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
          },
          user: {
            select: {
              id: true,
              role: true,
              image: true,
              countryCode: true,
            },
          },
        },
        orderBy,
      }),
      prisma.player.count({where}),
    ])

    let filteredPlayers = allPlayers;
    if (hardest && stars.length > 0) {
      filteredPlayers = allPlayers.filter((player) => {
        const verifiedRuns = player.runs.filter((r) => r.map && r.map.stars);
        const maxStars = verifiedRuns.length > 0 ? Math.max(...verifiedRuns.map((r) => r.map.stars)) : 0;
        return stars.includes(maxStars);
      });
    }


    /*const sortedPlayers = allPlayers.sort((a, b) => {
      const scoreA = calculateWeightedStarScore(a.runs)
      const scoreB = calculateWeightedStarScore(b.runs)
      return scoreB - scoreA
    })*/
    const players = filteredPlayers.slice(skip, skip + pageSize)

    const hasMore = skip + filteredPlayers.length < totalCount

    return NextResponse.json({
      players,
      hasMore,
      page,
      totalCount,
    })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}