'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { verifyRun, rejectRun, requestRunChanges } from '@/lib/actions/run-actions'
import { RUN_TYPE_LABELS } from '@/lib/types'
import { getYouTubeThumbnailFromUrl } from '@/lib/youtube'

interface VerificationQueueItemProps {
  run: {
    id: string
    type: string
    evidenceUrls: string[]
    submitterNotes: string | null
    verifiedStatus: string
    createdAt: Date
    map: {
      id: string
      name: string
      slug: string
      stars: number | null
      creator: {
        name: string
      }
    }
    player: {
      id: string
      handle: string
    }
    submittedBy: {
      id: string
      name: string | null
      discordUsername: string | null
      image: string | null
    } | null
    verificationActions: Array<{
      id: string
      action: string
      reason: string | null
      note: string | null
      createdAt: Date
      verifier: {
        name: string | null
        discordUsername: string | null
        role: string
      } | null
    }>
  }
}

export default function VerificationQueueItem({ run }: VerificationQueueItemProps) {
  const [loading, setLoading] = useState(false)
  const [showVerifyForm, setShowVerifyForm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showChangesForm, setShowChangesForm] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  // Get thumbnails for all YouTube URLs
  const thumbnails = run.evidenceUrls.map(url => ({
    url,
    thumbnail: getYouTubeThumbnailFromUrl(url, 'medium')
  })).filter(item => item.thumbnail)

  const handleVerify = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await verifyRun(run.id, undefined, note.trim() || undefined)
      if (result.success) {
        setShowVerifyForm(false)
        setNote('')
      } else {
        setError(result.error || 'Failed to verify run')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await rejectRun(run.id, reason)
      if (!result.success) {
        setError(result.error || 'Failed to reject run')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for requesting changes')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await requestRunChanges(run.id, reason)
      if (result.success) {
        setShowChangesForm(false)
        setReason('')
        setError('')
      } else {
        setError(result.error || 'Failed to request changes')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg overflow-hidden">
      {error && (
        <div className="p-4 bg-red-500/20 border-b border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      <div className="p-6">
        {/* Run Info */}
        <div className="flex gap-6 mb-6">
          {thumbnails.length > 0 && (
            <div className="flex-shrink-0 flex gap-2">
              {thumbnails.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-48 h-27 bg-[var(--background-hover)] rounded overflow-hidden group"
                >
                  <Image
                    src={item.thumbnail!}
                    alt={`${run.map.name} evidence ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <span className="text-black text-base ml-0.5">▶</span>
                    </div>
                  </div>
                  {thumbnails.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}/{thumbnails.length}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-3 flex-wrap">
                {run.map?.slug && !run.map.slug.includes('[') && !run.map.slug.includes(']') ? (
                  <Link
                    href={`/maps/${run.map.slug}`}
                    className="text-xl font-bold text-[var(--foreground)] hover:text-[var(--foreground-muted)] transition-colors"
                  >
                    {run.map.name}
                  </Link>
                ) : (
                  <span className="text-xl font-bold text-[var(--foreground)]">
                    {run.map?.name || 'Unknown Map'}
                  </span>
                )}
                {run.map.stars && (
                  <span className="text-[var(--foreground-muted)]">{run.map.stars}★</span>
                )}
                <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                  run.verifiedStatus === 'VERIFIED' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                    : run.verifiedStatus === 'PENDING'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                    : 'bg-red-500/20 text-red-400 border-red-500/50'
                }`}>
                  {run.verifiedStatus}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="text-[var(--foreground-muted)]">
                Creator: {run.map.creator.name}
              </div>
              <div>
                Player:{' '}
                {run.player?.handle && !run.player.handle.includes('[') && !run.player.handle.includes(']') ? (
                  <Link
                    href={`/players/${run.player.handle}`}
                    className="text-[var(--foreground)] font-semibold hover:text-[var(--foreground-muted)]"
                  >
                    {run.player.handle}
                  </Link>
                ) : (
                  <span className="text-[var(--foreground)] font-semibold">
                    {run.player?.handle || 'Unknown'}
                  </span>
                )}
              </div>
              <div className="text-[var(--foreground-muted)]">
                Type: {RUN_TYPE_LABELS[run.type as keyof typeof RUN_TYPE_LABELS]}
              </div>
              {run.submittedBy && (
                <div className="text-[var(--foreground-muted)]">
                  Submitted by: {run.submittedBy.discordUsername || run.submittedBy.name}
                </div>
              )}
              <div className="text-[var(--foreground-muted)]">
                Submitted: {new Date(run.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="mt-3">
              {run.evidenceUrls.length === 1 ? (
                <a
                  href={run.evidenceUrls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm hover:border-[var(--border-hover)] transition-colors"
                >
                  <span>View Evidence</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {run.evidenceUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm hover:border-[var(--border-hover)] transition-colors"
                    >
                      <span>Evidence {index + 1}</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Submitter Notes */}
            {run.submitterNotes && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                <p className="text-xs font-semibold text-blue-400 mb-1">Submitter Notes:</p>
                <p className="text-sm text-[var(--foreground)]">{run.submitterNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Actions History */}
        {run.verificationActions.length > 0 && (
          <div className="mb-6 p-4 bg-[var(--background)] border border-[var(--border)] rounded">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              Action History
            </h4>
            <div className="space-y-2">
              {run.verificationActions.map((action) => (
                <div key={action.id} className="text-sm">
                  <div className="text-[var(--foreground-muted)]">
                    <span className="font-semibold text-[var(--foreground)]">
                      {action.verifier ? (action.verifier.discordUsername || action.verifier.name) : 'Submitter'}
                    </span>{' '}
                    {action.action.toLowerCase().replace('_', ' ')}
                    {action.reason && ': ' + action.reason}
                    {action.note && ` (Note: ${action.note})`}
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    {new Date(action.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {run.verifiedStatus === 'PENDING' && (
          <>
            {!showVerifyForm && !showRejectForm && !showChangesForm ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowVerifyForm(true)}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify
                </button>
                <button
                  onClick={() => setShowChangesForm(true)}
                  disabled={loading}
                  className="px-6 py-2 bg-yellow-600 text-white rounded font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>
            ) : showVerifyForm ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                <h4 className="font-semibold text-green-400 mb-3">Verify Run</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                      Note (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note for special circumstances (e.g., technical difficulties, edge cases, extenuating circumstances)"
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:border-white"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleVerify}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Confirm Verification'}
                    </button>
                    <button
                      onClick={() => {
                        setShowVerifyForm(false)
                        setNote('')
                        setError('')
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded font-medium hover:border-[var(--border-hover)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <h4 className="font-semibold text-yellow-400 mb-3">{showRejectForm ? 'Reject Run' : 'Request Changes'}</h4>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Enter reason for ${showRejectForm ? 'rejection' : 'requesting changes'}...`}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:border-white mb-3"
                  rows={3}
                  required
                />
                <div className="flex gap-3">
                  <button
                    onClick={showRejectForm ? handleReject : handleRequestChanges}
                    disabled={loading}
                    className={`flex-1 px-4 py-2 ${
                      showRejectForm ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
                    } text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? 'Processing...' : showRejectForm ? 'Confirm Rejection' : 'Send Feedback'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false)
                      setShowChangesForm(false)
                      setReason('')
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
          </>
        )}
      </div>
    </div>
  )
}

