import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import VerificationQueueClient from '@/components/VerificationQueueClient'
import { UserRole } from '@prisma/client'

export default async function VerificationQueuePage() {
  await requireRole(UserRole.VERIFIER)
  
  const pageSize = 50 // Match the API page size
  
  // Only fetch PENDING runs by default for performance
  // Verifiers primarily need to see what needs review
  const runs = await prisma.run.findMany({
    where: {
      verifiedStatus: 'PENDING', // Only load pending runs
    },
    include: {
      map: {
        include: {
          creator: true,
        },
      },
      player: true,
      submittedBy: true,
      verificationActions: {
        include: {
          verifier: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: pageSize, // Load first page (50 runs)
  })

  // Get unique maps and players for filter dropdowns
  const maps = await prisma.map.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: 'asc' },
  })

  const players = await prisma.player.findMany({
    select: {
      id: true,
      handle: true,
    },
    orderBy: { handle: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Verification Queue
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Review and verify clear submissions
        </p>
      </div>

      <VerificationQueueClient 
        runs={runs} 
        maps={maps}
        players={players}
      />
    </div>
  )
}

