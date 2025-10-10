'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitClear } from '@/lib/actions/clear-actions'
import { RunType } from '@prisma/client'
import { RUN_TYPE_LABELS } from '@/lib/types'

interface ClearSubmissionFormProps {
  maps: Array<{
    id: string
    name: string
    slug: string
    stars: number | null
  }>
  playerHandle: string
}

export default function ClearSubmissionForm({ maps, playerHandle }: ClearSubmissionFormProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMapId, setSelectedMapId] = useState('')
  const [clearType, setClearType] = useState<RunType>(RunType.FULL_CLEAR_VIDEO)
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([''])
  const [submitterNotes, setSubmitterNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredMaps = maps.filter((map) =>
    map.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedMap = maps.find((m) => m.id === selectedMapId)

  const clearTypes = [
    RunType.FULL_CLEAR_VIDEO,
    RunType.FULL_CLEAR,
    RunType.CLEAR_VIDEO,
    RunType.CLEAR,
    RunType.FULL_CLEAR_GB,
    RunType.CLEAR_GB,
    RunType.CREATOR_CLEAR,
    RunType.ALL_DEATHLESS_SEGMENTS,
  ]

  const addUrlField = () => {
    setEvidenceUrls([...evidenceUrls, ''])
  }

  const removeUrlField = (index: number) => {
    if (evidenceUrls.length > 1) {
      setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...evidenceUrls]
    newUrls[index] = value
    setEvidenceUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMapId) {
      setError('Please select a map')
      return
    }

    // Filter out empty URLs
    const validUrls = evidenceUrls.filter(url => url.trim() !== '')
    
    if (validUrls.length === 0) {
      setError('Please provide at least one evidence URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await submitClear({
        mapId: selectedMapId,
        type: clearType,
        evidenceUrls: validUrls,
        submitterNotes: submitterNotes.trim() || undefined,
      })

      if (result.success) {
        router.push(`/players/${playerHandle}`)
      } else {
        setError(result.error || 'Failed to submit clear')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400">
          {error}
        </div>
      )}

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> Your clear will be pending verification after submission. Verifiers will review it before it appears on the public leaderboard.
        </p>
      </div>

      {/* Map Selection */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Map <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a map..."
          className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)] mb-3"
        />
        <div className="max-h-64 overflow-y-auto border border-[var(--border)] rounded">
          {filteredMaps.length === 0 ? (
            <div className="p-4 text-center text-[var(--foreground-muted)]">
              {searchTerm ? 'No maps found' : 'Loading maps...'}
            </div>
          ) : (
            filteredMaps.map((map) => (
              <button
                key={map.id}
                type="button"
                onClick={() => setSelectedMapId(map.id)}
                className={`w-full text-left px-4 py-3 hover:bg-[var(--background-hover)] transition-colors flex justify-between items-center ${
                  selectedMapId === map.id
                    ? 'bg-blue-500/20 border-l-4 border-blue-500'
                    : 'border-b border-[var(--border)]'
                }`}
              >
                <span className="text-[var(--foreground)] font-medium">{map.name}</span>
                {map.stars && (
                  <span className="text-[var(--foreground-muted)] text-sm">{map.stars}★</span>
                )}
              </button>
            ))
          )}
        </div>
        {selectedMap && (
          <div className="mt-2 text-sm text-[var(--foreground-muted)]">
            Selected: <span className="font-semibold text-[var(--foreground)]">{selectedMap.name}</span>
          </div>
        )}
      </div>

      {/* Clear Type */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Clear Type <span className="text-red-400">*</span>
        </label>
        <select
          value={clearType}
          onChange={(e) => setClearType(e.target.value as RunType)}
          className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--border-hover)]"
        >
          {clearTypes.map((type) => (
            <option key={type} value={type}>
              {RUN_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {/* Evidence URLs */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Evidence URLs <span className="text-red-400">*</span>
        </label>
        <div className="space-y-3">
          {evidenceUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
              />
              {evidenceUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUrlField(index)}
                  className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                  title="Remove URL"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addUrlField}
            className="w-full px-4 py-2 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded hover:border-[var(--border-hover)] transition-colors text-sm"
          >
            + Add Another URL
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">
          Provide links to video evidence of your clear (YouTube, Twitch, etc.). You can add multiple URLs if you have videos from different sources.
        </p>
      </div>

      {/* Submitter Notes */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Notes <span className="text-[var(--foreground-muted)]">(Optional)</span>
        </label>
        <textarea
          value={submitterNotes}
          onChange={(e) => setSubmitterNotes(e.target.value)}
          placeholder="Any additional context about this submission (e.g., technical issues, specific circumstances, clarifications)..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)] resize-vertical"
        />
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          Explain any oddities, technical issues, or special circumstances ({submitterNotes.length}/1000 characters)
        </p>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !selectedMapId || evidenceUrls.every(url => !url.trim())}
          className="flex-1 px-6 py-3 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Clear'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded font-medium hover:border-[var(--border-hover)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

