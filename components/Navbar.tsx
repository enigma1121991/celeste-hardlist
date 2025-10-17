'use client'

import Link from 'next/link'
import {useRouter, usePathname } from 'next/navigation' 
import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import UserDropdown from './UserDropdown'
import { canVerify } from '@/lib/auth-utils'
// import "./globals.css";

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingClearCount, setPendingClearCount] = useState(0)
  const [pendingClaimCount, setPendingClaimCount] = useState(0)
  const [playerHandle, setPlayerHandle] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session, status } = useSession()

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/maps', label: 'Maps' },
    { href: '/players', label: 'Players' },
    { href: '/rules', label: 'Rules' },
    { href: '/proposals', label: 'Proposals' },
  ]

  const handleNavClick = (href: string) => {
    // Start loading animation for all navigation
    setIsLoading(true)
    
    if (pathname === href) {
      // If already on the page, reset filters without full refresh
      console.log('Resetting filters')
      
      // Dispatch custom event to reset filters on the current page
      window.dispatchEvent(new CustomEvent('resetFilters'))
      
      // Use Web Animations API for smooth speed transition
      const el = document.querySelector('.rainbow-border')
      if (el) {
        // Get the ::after animation
        const [anim] = el.getAnimations({ subtree: true }).filter(a => a.animationName === 'rainbow-flow')
        
        if (anim) {
          const start = anim.playbackRate || 1
          const fastSpeed = 20 // Target fast speed
          const normalSpeed = 1 
          const totalDuration = 3000 
          const accelerationDuration = 200 
          const decelerationDuration = totalDuration - accelerationDuration 
          const t0 = performance.now()
          
          function tick(t: number) {
            const elapsed = t - t0
            let currentSpeed
            
            if (elapsed < accelerationDuration) {
              const k = elapsed / accelerationDuration
              const e = 1 - Math.pow(1 - k, 3) 
              currentSpeed = start + (fastSpeed - start) * e
            } else {
              const k = (elapsed - accelerationDuration) / decelerationDuration
              const e = 1 - Math.pow(1 - k, 3) 
              currentSpeed = fastSpeed + (normalSpeed - fastSpeed) * e
            }
            
            anim.playbackRate = currentSpeed
            
            if (elapsed < totalDuration) {
              requestAnimationFrame(tick)
            } else {
              setIsLoading(false)
            }
          }
          requestAnimationFrame(tick)
        } else {
          setTimeout(() => setIsLoading(false), 3000)
        }
      } else {
        setTimeout(() => setIsLoading(false), 3000)
      }
    } else {
      router.push(href)
    }
  }

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
    // Fetch pending clear count if user can verify
    if (session?.user && canVerify(session.user.role)) {
      fetch('/api/claim/count')
        .then((res) => res.json())
        .then((data) => setPendingClaimCount(data.count || 0))
        .catch((err) => console.error('Error fetching pending claim count:', err))
      
      // Refresh count every 30 seconds
      const interval = setInterval(() => {
        fetch('/api/claim/count')
          .then((res) => res.json())
          .then((data) => setPendingClaimCount(data.count || 0))
          .catch((err) => console.error('Error fetching pending claim count:', err))
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

  // Reset loading state when pathname changes (navigation completed)
  useEffect(() => {
    // Add a small delay to allow the page to fully load before resetting
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <nav className={`fixed w-full z-[100] bg-[var(--background-elevated)] rainbow-border ${isLoading ? 'loading' : ''}`}>
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
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
                    pathname === link.href
                      ? 'bg-[var(--background-hover)] text-[var(--foreground)]'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Auth UI */}
            {status === 'loading' ? (
              <div className="w-8 h-8 animate-pulse bg-[var(--background-hover)] rounded"></div>
            ) : session?.user ? (
              <UserDropdown user={session.user} playerHandle={playerHandle} pendingClearCount={pendingClearCount} pendingClaimCount={pendingClaimCount} />
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
              <button
                key={link.href}
                onClick={() => {
                  handleNavClick(link.href)
                  setMobileMenuOpen(false)
                }}
                className={`block w-full text-left px-3 py-2 rounded text-sm font-medium cursor-pointer ${
                  pathname === link.href
                    ? 'bg-[var(--background-hover)] text-[var(--foreground)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]'
                }`}
              >
                {link.label}
              </button>
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

