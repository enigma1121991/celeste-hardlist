'use client'

import { useState } from 'react'
import { updatePlayerBio, updatePlayerSocials } from '@/lib/actions/user-actions'

interface SettingsFormProps {
  player: {
    bio: string | null
    youtubeUrl: string | null
    twitchUrl: string | null
    discordHandle: string | null
  }
}

export default function SettingsForm({ player }: SettingsFormProps) {
  const [bio, setBio] = useState(player.bio || '')
  const [youtubeUrl, setYoutubeUrl] = useState(player.youtubeUrl || '')
  const [twitchUrl, setTwitchUrl] = useState(player.twitchUrl || '')
//   const [discordHandle, setDiscordHandle] = useState(player.discordHandle || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSaveBio = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await updatePlayerBio(bio)
      if (result.success) {
        setSuccess('Bio updated successfully!')
      } else {
        setError(result.error || 'Failed to update bio')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSocials = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await updatePlayerSocials({
        youtubeUrl: youtubeUrl || undefined,
        twitchUrl: twitchUrl || undefined,
        // discordHandle: discordHandle || undefined,
      })
      if (result.success) {
        setSuccess('Social links updated successfully!')
      } else {
        setError(result.error || 'Failed to update social links')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded text-green-400">
          {success}
        </div>
      )}

      {/* Bio Section */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
          Profile Bio
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] mb-3">
          Write a short bio about yourself (max 500 characters)
        </p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          placeholder="Tell us about yourself..."
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)] resize-none"
          rows={4}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-[var(--foreground-muted)]">
            {bio.length} / 500 characters
          </span>
          <button
            onClick={handleSaveBio}
            disabled={loading}
            className="px-4 py-2 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Bio'}
          </button>
        </div>
      </div>

      {/* Social Links Section */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
          Social Links
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] mb-4">
          Add links to your social media profiles
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              YouTube URL
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/@yourname"
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Twitch URL
            </label>
            <input
              type="url"
              value={twitchUrl}
              onChange={(e) => setTwitchUrl(e.target.value)}
              placeholder="https://twitch.tv/yourname"
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Discord Handle
            </label>
            <input
              type="text"
              value={discordHandle}
              onChange={(e) => setDiscordHandle(e.target.value)}
              placeholder="username#1234"
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
            />
          </div> */}

          <div className="flex justify-end">
            <button
              onClick={handleSaveSocials}
              disabled={loading}
              className="px-4 py-2 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Social Links'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

