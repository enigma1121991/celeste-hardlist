'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPlayerClaim } from '@/lib/actions/auth-actions'

export default function ClaimPlayerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [players, setPlayers] = useState<Array<{ id: string; handle: string }>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch all players
    fetch('/api/players')
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error('Error fetching players:', err))
  }, [])

  useEffect(() => {
    // Check if user already has a claimed player
    if (status === 'authenticated' && session?.user?.claimedPlayerId) {
      router.push('/account/settings')
    }
    
    // Check if user has a pending claim
    if (status === 'authenticated' && session?.user && !session.user.claimedPlayerId) {
      fetch('/api/claim/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.hasPendingClaim) {
            router.push(`/auth/claim-pending?token=${data.claimToken}`)
          }
        })
        .catch((err) => console.error('Error checking claim status:', err))
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-8 text-center">
          <div className="text-[var(--foreground-muted)]">Loading...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Sign In Required
          </h1>
          <p className="text-[var(--foreground-muted)] mb-6">
            You need to sign in with Discord to claim a player profile.
          </p>
          <button
            onClick={() => signIn('discord')}
            className="inline-block px-6 py-3 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            Sign In with Discord
          </button>
        </div>
      </div>
    )
  }

  const filteredPlayers = players.filter((player) =>
    player.handle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlayerId) {
      setError('Please select a player')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createPlayerClaim(selectedPlayerId, session!.user.id)
      
      if (result.success) {
        router.push(`/auth/claim-pending?token=${result.claimToken}`)
      } else {
        setError(result.error || 'Failed to create claim')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Claim Player Profile
        </h1>
        <p className="text-[var(--foreground-muted)] mb-6">
          Select your player profile from the Hardlist. After selection, you'll be shown a
          claim token to screenshot and send to an admin for verification. (For now, dm @mewwmeww or @deesoff)
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Search for your player handle
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
            />
          </div>

          {/* Player Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Select your player profile
            </label>
            <div className="max-h-64 overflow-y-auto border border-[var(--border)] rounded">
              {filteredPlayers.length === 0 ? (
                <div className="p-4 text-center text-[var(--foreground-muted)]">
                  {searchTerm ? 'No players found' : 'Loading players...'}
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => setSelectedPlayerId(player.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-[var(--background-hover)] transition-colors ${
                      selectedPlayerId === player.id
                        ? 'bg-white/10 border-l-4 border-white'
                        : 'border-b border-[var(--border)]'
                    }`}
                  >
                    <span className="text-[var(--foreground)] font-medium">{player.handle}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !selectedPlayerId}
              className="flex-1 px-6 py-3 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Claim...' : 'Create Claim'}
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded font-medium hover:border-[var(--border-hover)] transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

