'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProposalType } from '@prisma/client'
import { PROPOSAL_TYPE_LABELS } from '@/lib/types'

interface CreateProposalFormProps {
  maps: { id: string; name: string; stars: number | null }[]
}

export default function CreateProposalForm({ maps }: CreateProposalFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [selectedType, setSelectedType] = useState<ProposalType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Common fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Map Difficulty fields
  const [selectedMapId, setSelectedMapId] = useState('')
  const [proposedStars, setProposedStars] = useState('')
  const [fullClearOnly, setFullClearOnly] = useState(false)
  const [difficultyReasoning, setDifficultyReasoning] = useState('')

  // Add Map fields
  const [mapName, setMapName] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [newMapStars, setNewMapStars] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([''])
  const [addMapReasoning, setAddMapReasoning] = useState('')

  // Change Rule fields
  const [currentText, setCurrentText] = useState('')
  const [proposedText, setProposedText] = useState('')
  const [ruleReasoning, setRuleReasoning] = useState('')

  const selectedMap = maps.find((m) => m.id === selectedMapId)

  const handleTypeSelect = (type: ProposalType) => {
    setSelectedType(type)
    setStep('details')

    // Generate appropriate title
    if (type === 'MAP_DIFFICULTY') {
      setTitle('Propose Map Difficulty Change')
    } else if (type === 'ADD_MAP') {
      setTitle('Propose New Map Addition')
    } else if (type === 'CHANGE_RULE') {
      setTitle('Propose Rule Change')
    }
  }

  useEffect(() => {
    if (selectedType === 'MAP_DIFFICULTY' && selectedMap) {
      setTitle(`Change ${selectedMap.name} difficulty`)
    }
  }, [selectedMapId, selectedMap, selectedType])

  // URL management helpers for Add Map proposals
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

  const validateForm = () => {
    if (!title.trim() || !description.trim()) {
      alert('Title and description are required')
      return false
    }

    if (selectedType === 'MAP_DIFFICULTY') {
      if (!selectedMapId || !proposedStars || !difficultyReasoning.trim()) {
        alert('Please fill in all required fields')
        return false
      }
      const stars = parseInt(proposedStars)
      if (isNaN(stars) || stars < 1 || stars > 15) {
        alert('Stars must be between 1 and 15')
        return false
      }
      if (selectedMap && selectedMap.stars === stars) {
        alert('Proposed stars must be different from current stars')
        return false
      }
    } else if (selectedType === 'ADD_MAP') {
      const validUrls = evidenceUrls.filter(url => url.trim() !== '')
      if (!mapName.trim() || !creatorName.trim() || !newMapStars || validUrls.length === 0 || !addMapReasoning.trim()) {
        alert('Please fill in all required fields including at least one evidence URL')
        return false
      }
      const stars = parseInt(newMapStars)
      if (isNaN(stars) || stars < 1 || stars > 15) {
        alert('Stars must be between 1 and 15')
        return false
      }
    } else if (selectedType === 'CHANGE_RULE') {
      if (!currentText.trim() || !proposedText.trim() || !ruleReasoning.trim()) {
        alert('Please fill in all required fields')
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      let proposalData: Record<string, unknown> = {}

      if (selectedType === 'MAP_DIFFICULTY') {
        proposalData = {
          mapId: selectedMapId,
          mapName: selectedMap?.name,
          currentStars: selectedMap?.stars,
          proposedStars: parseInt(proposedStars),
          reasoning: difficultyReasoning,
          fullClearOnly,
        }
      } else if (selectedType === 'ADD_MAP') {
        const validUrls = evidenceUrls.filter(url => url.trim() !== '')
        proposalData = {
          mapName: mapName.trim(),
          creatorName: creatorName.trim(),
          stars: parseInt(newMapStars),
          evidenceUrls: validUrls,
          reasoning: addMapReasoning,
        }
      } else if (selectedType === 'CHANGE_RULE') {
        proposalData = {
          currentText: currentText.trim(),
          proposedText: proposedText.trim(),
          reasoning: ruleReasoning,
        }
      }

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          title: title.trim(),
          description: description.trim(),
          proposalData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to create proposal')
        return
      }

      router.push(`/proposals/${data.proposalId}`)
    } catch (error) {
      console.error('Error creating proposal:', error)
      alert('Failed to create proposal')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'type') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Select Proposal Type
          </h2>
          <p className="text-[var(--foreground-muted)]">
            Choose what type of proposal you'd like to create
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleTypeSelect('MAP_DIFFICULTY')}
            className="p-6 bg-[var(--background-elevated)] border-2 border-[var(--border)] rounded-lg hover:border-blue-500 transition-colors text-left"
          >
            <div className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Map Difficulty
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Propose a change to a map's star rating
            </p>
          </button>

          <button
            onClick={() => handleTypeSelect('ADD_MAP')}
            className="p-6 bg-[var(--background-elevated)] border-2 border-[var(--border)] rounded-lg hover:border-purple-500 transition-colors text-left"
          >
            <div className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Add Map
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Propose adding a new map to the list
            </p>
          </button>

          <button
            onClick={() => handleTypeSelect('CHANGE_RULE')}
            className="p-6 bg-[var(--background-elevated)] border-2 border-[var(--border)] rounded-lg hover:border-orange-500 transition-colors text-left"
          >
            <div className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Change Rule
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Propose a modification to the rules
            </p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            {PROPOSAL_TYPE_LABELS[selectedType!]}
          </h2>
          <p className="text-[var(--foreground-muted)]">
            Fill in the details for your proposal
          </p>
        </div>
        <button
          onClick={() => setStep('type')}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Change Type
        </button>
      </div>

      {/* Common Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief title for your proposal"
            className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of your proposal"
            className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)] resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Type-Specific Fields */}
      {selectedType === 'MAP_DIFFICULTY' && (
        <div className="space-y-4 border-t border-[var(--border)] pt-6">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Select Map *
            </label>
            <select
              value={selectedMapId}
              onChange={(e) => setSelectedMapId(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)]"
            >
              <option value="">Choose a map...</option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name} (Current: {map.stars ? `${map.stars}★` : 'Unrated'})
                </option>
              ))}
            </select>
          </div>

          {selectedMap && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Current Rating
                </label>
                <div className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]">
                  {selectedMap.stars ? `${selectedMap.stars}★` : 'Unrated'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Proposed Rating *
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={proposedStars}
                  onChange={(e) => setProposedStars(e.target.value)}
                  placeholder="1-15"
                  className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fullClearOnly"
                  checked={fullClearOnly}
                  onChange={(e) => setFullClearOnly(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="fullClearOnly" className="text-sm text-[var(--foreground)]">
                  Only count full clear votes (otherwise all clear types count)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Reasoning *
                </label>
                <textarea
                  value={difficultyReasoning}
                  onChange={(e) => setDifficultyReasoning(e.target.value)}
                  placeholder="Explain why you believe this difficulty change is appropriate..."
                  className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)] resize-none"
                  rows={4}
                />
              </div>
            </>
          )}
        </div>
      )}

      {selectedType === 'ADD_MAP' && (
        <div className="space-y-4 border-t border-[var(--border)] pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Map Name *
              </label>
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="Enter map name"
                className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Creator Name *
              </label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="Enter creator name"
                className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Proposed Stars *
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={newMapStars}
              onChange={(e) => setNewMapStars(e.target.value)}
              placeholder="1-15"
              className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Evidence URLs * (videos showing clear)
            </label>
            <div className="space-y-3">
              {evidenceUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)]"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Reasoning *
            </label>
            <textarea
              value={addMapReasoning}
              onChange={(e) => setAddMapReasoning(e.target.value)}
              placeholder="Explain why this map should be added to the list..."
              className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)] resize-none"
              rows={4}
            />
          </div>
        </div>
      )}

      {selectedType === 'CHANGE_RULE' && (
        <div className="space-y-4 border-t border-[var(--border)] pt-6">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Current Rule Text *
            </label>
            <textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Copy the current rule text here..."
              className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)] resize-none"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Proposed Rule Text *
            </label>
            <textarea
              value={proposedText}
              onChange={(e) => setProposedText(e.target.value)}
              placeholder="Enter your proposed new rule text..."
              className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)] resize-none"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Reasoning *
            </label>
            <textarea
              value={ruleReasoning}
              onChange={(e) => setRuleReasoning(e.target.value)}
              placeholder="Explain why this rule change is needed..."
              className="w-full px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded text-[var(--foreground)] resize-none"
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3 pt-6 border-t border-[var(--border)]">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-white text-black border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Proposal...' : 'Create Proposal'}
        </button>
        <button
          onClick={() => router.push('/proposals')}
          disabled={isSubmitting}
          className="px-6 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--background-hover)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

