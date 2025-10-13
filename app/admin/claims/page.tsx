import { requireRole } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'
import { getPendingClaims } from '@/lib/queries/claims'
import ClaimApprovalCard from '@/components/ClaimApprovalCard'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Player Claims - Hard Clears',
    description: 'Review and approve pending player claim requests. ',
    openGraph: {
      title: 'Player Claims - Hard Clears',
      description: 'Review and approve pending player claim requests. ',
      type: 'website',
      url: 'https://www.hardclears.com/admin/claims',
    },
    twitter: {
      card: 'summary',
      title: 'Player Claims - Hard Clears',
      description: 'Review and approve pending player claim requests. ',
    },
  }
}

export default async function AdminClaimsPage() {
  await requireRole(UserRole.VERIFIER)
  
  const pendingClaims = await getPendingClaims()

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Player Claims
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Review and approve pending player claim requests
        </p>
      </div>

      {pendingClaims.length === 0 ? (
        <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-12 text-center">
          <p className="text-[var(--foreground-muted)] text-lg">
            No pending claims at this time
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingClaims.map((claim) => (
            <ClaimApprovalCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </div>
  )
}




