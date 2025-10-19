'use client'

import React, { useState } from 'react'
import CountrySelect from "@/components/CountrySelect";
import { TwemojiFlag } from "@/components/utils/country";
import { updatePlayerBio, updatePlayerSocials, updatePlayerNationality } from '@/lib/actions/user-actions'

interface SettingsFormProps {
  player: {
    bio: string | null
    countryCode: string | null
    youtubeUrl: string | null
    twitchUrl: string | null
    discordHandle: string | null
  }
  user: {
    pronouns: string | null
    inputMethod: string | null
  }
}

export default function SettingsForm({ player, user }: SettingsFormProps) {
  const [bio, setBio] = useState(player.bio || '')
  const [countryCode, setCountryCode] = useState(player.countryCode || '')
  const [pronouns, setPronouns] = useState(user.pronouns || '')
  const [inputMethod, setInputMethod] = useState(user.inputMethod || '')
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
      const result = await updatePlayerBio(bio, pronouns, inputMethod)
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

  const handleSavePronouns = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
  }

  const handleSaveInputMethod = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
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

  const handleSaveNationality = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await updatePlayerNationality(countryCode)
      if (result.success) {
        setSuccess('Nationality updated successfully!')
      } else {
        setError(result.error || 'Failed to update nationality')
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

      {/* Profile Information Section */}
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Profile Information
        </h3>
        
        <div className="space-y-6">
          {/* Bio Section */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Bio
            </label>
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)] resize-none"
                rows={4}
              />
              <div className="absolute bottom-3 right-3 text-xs text-[var(--foreground-muted)]">
                {bio.length} / 500
              </div>
            </div>
          </div>
          
            {/* Country Flag Section */}
            <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Nationality</h3>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">Select your country's flag</p>
                <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                <div className="w-full md:w-56">
                    <CountrySelect onChange={(code) => setCountryCode(code)} />
                </div>
                <div className="mt-3 md:mt-0 flex items-center gap-3">
                    {countryCode ? (
                    <>
                        <TwemojiFlag code={countryCode} />
                        <span className="text-sm text-[var(--foreground)]">{countryCode.toUpperCase()}</span>
                    </>
                    ) : (
                        <span className="text-sm text-[var(--foreground-muted)]">No country selected</span>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={handleSaveNationality}
                    disabled={loading}
                    className="px-4 py-2 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Saving..." : "Save Nationality"}
                </button>
            </div>
        </div>

          {/* Pronouns and Input Method  */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Pronouns
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  maxLength={32}
                  placeholder="e.g. they/them"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
                />
                <div className="absolute bottom-2 right-2 text-xs text-[var(--foreground-muted)] bg-[var(--background)] px-1 rounded">
                  {pronouns.length} / 32
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Input Method
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputMethod}
                  onChange={(e) => setInputMethod(e.target.value)}
                  maxLength={100}
                  placeholder="e.g., Keyboard"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
                />
                <div className="absolute bottom-2 right-2 text-xs text-[var(--foreground-muted)] bg-[var(--background)] px-1 rounded">
                  {inputMethod.length} / 100
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveBio}
              disabled={loading}
              className="px-6 py-2 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Social Links Section */}
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Social Links
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] mb-6">
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
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
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
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)]"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSocials}
              disabled={loading}
              className="px-6 py-2 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Social Links'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

