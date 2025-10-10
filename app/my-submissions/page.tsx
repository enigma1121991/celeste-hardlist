import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import MySubmissionsClient from '@/components/MySubmissionsClient'

export default async function MySubmissionsPage() {
  const session = await requireAuth()

  // Get user's claimed player
  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true, handle: true },
  })

  if (!player) {
    notFound()
  }

  // Get all runs submitted for this player (pending and verified)
  const runs = await prisma.run.findMany({
    where: {
      playerId: player.id,
    },
    include: {
      map: {
        include: {
          creator: true,
        },
      },
      submittedBy: {
        select: {
          name: true,
          discordUsername: true,
        },
      },
      verificationActions: {
        include: {
          verifier: {
            select: {
              name: true,
              discordUsername: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          My Submissions
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Track your clear submissions and verification status
        </p>
      </div>

      <MySubmissionsClient clears={runs} playerHandle={player.handle} />
    </div>
  )
}

