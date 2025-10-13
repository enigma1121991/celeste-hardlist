import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ClearSubmissionForm from '@/components/ClearSubmissionForm'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Clear - Hard Clears',
    description: 'Submit a new clear for your profile to the hard list. ',
    openGraph: {
      title: 'Submit Clear - Hard Clears',
      description: 'Submit a new clear for your profile to the hard list. ',
      type: 'website',
      url: 'https://www.hardclears.com/submit-run',
      images: [{url: "/metadata-image.png", width: 256, height: 256}],
    },
    twitter: {
      card: 'summary',
      title: 'Submit Clear - Hard Clears',
      description: 'Submit a new clear for your profile to the hard list. ',
      images: [{url: "/metadata-image.png", width: 256, height: 256}],
    },
  }
}

export default async function SubmitClearPage() {
  const session = await requireAuth()

  // Get user's claimed player
  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      handle: true,
    },
  })

  if (!player) {
    redirect('/auth/claim-player')
  }

  // Get all maps for the form
  const maps = await prisma.map.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      stars: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Submit Clear
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Submit a new clear for <span className="font-semibold">{player.handle}</span>
        </p>
      </div>

      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
        <ClearSubmissionForm maps={maps} playerHandle={player.handle} />
      </div>
    </div>
  )
}

