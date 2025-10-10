import { RunType } from '@prisma/client'
import { getRunTypeBadge } from '@/lib/players'

interface PlayerBadgeProps {
  type: RunType
  count: number
}

export default function PlayerBadge({ type, count }: PlayerBadgeProps) {
  const badge = getRunTypeBadge(type)

  if (count === 0) return null

  return (
    <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-4 hover:border-[var(--border-hover)] transition-colors">
      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--foreground-muted)]">{badge.label}</div>
        <div className="text-lg font-bold text-[var(--foreground)]">{count}</div>
      </div>
    </div>
  )
}

