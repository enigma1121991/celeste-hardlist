import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Rules & Guidelines - Hard Clears',
    description: 'Everything you need to know about submitting maps and clears to Celeste\'s Hardest Maps Clear List. ',
    openGraph: {
      title: 'Rules & Guidelines - Hard Clears',
      description: 'Everything you need to know about submitting maps and clears to Celeste\'s Hardest Maps Clear List. ',
      type: 'website',
      url: 'https://www.hardclears.com/rules',
    },
    twitter: {
      card: 'summary',
      title: 'Rules & Guidelines - Hard Clears',
      description: 'Everything you need to know about submitting maps and clears to Celeste\'s Hardest Maps Clear List. ',
    },
  }
}

export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--foreground)] mb-3">
          Rules & Guidelines
        </h1>
        <p className="text-lg text-[var(--foreground-muted)]">
          Everything you need to know about submitting maps and clears to Celeste's Hardest Maps Clear List
        </p>
      </div>

      {/* Map Submission Requirements */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 pb-2 border-b border-[var(--border)]">
          Map Submission Requirements
        </h2>
        <div className="space-y-4">
          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="text-[var(--foreground)]">
                  Maps must be <strong>easily accessible</strong> via GameBanana or another permanent source, such as Google Drive.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="text-[var(--foreground)]">
                  The map must contain <strong>at least one GM+1 difficulty room</strong> (or higher).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="text-[var(--foreground)]">
                  Must be <strong>cleared by at least one person with video evidence</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <p className="text-[var(--foreground)]">
                  The <strong>map creator decides</strong> whether their map should be added or not.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <p className="text-[var(--foreground)]">
                  Submit new maps in the <strong>#suggestion-box channel</strong> of the official Discord!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clear Submission Requirements */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 pb-2 border-b border-[var(--border)]">
          Clear Submission Requirements
        </h2>
        
        <div className="space-y-6">
          {/* Basic Rules */}
          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Core Rules</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-blue-400 font-bold">•</span>
                <p className="text-[var(--foreground)]">
                  <strong>Don't cheat.</strong> Plain and simple.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-400 font-bold">•</span>
                <p className="text-[var(--foreground)]">
                  A <strong>clear video is not necessary but strongly recommended</strong>. Video is required for any clear <strong>3 star or higher</strong>.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-400 font-bold">•</span>
                <p className="text-[var(--foreground)]">
                  If you submit with a video, put it in a <strong>permanent place</strong> where it may be viewed indefinitely (YouTube, Twitch, etc.). <strong>Journal is required if there is no video.</strong>
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-400 font-bold">•</span>
                <p className="text-[var(--foreground)]">
                  Use a <strong>permanent image hosting service</strong> (such as Catbox) for your journal screenshot.
                </p>
              </div>
            </div>
          </div>

          {/* Gameplay Rules */}
          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Gameplay Rules</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <p className="text-[var(--foreground)]">
                  Don't <strong>pause abuse</strong> or use <strong>savestates</strong> to clear a screen. Using these to practice or learn is allowed.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <p className="text-[var(--foreground)]">
                  Don't use <strong>mods that give you important information</strong> which you normally don't have access to.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <p className="text-[var(--foreground)]">
                  Don't use features that <strong>significantly affect the visual part</strong> of the clear (e.g., simplified graphics feature from CelesteTAS).
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <p className="text-[var(--foreground)]">
                  Using <strong>Input History to your advantage</strong> in any way is NOT allowed (e.g., having frame count shown for inputs).
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <p className="text-[var(--foreground)]">
                  <strong>Waiting 118 hours</strong> to prevent spinners from loading is not allowed (unless it is intended by the map).
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <p className="text-[var(--foreground)]">
                  Unless it's intended by the mapper, <strong>savestating at any location that is not an exact respawn point</strong> is not allowed. You need to complete said room in full.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <p className="text-[var(--foreground)]">
                  <strong>Savestating anywhere that may skip a portion</strong> of a room you would otherwise not be able to skip is not allowed.
                </p>
              </div>
            </div>
          </div>

          {/* Video Recommendations */}
          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Video Recommendations</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <p className="text-[var(--foreground)]">
                  Use an <strong>input overlay</strong> (heavily recommended for any clear 3 star or higher).
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-green-400 font-bold mt-1">✓</span>
                <div>
                  <p className="text-[var(--foreground)]">
                    If you can't use a normal input display, the <strong>Input History mod is allowed</strong> as long as you turn off the "Show Frame Count" option.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <p className="text-[var(--foreground)]">
                  Use <strong>file timer</strong> (heavily recommended).
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <p className="text-[var(--foreground)]">
                  <strong>Disable screenshake</strong> and turn <strong>photosensitive mode on</strong>.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <p className="text-[var(--foreground)]">
                  Put the <strong>link to the map in the description</strong> of the video (especially if you are submitting a new map to the list).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 pb-2 border-b border-[var(--border)]">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Q. What do the stars between the map names mean?
            </h3>
            <p className="text-[var(--foreground-muted)]">
              The stars separate the maps into rough difficulty categories. 1 star, 2 star, and 3 star represent green, yellow, and red GM+1 respectively. 4-6 star encompasses GM+2, etc.
            </p>
          </div>

          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Q. What is the legacy sheet?
            </h3>
            <p className="text-[var(--foreground-muted)]">
              The legacy sheet is an archive of maps that have since been removed from the clears sheet. The reason for removal is located in the map's cell.
            </p>
          </div>

          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Q. Why are there some clears that go against the rules despite them being enforced?
            </h3>
            <p className="text-[var(--foreground-muted)]">
              All rules are only enacted after they begin being enforced, so any clears that are submitted before a rule is enforced will not be removed.
            </p>
          </div>

          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Q. What defines the leniency for "exceptions can be made"?
            </h3>
            <p className="text-[var(--foreground-muted)]">
              Genuinely speaking here, everyone will be given the benefit of the doubt unless it's blatantly fake. This list is supposed to be an archive of the community's best efforts, for both the clearers and the mappers.
            </p>
          </div>
        </div>
      </section>
      {/* Community & Contact */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 pb-2 border-b border-[var(--border)]">
          Community & Contact
        </h2>
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Join the Discord</h3>
            <p className="text-[var(--foreground-muted)] mb-3">
              There is a dedicated Discord server. Join to see announcements, changes, and meta-discuss about the list with the list team.
            </p>
            <a
              href="https://discord.gg/qWz3QYpun5"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Join Discord Server
            </a>
          </div>

          <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Submit a Clear</h3>
            <p className="text-[var(--foreground-muted)] mb-3">
              If you want to submit a clear, ping the <strong className="text-[var(--foreground)]">@Hard Clears Team</strong> role in the public Celeste Discord, the dedicated Hard List discord, or you can DM any of the list mods if you're uncomfortable with speaking in the servers!
            </p>
            <div className="text-sm text-[var(--foreground-muted)]">
              <p className="mb-2"><strong className="text-[var(--foreground)]">Website Owner:</strong></p>
              <p className="ml-4 mb-2">misha</p>

              <p className="mb-2"><strong className="text-[var(--foreground)]">List Mods:</strong></p>
              <p className="ml-4">mystral_fox, parrotdash, mineprodan, cubes9, 10percentpig, seraphinatas, krzysiekee, burgerhex, and hy.per</p>
              <p className="mt-3 mb-2"><strong className="text-[var(--foreground)]">Helpers:</strong></p>
              <p className="ml-4">deesoff, emeowvie, kaleb_22, olive__r, and viridityyyy</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

