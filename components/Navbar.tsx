'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import UserDropdown from './UserDropdown'
import { canVerify } from '@/lib/auth-utils'
// import "./globals.css";

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingClearCount, setPendingClearCount] = useState(0)
  const [playerHandle, setPlayerHandle] = useState<string | null>(null)
  const { data: session, status } = useSession()

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/maps', label: 'Maps' },
    { href: '/players', label: 'Players' },
    { href: '/rules', label: 'Rules' },
    { href: '/proposals', label: 'Proposals' },
  ]

  useEffect(() => {
    // Fetch pending clear count if user can verify
    if (session?.user && canVerify(session.user.role)) {
      fetch('/api/verification-queue/count')
        .then((res) => res.json())
        .then((data) => setPendingClearCount(data.count || 0))
        .catch((err) => console.error('Error fetching pending count:', err))
      
      // Refresh count every 30 seconds
      const interval = setInterval(() => {
        fetch('/api/verification-queue/count')
          .then((res) => res.json())
          .then((data) => setPendingClearCount(data.count || 0))
          .catch((err) => console.error('Error fetching pending count:', err))
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    // Fetch player handle if user has a claimed player
    if (session?.user?.claimedPlayerId) {
      fetch(`/api/player/handle?playerId=${session.user.claimedPlayerId}`)
        .then((res) => res.json())
        .then((data) => setPlayerHandle(data.handle || null))
        .catch((err) => console.error('Error fetching player handle:', err))
    }
  }, [session])

  return (
    <nav className="fixed w-full z-[100] bg-[var(--background-elevated)] border-gradient-nav">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-medium text-[var(--foreground)] tracking-tight">
              Hard Clears
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-[var(--background-hover)] text-[var(--foreground)]'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth UI */}
            {status === 'loading' ? (
              <div className="w-8 h-8 animate-pulse bg-[var(--background-hover)] rounded"></div>
            ) : session?.user ? (
              <UserDropdown user={session.user} playerHandle={playerHandle} pendingClearCount={pendingClearCount} />
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="px-4 py-1.5 rounded text-sm font-medium bg-white text-black border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 border-t border-[var(--border)] pt-3 mt-1 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded text-sm font-medium ${
                  pathname === link.href
                    ? 'bg-[var(--background-hover)] text-[var(--foreground)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Auth UI */}
            <div className="border-t border-[var(--border)] pt-2 mt-2">
              {session?.user ? (
                <>
                  <div className="px-3 py-2 text-sm text-[var(--foreground-muted)]">
                    {session.user.name || session.user.discordUsername}
                  </div>
                  {session.user.claimedPlayerId && (
                    <>
                      <Link
                        href="/account/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 rounded text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]"
                      >
                        Account Settings
                      </Link>
                      <Link
                        href="/submit-run"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 rounded text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]"
                      >
                        Submit Clear
                      </Link>
                      <Link
                        href="/my-submissions"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 rounded text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]"
                      >
                        My Submissions
                      </Link>
                    </>
                  )}
                  {!session.user.claimedPlayerId && (
                    <Link
                      href="/auth/create-profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]"
                    >
                      Create Profile
                    </Link>
                  )}
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signIn('discord')
                  }}
                  className="w-full px-3 py-2 rounded text-sm font-medium bg-white text-black border border-gray-300 hover:bg-gray-100 transition-colors text-center"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

