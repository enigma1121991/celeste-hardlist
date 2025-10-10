import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/SettingsForm'

export default async function AccountSettingsPage() {
  const session = await requireAuth()

  // Get user's claimed player
  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      handle: true,
      bio: true,
      youtubeUrl: true,
      twitchUrl: true,
      discordHandle: true,
    },
  })

  if (!player) {
    redirect('/auth/claim-player')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Account Settings
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Manage your profile information and social links
        </p>
      </div>

      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
        <div className="mb-6 pb-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Player Profile
          </h2>
          <p className="text-[var(--foreground-muted)] text-sm mb-3">
            Linked to: <span className="font-semibold">{player.handle}</span>
          </p>
        </div>

        <SettingsForm player={player} />
      </div>
    </div>
  )
}


