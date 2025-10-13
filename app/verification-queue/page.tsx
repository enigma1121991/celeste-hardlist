import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import VerificationQueueClient from '@/components/VerificationQueueClient'
import { UserRole } from '@prisma/client'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Verification Queue - Hard Clears',
    description: 'Review and verify clear submissions. ',
    openGraph: {
      title: 'Verification Queue - Hard Clears',
      description: 'Review and verify clear submissions. ',
      type: 'website',
      url: 'https://www.hardclears.com/verification-queue',
      images: [{url: "/metadata-image.png", width: 256, height: 256}],
    },
    twitter: {
      card: 'summary',
      title: 'Verification Queue - Hard Clears',
      description: 'Review and verify clear submissions. ',
      images: [{url: "/metadata-image.png", width: 256, height: 256}],
    },
  }
}

export default async function VerificationQueuePage() {
  await requireRole(UserRole.VERIFIER)
  
  const pageSize = 50 // Match the API page size
  
  // Only fetch PENDING runs by default for performance
  // Verifiers primarily need to see what needs review
  const rawRuns = await prisma.run.findMany({
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

  const runs = rawRuns.map(run => ({
    ...run,
    verificationActions: run.verificationActions.map(action => ({
      ...action,
      verifier: action.verifier
        ? {
            name: action.verifier.name,
            discordUsername: action.verifier.discordUsername,
            role: action.verifier.role.toString(),
          }
        : {
            name: null,
            discordUsername: null,
            role: '',
          },
    })),
  }))

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

