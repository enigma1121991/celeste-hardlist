'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createNewPlayer } from '@/lib/actions/auth-actions'

export default function CreateNewPlayerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [playerHandle, setPlayerHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user already has a claimed player
    if (status === 'authenticated' && session?.user?.claimedPlayerId) {
      router.push('/account/settings')
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
    router.push('/api/auth/signin')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!playerHandle.trim()) {
      setError('Please enter a player handle')
      return
    }

    // Validate handle format (alphanumeric, underscores, hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(playerHandle)) {
      setError('Handle can only contain letters, numbers, underscores, and hyphens')
      return
    }

    if (playerHandle.length < 3) {
      setError('Handle must be at least 3 characters')
      return
    }

    if (playerHandle.length > 32) {
      setError('Handle must be 32 characters or less')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createNewPlayer(playerHandle.trim(), session!.user.id)
      
      if (result.success) {
        // Redirect to their new player profile
        router.push(`/players/${result.handle}`)
      } else {
        setError(result.error || 'Failed to create player')
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
          Create New Player
        </h1>
        <p className="text-[var(--foreground-muted)] mb-6">
          Choose a unique handle for your new player profile. You'll start with fresh stats and can immediately begin submitting runs.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Player Handle Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Player Handle <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={playerHandle}
              onChange={(e) => setPlayerHandle(e.target.value)}
              placeholder="Enter your player handle"
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-white text-lg"
              maxLength={32}
              required
            />
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              3-32 characters. Letters, numbers, underscores, and hyphens only.
            </p>
            {playerHandle && (
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Your profile will be at: <span className="font-mono text-[var(--foreground)]">/players/{playerHandle}</span>
              </p>
            )}
          </div>

          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
            <h3 className="font-semibold text-[var(--foreground)] mb-2">What you'll get:</h3>
            <ul className="text-sm text-[var(--foreground-muted)] space-y-1">
              <li>• Fresh player profile with zero runs</li>
              <li>• Ability to submit and track your runs</li>
              <li>• Customizable bio and social links</li>
              <li>• Instant activation (no approval needed)</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !playerHandle.trim()}
              className="flex-1 px-6 py-3 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Player...' : 'Create Player'}
            </button>
            <Link
              href="/auth/create-profile"
              className="px-6 py-3 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded font-medium hover:border-[var(--border-hover)] transition-colors text-center"
            >
              Back
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}


