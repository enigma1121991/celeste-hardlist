"use client";

import Link from "next/link";
import Image from "next/image";
import { MapWithDetails } from "@/lib/types";
import { GM_TIER_LABELS } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getStarColor, getGmColorClass } from "@/components/utils/colors"
import { formatMapName } from "@/components/utils/formatMapName"

import { getYouTubeThumbnailFromUrl } from "@/lib/youtube";

interface MapListProps {
  maps: MapWithDetails[];
}

export default function MapList({ maps }: MapListProps) {
  const router = useRouter();

  // You know, later down the line we should probably add it in the filter how it like, sorts this
  const getSortName = (name: string) => {
    let trimmed = name;
    if (trimmed.startsWith("[") && trimmed.indexOf("]") > 0) {
      trimmed = trimmed.slice(trimmed.indexOf("]") + 1).trim();
    }

    if (trimmed.match(/^The\s+/i)) trimmed = trimmed.slice(4);
    else if (trimmed.match(/^An\s+/i)) trimmed = trimmed.slice(3);
    else if (trimmed.match(/^A\s+/i)) trimmed = trimmed.slice(2);

    return trimmed.toLowerCase();
  };

  // Group maps by star rating
  const groupedMaps = maps.reduce((acc, map) => {
    const stars = map.stars || 0;
    if (!acc[stars]) acc[stars] = [];
    acc[stars].push(map);
    return acc;
  }, {} as Record<number, MapWithDetails[]>);

  // Sort star groups descending
  const sortedStarGroups = Object.keys(groupedMaps)
    .map(Number)
    .sort((a, b) => b - a);

  // Sort each star group by custom "sort name"
  sortedStarGroups.forEach((stars) => {
    groupedMaps[stars].sort((a, b) => {
      const nameA = getSortName(a.name);
      const nameB = getSortName(b.name);
      return nameA.localeCompare(nameB);
    });
  });

  return (
    <div className="space-y-8">
      {sortedStarGroups.map((stars) => (
        <div key={stars}>
          {/* Star divider */}
          {stars > 0 && (
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg"
                  style={{
                    backgroundColor: `${getStarColor(stars)}20`,
                    color: getStarColor(stars),
                    border: `2px solid ${getStarColor(stars)}40`,
                  }}
                >
                  <span>{stars}★</span>
                </div>
                <div
                  className="flex-1 h-0.5 rounded"
                  style={{ backgroundColor: `${getStarColor(stars)}30` }}
                />
                {groupedMaps[stars][0].gmColor &&
                  groupedMaps[stars][0].gmTier && (
                    <div
                      className={`px-2 py-1 ${getGmColorClass(
                        groupedMaps[stars][0].gmColor
                      )} text-white rounded text-sm font-medium whitespace-nowrap`}
                    >
                      {GM_TIER_LABELS[groupedMaps[stars][0].gmTier]}
                    </div>
                  )}
              </div>
          )}

          {/* Maps in this star group */}
          <div className="space-y-3">
            {groupedMaps[stars].map((map) => {
              const tags = (map.tags as string[]) || [];
              const clearCount = map._count?.runs || 0;
              const thumbnailUrl = map.canonicalVideoUrl
                ? getYouTubeThumbnailFromUrl(map.canonicalVideoUrl, "medium")
                : null;

              return (
                <div
                  key={map.id}
                  className="border-2 rounded transition-colors relative border-[var(--border-color-default)] hover:border-[var(--border-color-hover)] cursor-pointer select-none"
                  style={
                    {
                      // @ts-ignore
                      "--border-color-default": `${getStarColor(stars)}40`,
                      "--border-color-hover": getStarColor(stars),
                    } as React.CSSProperties
                  }
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/maps/${map.slug}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/maps/${map.slug}`);
                    }
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      {thumbnailUrl && (
                        <a
                          href={map.canonicalVideoUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 w-32 sm:w-40 lg:w-48 h-20 sm:h-24 lg:h-28 bg-[var(--background-hover)] rounded overflow-hidden group/thumb relative"                          onClick={(e) => e.stopPropagation()}
                        >
                          <Image
                            src={thumbnailUrl}
                            alt={`${map.name} thumbnail`}
                            fill
                            className="object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <span className="text-black text-base ml-0.5">
                                ▶
                              </span>
                            </div>
                          </div>
                        </a>
                      )}

                      {/* Left side - Main info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/maps/${map.slug}`}>
                          <h3 className="text-lg font-semibold text-[var(--foreground)] hover:text-[var(--foreground-muted)] transition-colors mb-2">
                            {formatMapName(map.name)}
                          </h3>
                        </Link>
                        <p className="text-sm text-[var(--foreground-muted)] mb-2">
                          {map.creator.name}
                        </p>

                        {/* Tags inline */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-[var(--background-hover)] border border-[var(--border)] text-[var(--foreground-muted)] rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats - Absolute Bottom Right */}
                  <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end text-xl">
                    <div className="text-[var(--foreground)]">
                      <span className="font-bold text-2xl">{clearCount}</span>
                      <span className="text-[var(--foreground-muted)] ml-2">
                        clears
                      </span>
                    </div>
                    {map.lowDeathRecord !== null && (
                      <div className="text-[var(--foreground)]">
                        <span className="font-bold text-2xl">
                          {map.lowDeathRecord}
                        </span>
                        <span className="text-[var(--foreground-muted)] ml-2">
                          deaths
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {maps.length === 0 && (
        <div className="text-center py-12 text-[var(--foreground-muted)] bg-[var(--background-elevated)] border border-[var(--border)] rounded">
          No maps found matching your filters.
        </div>
      )}
    </div>
  );
}
