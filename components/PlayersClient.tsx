'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from "next/image";
import { PlayerWithRuns } from '@/lib/types'
import { calculateWeightedStarScore } from '@/lib/players'
import { getStarColor } from "@/components/utils/colors"
import RoleBadge from '@/components/RoleBadge'
import CountrySelect from '@/components/CountrySelect'

interface PlayersClientProps {
  initialPlayers: PlayerWithRuns[]
  totalCount: number
}

type SortOption = "clears" | "alphabetical";

export default function PlayersClient({ initialPlayers, totalCount: initialTotal }: PlayersClientProps) {
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("clears");
  const [search, setSearch] = useState('')
  const [players, setPlayers] = useState<PlayerWithRuns[]>(initialPlayers)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialPlayers.length < initialTotal)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [searchMode, setSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState<PlayerWithRuns[]>([])
  const [searching, setSearching] = useState(false)
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [country, setCountry] = useState<string | null>(null);

  // Hide initial loading animation after short delay
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 300)
    return () => clearTimeout(timer)
  }, [])

  // Listen for reset filters event from navbar
  useEffect(() => {
    const handleResetFilters = () => {
      setSearch('')
      setSearchMode(false)
      setSearchResults([])
      setPage(1)
      setPlayers(initialPlayers)
      setHasMore(initialPlayers.length < initialTotal)
    }

    window.addEventListener('resetFilters', handleResetFilters)
      return () => window.removeEventListener('resetFilters', handleResetFilters)
    }, [initialPlayers, initialTotal])

   const toggleStar = (n: number) => {
    setSelectedStars((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const [hardest, setHardest] = useState(false);

  const buildUrl = ({ q, page, perPage, stars, sort, hardest, country }: { q?: string; page?: number; perPage?: number; stars?: number[], sort?: string, hardest?: boolean, country?: string }) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (page) params.set("page", String(page));
    if (perPage) params.set("perPage", String(perPage));
    if (stars && stars.length > 0) params.set("stars", stars.join(","));
    if (sort) params.set("sort", sort);
    if (hardest) params.set("hardest", String(hardest));
    if (country) params.set("country", country);
    return `/api/players/paginated?${params.toString()}`;
  };

  const handleSearch = async () => {
    if (!search.trim() && selectedStars.length === 0 && !country) {
      handleClearSearch();
      return;
    }

    setSearching(true);
    try {
      const url = buildUrl({ q: search.trim() || undefined, page: 1, perPage: 50, stars: selectedStars, sort: sortBy, hardest: hardest, country: country});
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        console.error("search error", data);
        setSearchResults([]);
        setSearchMode(true);
        setSearchPage(1);
        setSearchHasMore(false);
        return;
      }

      setSearchResults(data.players || []);
      setSearchMode(true);
      setSearchPage(1);
      setSearchHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error("Failed to search players:", err);
      setSearchResults([]);
      setSearchMode(true);
      setSearchPage(1);
      setSearchHasMore(false);
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchMode(false);
    setSearchResults([]);
    setSearch("");
    setSelectedStars([]);
    setSearchPage(1);
    setSearchHasMore(false);
    setCountry(null);
    setHardest(false);

    setPage(1);
    setHasMore(initialPlayers.length < initialTotal);
    setPlayers(initialPlayers);
  };

  useEffect(() => {
  if (searchMode) return;

  const fetchSortedPlayers = async () => {
    setLoading(true);
    try {
      const url = buildUrl({ page: 1, perPage: 50, sort: sortBy });
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setPlayers(data.players || []);
        setPage(1);
        setHasMore(Boolean(data.hasMore));
      } else {
        console.error("Failed to fetch sorted players:", data);
      }
    } catch (err) {
      console.error("Error fetching sorted players:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchSortedPlayers();
}, [sortBy, searchMode]);

  // Load more for both normal and search modes (preserves filters when in search)
  const loadMore = async () => {
    if (loading) return;

    if (searchMode) {
      if (!searchHasMore) return;
      const next = searchPage + 1;
      setLoading(true);
      try {
        const url = buildUrl({ q: search.trim() || undefined, page: next, perPage: 50, stars: selectedStars, sort: sortBy });
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
          const fetched: PlayerWithRuns[] = data.players || [];
          setSearchResults((prev) => [...prev, ...fetched]);
          setSearchPage(next);
          setSearchHasMore(Boolean(data.hasMore));
        } else {
          console.error("loadMore (search) error", data);
        }
      } catch (err) {
        console.error("Failed to load more search results:", err);
      } finally {
        setLoading(false);
      }
    } else {
      if (!hasMore) return;
      const next = page + 1;
      setLoading(true);
      try {
        const url = buildUrl({ page: next, perPage: 50, sort: sortBy });
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
          const fetched: PlayerWithRuns[] = data.players || [];
          setPlayers((prev) => [...prev, ...fetched]);
          setPage(next);
          setHasMore(Boolean(data.hasMore));
        } else {
          console.error("loadMore error", data);
        }
      } catch (err) {
        console.error("Failed to load more players:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Infinite scroll for normal listing only (preserve previous behavior)
  useEffect(() => {
    if (searchMode) return; // don't infinite-scroll during search
    const onScroll = () => {
      if (loading || !hasMore) return;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      if (scrollHeight - scrollTop - clientHeight < 500) {
        loadMore();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, hasMore, page, searchMode]);

  // Build display list (use search results when in search mode, else normal players)
  const displayPlayers = searchMode ? searchResults : players;
  const sortedPlayers = displayPlayers;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-8">
      {initialLoad && (
        <div className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-[var(--foreground)] animate-pulse">Loading players...</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-1">Players</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          {searchMode ? `${sortedPlayers.length} search result${sortedPlayers.length !== 1 ? "s" : ""}` : `${players.length} player${players.length !== 1 ? "s" : ""}`}
          {!searchMode && hasMore && " (loading more as you scroll)"}
        </p>
      </div>

      {/* Search + star filter + sort UI */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Search players... (press Enter to search)"
            disabled={searching}
            className="flex-1 px-4 py-2.5 text-sm border border-[var(--border)] rounded bg-[var(--background-elevated)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-hover)] disabled:opacity-50"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
          >
            <option value="clears">Sort: Most clears</option>
            <option value="alphabetical">Sort: Alphabetical</option>
          </select>

          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-2.5 text-sm bg-white text-black border border-gray-300 rounded font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? "Searching..." : "Search"}
          </button>

          {searchMode && (
            <button
              onClick={handleClearSearch}
              className="px-4 py-2.5 text-sm bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground)] rounded font-medium hover:border-[var(--border-hover)] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Stars filter — toggles locally only */}
        <div className="flex gap-1 flex-wrap">
          {[1,2,3,4,5,6,7,8].map((s) => {
            const selected = selectedStars.includes(s);
            const color = getStarColor(s);
            return (
              <button
                key={s}
                onClick={() => toggleStar(s)}
                className={`px-2 py-1.5 rounded text-xs transition-colors ${selected ? "text-white font-bold" : "text-[var(--foreground-muted)]"}`}
                style={ selected ? { backgroundColor: color, border: "0" } : { backgroundColor: "var(--background)", border: "1px solid var(--border)" } }
                title={selected ? `Selected: ${s}★` : `${s}★`}
              >
                {s}★
              </button>
            );
          })}

        <button
            onClick={() => setHardest((prev) => !prev)}
            className={`px-2 py-1.5 rounded text-xs transition-colors ${
                hardest
                ? "bg-[var(--accent)] text-white font-bold"
                : "text-[var(--foreground-muted)] border border-[var(--border)] bg-[var(--background)]"
            }`}
            title={hardest ? "Filtering by hardest map only" : "Show all runs"}
            >
            Hardest
        </button>
        <CountrySelect value={country} onChange={(code) => setCountry(code)} />
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedPlayers.map((player) => {
          const fullClears = player.runs.filter((r) => ["FULL_CLEAR_VIDEO","FULL_CLEAR","FULL_CLEAR_GB"].includes(r.type)).length;
          const goldenBerries = player.runs.filter((r) => ["FULL_CLEAR_GB","CLEAR_GB"].includes(r.type)).length;
          const hardestClear = player.runs.reduce((max, run) => Math.max(max, run.map?.stars || 0), 0);

          return (
            <Link key={player.id} href={`/players/${encodeURIComponent(player.handle)}`}>
              <div
                className="bg-[var(--background-elevated)] border-2 rounded p-5 transition-colors relative border-[var(--border-color-default)] hover:border-[var(--border-color-hover)] h-full flex flex-col"
                style={
                  {
                    // @ts-ignore
                    "--border-color-default": `${getStarColor(hardestClear)}40`,
                    // @ts-ignore
                    "--border-color-hover": getStarColor(hardestClear),
                  } as React.CSSProperties
                }
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="mb-2 flex gap-2 items-center">
                    {player.user && player.user.image && (
                      <Image src={player.user.image || ""} alt={player.user.name ?? ""} width={32} height={32} className="rounded-full" />
                    )}
                    <h3 className="text-base font-semibold text-[var(--foreground)]">{player.handle}</h3>
                    {player.user && <RoleBadge role={player.user.role} size="sm" />}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="mb-2">
                      <span className="text-lg font-bold text-[var(--foreground)]">{player.runs.length}</span>
                      <span className="text-sm text-[var(--foreground-muted)] ml-1">clears</span>
                    </div>

                    {hardestClear > 0 && (
                      <div
                        className="pr-1 py-1 rounded font-bold text-sm inline-block"
                        style={{
                          backgroundColor: `${getStarColor(hardestClear)}20`,
                          color: getStarColor(hardestClear),
                          border: `2px solid ${getStarColor(hardestClear)}40`,
                        }}
                      >
                        <span className="text-sm text-[var(--foreground-muted)] ml-2">Hardest Clear: </span>
                        {hardestClear}★
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-[var(--border)] text-xs text-[var(--foreground-muted)]">
                  {fullClears} full clear{fullClears !== 1 ? "s" : ""}, {goldenBerries} golden{goldenBerries !== 1 ? "s" : ""}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty / Loading / End indicators */}
      {sortedPlayers.length === 0 && !loading && !searching && (
        <div className="text-center py-20">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No players found</h3>
          <p className="text-sm text-[var(--foreground-muted)]">{searchMode ? "Try a different search term" : "No players available"}</p>
        </div>
      )}

      {searching && (
        <div className="py-12 flex flex-col items-center gap-3">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[var(--foreground-muted)] animate-pulse">Searching players...</p>
        </div>
      )}

      {loading && !searching && (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[var(--foreground-muted)] animate-pulse">Loading more players...</p>
        </div>
      )}

      {/* End of results for normal listing */}
      {!loading && !hasMore && !searchMode && sortedPlayers.length > 0 && (
        <div className="py-6 text-center border-t border-[var(--border)]">
          <p className="text-sm text-[var(--foreground-muted)]">✓ All {players.length} players loaded</p>
        </div>
      )}

      {/* End for search results */}
      {!loading && !searchHasMore && searchMode && sortedPlayers.length > 0 && (
        <div className="py-6 text-center border-t border-[var(--border)]">
          <p className="text-sm text-[var(--foreground-muted)]">✓ All {searchResults.length} results loaded</p>
        </div>
      )}

      {/* Manual load more button for search mode (since infinite scroll disabled during search) */}
      {searchMode && searchHasMore && !loading && (
        <div className="flex justify-center py-6">
          <button onClick={loadMore} className="px-4 py-2 rounded border border-[var(--border)] bg-[var(--background-elevated)]">
            Load more
          </button>
        </div>
      )}
    </div>
  );
}