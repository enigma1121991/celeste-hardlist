'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration. Please contact an administrator.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'An error occurred during authentication.',
  }

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-8 text-center">
        <h1 className="text-3xl font-bold text-red-400 mb-4">
          Authentication Error
        </h1>
        <p className="text-[var(--foreground-muted)] mb-6">
          {errorMessage}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => signIn('discord')}
            className="px-6 py-3 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded font-medium hover:border-[var(--border-hover)] transition-colors inline-block"
          >
            Go Home
          </Link>
        </div>
        {error && (
          <div className="mt-6 p-4 bg-[var(--background)] border border-[var(--border)] rounded">
            <p className="text-xs text-[var(--foreground-muted)] font-mono">
              Error code: {error}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}

