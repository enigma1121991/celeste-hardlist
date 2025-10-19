import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const starsParam = searchParams.get("stars") ?? "";
    const stars = starsParam
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 8);

    if (!query && stars.length === 0) { // orig behaviour
      return NextResponse.json({ players: [] })
    }

    const countryParam = (searchParams.get('country') ?? '').trim();
    const country = countryParam ? countryParam.toUpperCase() : null;

    const where: any = {};

    if (query) {
      where.handle = { contains: query, mode: "insensitive" };
      where.OR = [
        { handle: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    if (country) {
        where.user = { countryCode: country };
    }

    if (stars.length > 0) {
      where.runs = {
        some: {
          verifiedStatus: "VERIFIED",
          map: { stars: { in: stars } },
        },
      };
    }

    const sort = (searchParams.get("sort") ?? "clears").trim();
    const orderBy =
      sort === "alphabetical"
        ? [{ handle: "asc" }]
        : [{ _count: { runs: "desc" } as any }, { handle: "asc" }];


    const players = await prisma.player.findMany({
      where,
        include: {
            _count: {
                select: {
                    runs: true
                }
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
      take: 100, // Limit search results
      orderBy: orderBy as any
    })

    return NextResponse.json({ players })
  } catch (error) {
    console.error('Error searching players:', error)
    return NextResponse.json(
      { error: 'Failed to search players' },
      { status: 500 }
    )
  }
}