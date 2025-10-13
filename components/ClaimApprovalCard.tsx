'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { approvePlayerClaim, rejectPlayerClaim } from '@/lib/actions/auth-actions'

interface ClaimApprovalCardProps {
  claim: {
    id: string
    claimToken: string
    createdAt: Date
    user: {
      id: string
      name: string | null
      discordUsername: string | null
      image: string | null
    }
    player: {
      id: string
      handle: string
    }
  }
}

export default function ClaimApprovalCard({ claim }: ClaimApprovalCardProps) {
  const [loading, setLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')

  const handleApprove = async () => {
    if (!confirm(`Approve claim for ${claim.player.handle}?`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await approvePlayerClaim(claim.id)
      if (!result.success) {
        setError(result.error || 'Failed to approve claim')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await rejectPlayerClaim(claim.id, rejectReason)
      if (!result.success) {
        setError(result.error || 'Failed to reject claim')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        {claim.user.image && (
          <Image
            src={claim.user.image}
            alt={claim.user.name || 'User'}
            width={48}
            height={48}
            className="rounded-full"
          />
        )}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              {claim.user.discordUsername || claim.user.name}
            </h3>
            <span className="text-sm text-[var(--foreground-muted)]">→</span>
            <Link
              href={`/players/${claim.player.handle}`}
              className="text-lg font-bold text-blue-400 hover:text-blue-300"
            >
              {claim.player.handle}
            </Link>
          </div>
          <div className="text-sm text-[var(--foreground-muted)]">
            Requested {new Date(claim.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 bg-[var(--background)] border border-[var(--border)] rounded mb-4">
        <div>
          <div className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-1">
            Claim Token
          </div>
          <div className="font-mono text-xs text-[var(--foreground)]">
            {claim.claimToken}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-1">
            User ID
          </div>
          <div className="font-mono text-xs text-[var(--foreground-muted)]">
            {claim.user.id}
          </div>
        </div>
      </div>

      {!showRejectForm ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)] mb-3"
            rows={3}
          />
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => {
                setShowRejectForm(false)
                setRejectReason('')
                setError('')
              }}
              disabled={loading}
              className="px-4 py-2 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded font-medium hover:border-[var(--border-hover)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}




