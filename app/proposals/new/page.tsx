import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CreateProposalForm from '@/components/CreateProposalForm'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Create a proposal - Hard Clears',
    description: 'Submit a new proposal to add a map, change a map\'s difficulty or to modify a rule. ',
    openGraph: {
      title: 'Create a proposal - Hard Clears',
      description: 'Submit a new proposal to add a map, change a map\'s difficulty or to modify a rule. ',
      type: 'website',
      url: 'https://www.hardclears.com/proposals/new',
    },
    twitter: {
      card: 'summary',
      title: 'Create a proposal - Hard Clears',
      description: 'Submit a new proposal to add a map, change a map\'s difficulty or to modify a rule. ',
    },
  }
}

export default async function NewProposalPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/error?error=You must be signed in to create proposals')
  }

  // Check if user has a claimed player
  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
  })

  if (!player) {
    redirect('/auth/claim-player?callbackUrl=/proposals/new')
  }

  // Fetch all maps for the dropdown
  const maps = await prisma.map.findMany({
    select: {
      id: true,
      name: true,
      stars: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <CreateProposalForm maps={maps} />
    </div>
  )
}

