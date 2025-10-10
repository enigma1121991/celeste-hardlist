import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth-utils'
import { getClaimByToken } from '@/lib/queries/claims'
import PlayerClaimCard from '@/components/PlayerClaimCard'

export default async function ClaimPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const session = await requireAuth()
  const { token } = await searchParams

  if (!token) {
    redirect('/auth/claim-player')
  }

  const claim = await getClaimByToken(token)

  if (!claim) {
    notFound()
  }

  // Verify the claim belongs to the current user
  if (claim.userId !== session.user.id) {
    redirect('/')
  }

  // If claim is approved, redirect to settings
  if (claim.status === 'APPROVED') {
    redirect('/account/settings')
  }

  // If claim is rejected, show rejection message
  if (claim.status === 'REJECTED') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-8">
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            Claim Rejected
          </h1>
          <p className="text-[var(--foreground-muted)] mb-4">
            Your player claim was rejected by an administrator.
          </p>
          
          {claim.reason && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded">
              <h2 className="text-sm font-semibold text-red-400 mb-2">Reason:</h2>
              <p className="text-[var(--foreground-muted)]">{claim.reason}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/auth/claim-player"
              className="px-6 py-3 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Try Another Player
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded font-medium hover:border-[var(--border-hover)] transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Player Claim Pending
          </h1>
          <Link
            href={`/auth/claim-pending?token=${token}`}
            className="px-4 py-2 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm font-medium hover:border-[var(--border-hover)] transition-colors"
          >
            Refresh Status
          </Link>
        </div>
        <p className="text-[var(--foreground-muted)] mb-8">
          Your claim has been created! Follow the instructions below to complete the verification process.
        </p>

        <PlayerClaimCard claim={claim} />

        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
            Next Steps
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-[var(--foreground-muted)]">
            <li>Take a screenshot of the claim information above</li>
            <li>Send the screenshot to a Hardlist admin or moderator via Discord DM</li>
            <li>Wait for an admin to review and approve your claim</li>
            <li>Once approved, you'll be able to access your player profile settings</li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
          <p className="text-sm text-yellow-400">
            <strong>Important:</strong> Keep this page open or bookmark it. You can return to this page
            to check your claim status or to take another screenshot if needed.
          </p>
        </div>
      </div>
    </div>
  )
}

