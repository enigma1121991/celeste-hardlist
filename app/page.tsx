import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Home - Hard Clears',
    description: 'A comprehensive database of Celeste\'s hardest maps, as well as its top players. ',
    openGraph: {
      title: 'Home - Hard Clears',
      description: 'A comprehensive database of Celeste\'s hardest maps, as well as its top players.  ',
      type: 'website',
      url: 'https://www.hardclears.com/',
      images: [{url: "/metadata-image.png", width: 256, height: 256}],
    },
    twitter: {
      card: 'summary',
      title: 'Home - Hard Clears',
      description: 'A comprehensive database of Celeste\'s hardest maps, as well as its top players.  ',
      images: [{url: "/metadata-image.png", width: 256, height: 256}],
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch database stats
  const [mapCount, playerCount, clearCount] = await Promise.all([
    prisma.map.count(),
    prisma.player.count(),
    prisma.run.count(),
  ])

  return (
    <div className="relative min-h-[calc(100vh-190px)] max-w-7xl mx-auto px-8 py-4 flex flex-col">
      {/* Spike Decorations - scattered underneath content, outside main text area */}
      {/* Left side spikes */}
      <div className="absolute top-4 -left-32 w-12 h-12 opacity-18 pointer-events-none z-0 rotate-45">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[15%] -left-44 w-14 h-14 opacity-15 pointer-events-none z-0 rotate-[120deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[28%] -left-36 w-10 h-10 opacity-20 pointer-events-none z-0 -rotate-45">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[40%] -left-28 w-16 h-16 opacity-17 pointer-events-none z-0 rotate-[155deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-1/2 -left-40 w-12 h-12 opacity-14 pointer-events-none z-0 rotate-[70deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[62%] -left-34 w-10 h-10 opacity-19 pointer-events-none z-0 -rotate-[25deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-[28%] -left-42 w-14 h-14 opacity-16 pointer-events-none z-0 rotate-[95deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-[15%] -left-30 w-12 h-12 opacity-18 pointer-events-none z-0 rotate-[140deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-4 -left-38 w-14 h-14 opacity-20 pointer-events-none z-0 -rotate-[35deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      
      {/* Right side spikes */}
      <div className="absolute top-4 -right-38 w-14 h-14 opacity-17 pointer-events-none z-0 rotate-[25deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[16%] -right-30 w-12 h-12 opacity-15 pointer-events-none z-0 -rotate-12">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[30%] -right-44 w-10 h-10 opacity-19 pointer-events-none z-0 rotate-[110deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[42%] -right-32 w-16 h-16 opacity-14 pointer-events-none z-0 rotate-[135deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-1/2 -right-40 w-12 h-12 opacity-16 pointer-events-none z-0 -rotate-[55deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[60%] -right-28 w-14 h-14 opacity-18 pointer-events-none z-0 -rotate-[20deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-[30%] -right-36 w-10 h-10 opacity-20 pointer-events-none z-0 rotate-[145deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-[16%] -right-42 w-12 h-12 opacity-15 pointer-events-none z-0 rotate-[160deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-4 -right-34 w-14 h-14 opacity-17 pointer-events-none z-0 -rotate-[40deg]">
        <Image src="/spike.png" alt="" fill className="object-contain" />
      </div>

      {/* Top Spacer */}
      <div className="flex-[3] relative z-10"></div>

      {/* Hero Section */}
      <section className="relative z-10 text-center mb-8">
        <h1 className="text-5xl font-bold mb-3 text-[var(--foreground)] tracking-tight">
          Hard Clears
        </h1>
        <p className="text-base text-[var(--foreground-muted)] max-w-2xl mx-auto mb-8">
          A comprehensive database of Celeste's hardest maps,
          as well as its top players. 
        </p>
      </section>

      {/* Features Section */}
      <section className="relative z-10 grid md:grid-cols-3 gap-4 mb-6">
        <a href="/maps" className="p-5 bg-[var(--background-elevated)] border border-[var(--border)] rounded hover:border-[var(--star-1)] hover:shadow-lg hover:shadow-[var(--star-1)]/10 transition-all group">
          <div className="w-8 h-8 rounded bg-[var(--star-1)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--star-1)]/20 transition-colors">
            <span className="text-[var(--star-1)] text-lg font-bold">★</span>
          </div>
          <h3 className="text-sm font-semibold mb-1.5 text-[var(--foreground)]">Map Ranking</h3>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            Search through the hard list maps by difficulty, creator, and tags.
          </p>
        </a>

        <a href="/players" className="p-5 bg-[var(--background-elevated)] border border-[var(--border)] rounded hover:border-[var(--star-5)] hover:shadow-lg hover:shadow-[var(--star-5)]/10 transition-all group">
          <div className="w-8 h-8 rounded bg-[var(--star-5)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--star-5)]/20 transition-colors">
            <span className="text-[var(--star-5)] text-lg font-bold">◆</span>
          </div>
          <h3 className="text-sm font-semibold mb-1.5 text-[var(--foreground)]">Player Profiles</h3>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            Check player profiles and their clears with detailed stats.
          </p>
        </a>

        <a href="/proposals" className="p-5 bg-[var(--background-elevated)] border border-[var(--border)] rounded hover:border-[var(--star-8)] hover:shadow-lg hover:shadow-[var(--star-8)]/10 transition-all group">
          <div className="w-8 h-8 rounded bg-[var(--star-8)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--star-8)]/20 transition-colors">
            <span className="text-[var(--star-8)] text-lg font-bold">▶</span>
          </div>
          <h3 className="text-sm font-semibold mb-1.5 text-[var(--foreground)]">Proposals & Votes</h3>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            Submit changes, add new maps and let the community vote on the proposal.
          </p>
        </a>
      </section>

      {/* Bottom Spacer */}
      <div className="flex-[5] relative z-10"></div>

      {/* Stats Section */}
      <section className="relative z-10 bg-[var(--background-elevated)] border border-[var(--border)] rounded p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--foreground)] mb-1">{mapCount}</div>
            <div className="text-xs text-[var(--foreground-muted)]">Maps</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--foreground)] mb-1">{playerCount}</div>
            <div className="text-xs text-[var(--foreground-muted)]">Players</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--foreground)] mb-1">{clearCount}</div>
            <div className="text-xs text-[var(--foreground-muted)]">Clears</div>
          </div>
        </div>
      </section>
    </div>
  )
}
