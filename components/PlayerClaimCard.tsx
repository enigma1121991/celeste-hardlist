interface PlayerClaimCardProps {
  claim: {
    id: string
    claimToken: string
    createdAt: Date
    user: {
      id: string
      name: string | null
      discordUsername: string | null
    }
    player: {
      id: string
      handle: string
    }
  }
}

export default function PlayerClaimCard({ claim }: PlayerClaimCardProps) {
  return (
    <div className="border-2 border-[var(--border-hover)] rounded-lg p-6 bg-[var(--background)]">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
        Player Claim Verification
      </h2>
      
      <div className="space-y-3">
        <div>
          <div className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
            Claim Token
          </div>
          <div className="font-mono text-lg text-[var(--foreground)] bg-[var(--background-elevated)] px-3 py-2 rounded border border-[var(--border)]">
            {claim.claimToken}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
            Discord Account
          </div>
          <div className="text-[var(--foreground)]">
            {claim.user.discordUsername || claim.user.name || 'Unknown'}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
            Player Handle
          </div>
          <div className="text-[var(--foreground)] font-semibold">
            {claim.player.handle}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
            User ID
          </div>
          <div className="font-mono text-xs text-[var(--foreground-muted)]">
            {claim.user.id}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
            Player ID
          </div>
          <div className="font-mono text-xs text-[var(--foreground-muted)]">
            {claim.player.id}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
            Claim Date
          </div>
          <div className="text-[var(--foreground-muted)] text-sm">
            {new Date(claim.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}


