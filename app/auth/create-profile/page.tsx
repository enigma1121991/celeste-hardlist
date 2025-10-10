'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function CreateProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Sign In Required
          </h1>
          <p className="text-[var(--foreground-muted)] mb-6">
            You need to sign in with Discord to create a profile.
          </p>
          <button
            onClick={() => router.push('/api/auth/signin')}
            className="inline-block px-6 py-3 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            Sign In with Discord
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
          Create Your Profile
        </h1>
        <p className="text-lg text-[var(--foreground-muted)]">
          Choose how you'd like to set up your player profile
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Claim Existing Player */}
        <Link
          href="/auth/claim-player"
          className="group bg-[var(--background-elevated)] border-2 border-[var(--border)] rounded-lg p-8 hover:border-white transition-all hover:shadow-lg"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
              Claim Existing Player
            </h2>
            <p className="text-[var(--foreground-muted)] mb-4">
              Link your account to an existing player profile with stats and run history
            </p>
            <ul className="text-sm text-[var(--foreground-muted)] text-left space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Keep existing stats and runs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Maintain leaderboard position</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⚠</span>
                <span>Requires admin approval</span>
              </li>
            </ul>
            <div className="px-4 py-2 bg-white text-black rounded font-medium group-hover:bg-gray-100 transition-colors inline-block">
              Claim Existing →
            </div>
          </div>
        </Link>

        {/* Create New Player */}
        <Link
          href="/auth/create-new-player"
          className="group bg-[var(--background-elevated)] border-2 border-[var(--border)] rounded-lg p-8 hover:border-white transition-all hover:shadow-lg"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
              Create New Player
            </h2>
            <p className="text-[var(--foreground-muted)] mb-4">
              Start fresh with a brand new player profile
            </p>
            <ul className="text-sm text-[var(--foreground-muted)] text-left space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Start with clean stats</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Instant profile creation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>No approval needed</span>
              </li>
            </ul>
            <div className="px-4 py-2 bg-white text-black rounded font-medium group-hover:bg-gray-100 transition-colors inline-block">
              Create New →
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}


