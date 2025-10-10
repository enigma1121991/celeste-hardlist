'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { UserRole } from '@prisma/client'

interface UserDropdownProps {
  user: {
    name?: string | null
    image?: string | null
    role: UserRole
    discordUsername?: string | null
    claimedPlayerId?: string | null
  }
  playerHandle?: string | null
  pendingClearCount?: number
}

export default function UserDropdown({ user, playerHandle, pendingClearCount = 0 }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const canVerify = user.role === UserRole.VERIFIER || user.role === UserRole.MOD || user.role === UserRole.ADMIN

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--background-hover)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[var(--background)] flex items-center justify-center text-xs font-semibold">
            {(user.name || user.discordUsername || 'U')[0].toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-[var(--foreground)] hidden md:inline">
          {user.name || user.discordUsername || 'User'}
        </span>
        <svg
          className={`w-4 h-4 text-[var(--foreground-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--background-elevated)] border border-[var(--border)] rounded shadow-lg z-50">
          {playerHandle && (
            <Link
              href={`/players/${playerHandle}`}
              className="block px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--background-hover)] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">
                My Profile
              </p>
            </Link>
          )}

          <div className="py-1">
            {user.claimedPlayerId ? (
              <Link
                href="/account/settings"
                className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-hover)] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Account Settings
              </Link>
            ) : (
              <Link
                href="/auth/create-profile"
                className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-hover)] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Create Profile
              </Link>
            )}

            {user.claimedPlayerId && (
              <>
                <Link
                  href="/submit-run"
                  className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-hover)] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Submit Clear
                </Link>
                <Link
                  href="/my-submissions"
                  className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-hover)] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  My Submissions
                </Link>
              </>
            )}

            {canVerify && (
              <>
                <div className="border-t border-[var(--border)] my-1"></div>
                <Link
                  href="/verification-queue"
                  className="flex items-center justify-between px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-hover)] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <span>Verification Queue</span>
                  {pendingClearCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                      {pendingClearCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/claims"
                  className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-hover)] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Player Claims
                </Link>
              </>
            )}
          </div>

          <div className="border-t border-[var(--border)]">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-hover)] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

