'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RUN_TYPE_LABELS } from '@/lib/types'
import { updateRunSubmission } from '@/lib/actions/clear-actions'
import { useRouter } from 'next/navigation'

interface Clear {
  id: string
  type: string
  evidenceUrls: string[]
  submitterNotes: string | null
  verifiedStatus: string
  createdAt: Date
  updatedAt: Date
  map: {
    name: string
    slug: string
    stars: number | null
    creator: {
      name: string
    }
  }
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

interface MySubmissionsClientProps {
  clears: Clear[]
  playerHandle: string
}

export default function MySubmissionsClient({ clears }: MySubmissionsClientProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'disputed'>('all')
  const [editingClearId, setEditingClearId] = useState<string | null>(null)
  const [editEvidenceUrls, setEditEvidenceUrls] = useState<string[]>([''])
  const [editSubmitterNotes, setEditSubmitterNotes] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const filteredClears = clears.filter(clear => {
    if (filter === 'all') return true
    return clear.verifiedStatus.toLowerCase() === filter
  })

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'VERIFIED':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'DISPUTED':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'VERIFY':
        return 'text-green-400'
      case 'REJECT':
        return 'text-red-400'
      case 'REQUEST_CHANGES':
        return 'text-yellow-400'
      default:
        return 'text-[var(--foreground-muted)]'
    }
  }

  const formatAction = (action: string) => {
    switch (action) {
      case 'VERIFY':
        return 'Verified'
      case 'REJECT':
        return 'Rejected'
      case 'REQUEST_CHANGES':
        return 'Requested Changes'
      case 'UPDATE':
        return 'Updated by Submitter'
      default:
        return action
    }
  }

  const hasChangeRequest = (run: Clear) => {
    // Check if there's a change request and no UPDATE action after it
    const changeRequestIndex = run.verificationActions.findIndex(action => action.action === 'REQUEST_CHANGES')
    if (changeRequestIndex === -1) return false
    
    // If there's an UPDATE action after the REQUEST_CHANGES, the flag should be removed
    const hasUpdateAfter = run.verificationActions.slice(0, changeRequestIndex).some(action => action.action === 'UPDATE')
    return !hasUpdateAfter
  }

  const canEdit = (run: Clear) => {
    return run.verifiedStatus !== 'VERIFIED'
  }

  const addUrlField = () => {
    setEditEvidenceUrls([...editEvidenceUrls, ''])
  }

  const removeUrlField = (index: number) => {
    const newUrls = editEvidenceUrls.filter((_, i) => i !== index)
    setEditEvidenceUrls(newUrls.length > 0 ? newUrls : [''])
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...editEvidenceUrls]
    newUrls[index] = value
    setEditEvidenceUrls(newUrls)
  }

  const startEdit = (run: Clear) => {
    setEditingClearId(run.id)
    setEditEvidenceUrls(run.evidenceUrls.length > 0 ? run.evidenceUrls : [''])
    setEditSubmitterNotes(run.submitterNotes || '')
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingClearId(null)
    setEditEvidenceUrls([''])
    setEditSubmitterNotes('')
    setEditError('')
  }

  const handleEditSubmit = async (runId: string) => {
    const validUrls = editEvidenceUrls.filter(url => url.trim() !== '')
    if (validUrls.length === 0) {
      setEditError('At least one evidence URL is required')
      return
    }

    setEditLoading(true)
    setEditError('')

    try {
      const result = await updateRunSubmission(runId, {
        evidenceUrls: validUrls,
        submitterNotes: editSubmitterNotes.trim() || undefined,
      })

      if (result.success) {
        setEditingClearId(null)
        router.refresh()
      } else {
        setEditError(result.error || 'Failed to update submission')
      }
    } catch (error) {
      setEditError('An unexpected error occurred')
      console.error(error)
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-white text-black'
              : 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)]'
          }`}
        >
          All ({clears.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-white text-black'
              : 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)]'
          }`}
        >
          Pending ({clears.filter(c => c.verifiedStatus === 'PENDING').length})
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'verified'
              ? 'bg-white text-black'
              : 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)]'
          }`}
        >
          Verified ({clears.filter(c => c.verifiedStatus === 'VERIFIED').length})
        </button>
        <button
          onClick={() => setFilter('disputed')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'disputed'
              ? 'bg-white text-black'
              : 'bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)]'
          }`}
        >
          Disputed ({clears.filter(c => c.verifiedStatus === 'DISPUTED').length})
        </button>
      </div>

      {/* Submissions List */}
      {filteredClears.length === 0 ? (
        <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded p-12 text-center">
          <p className="text-[var(--foreground-muted)] text-lg">
            {filter === 'all' ? 'No submissions yet' : `No ${filter} submissions`}
          </p>
          {filter === 'all' && (
            <Link
              href="/submit-run"
              className="inline-block mt-4 px-6 py-3 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Submit Your First Run
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClears.map((run) => (
            <div
              key={run.id}
              className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6"
            >
              {/* Run Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                    {hasChangeRequest(run) && run.verifiedStatus === 'PENDING' && (
                      <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded text-xs font-semibold">
                        ⚠ Changes Requested
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {run.map.creator.name} • {RUN_TYPE_LABELS[run.type as keyof typeof RUN_TYPE_LABELS]}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded text-sm font-semibold border ${getStatusColor(run.verifiedStatus)}`}>
                  {run.verifiedStatus}
                </div>
              </div>

              {/* Submitter Notes */}
              {run.submitterNotes && editingClearId !== run.id && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-xs font-semibold text-blue-400 mb-1">Submitter Notes:</p>
                  <p className="text-sm text-[var(--foreground)]">{run.submitterNotes}</p>
                </div>
              )}

              {/* Evidence Link / Edit Form */}
              {editingClearId === run.id ? (
                <div className="mb-4 p-4 bg-[var(--background)] border border-[var(--border)] rounded">
                  <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                    Edit Submission
                  </h4>
                  {editError && (
                    <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
                      {editError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-2">
                      Evidence URLs *
                    </label>
                    <div className="space-y-2">
                      {editEvidenceUrls.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateUrl(index, e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="flex-1 px-3 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)] text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:border-white"
                          />
                          {editEvidenceUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeUrlField(index)}
                              className="px-3 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addUrlField}
                        className="px-3 py-2 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm hover:border-[var(--border-hover)] transition-colors"
                      >
                        + Add Another URL
                      </button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={editSubmitterNotes}
                      onChange={(e) => setEditSubmitterNotes(e.target.value)}
                      placeholder="Any additional context about this submission..."
                      rows={3}
                      maxLength={1000}
                      className="w-full px-3 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)] text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:border-white resize-vertical"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSubmit(run.id)}
                      disabled={editLoading}
                      className="px-4 py-2 bg-white text-black border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={editLoading}
                      className="px-4 py-2 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm font-medium hover:border-[var(--border-hover)] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
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
                    {canEdit(run) && (hasChangeRequest(run) || run.verifiedStatus === 'DISPUTED') && (
                      <button
                        onClick={() => startEdit(run)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Submission
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-[var(--foreground-muted)] mb-4">
                Submitted: {new Date(run.createdAt).toLocaleString()}
                {run.updatedAt.toString() !== run.createdAt.toString() && (
                  <span> • Updated: {new Date(run.updatedAt).toLocaleString()}</span>
                )}
              </div>

              {/* Verification Actions / Feedback */}
              {run.verificationActions.length > 0 && (
                <div className="mt-4 p-4 bg-[var(--background)] border border-[var(--border)] rounded">
                  <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                    Verification History
                  </h4>
                  <div className="space-y-3">
                    {run.verificationActions.map((action) => (
                      <div key={action.id} className="border-l-2 border-[var(--border)] pl-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-sm font-semibold ${getActionColor(action.action)}`}>
                            {formatAction(action.action)}
                          </span>
                          {action.verifier && (
                            <span className="text-xs text-[var(--foreground-muted)]">
                              by {action.verifier.discordUsername || action.verifier.name}
                            </span>
                          )}
                          <span className="text-xs text-[var(--foreground-muted)]">
                            {new Date(action.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {action.reason && (
                          <p className="text-sm text-[var(--foreground-muted)] mt-1">
                            {action.reason}
                          </p>
                        )}
                        {action.note && (
                          <div className="mt-1 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                            <p className="text-xs font-semibold text-blue-400 mb-0.5">Note:</p>
                            <p className="text-sm text-[var(--foreground)]">{action.note}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

