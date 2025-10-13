import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { GmColor, GmTier, RunType } from '@prisma/client';

/**
 * Converts a string to kebab-case slug
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-') // spaces/underscores to hyphens
    .replace(/[^\w-]+/g, '') // remove non-word chars except hyphens
    .replace(/--+/g, '-') // collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens from ends
}

/**
 * Generate a short hash (first 8 chars) from a string
 */
export function shortHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 8);
}

/**
 * Compute SHA256 hash of text content
 */
export function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Fetch text content from URL or local file path
 */
export async function fetchText(urlOrPath: string): Promise<string> {
  // Check if it's a URL
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    const response = await fetch(urlOrPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${urlOrPath}: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  // Otherwise treat as local file path
  return readFile(urlOrPath, 'utf-8');
}

/**
 * Parse GM string like "green gm+1", "Yellow GM+2", etc.
 * Returns { color, tier } or throws on invalid input
 */
export function parseGM(
  gmString: string
): { color: GmColor; tier: GmTier } | { error: string } {
  const normalized = gmString.trim().toLowerCase().replace(/\s+/g, ' ');

  // Extract color
  let color: GmColor | null = null;
  if (normalized.includes('green')) {
    color = GmColor.GREEN;
  } else if (normalized.includes('yellow')) {
    color = GmColor.YELLOW;
  } else if (normalized.includes('red')) {
    color = GmColor.RED;
  } else {
    return { error: `Unable to parse GM color from: "${gmString}"` };
  }

  // Extract tier (+1, +2, +3)
  let tier: GmTier | null = null;
  if (normalized.includes('+1') || normalized.includes('gm1')) {
    tier = GmTier.GM1;
  } else if (normalized.includes('+2') || normalized.includes('gm2')) {
    tier = GmTier.GM2;
  } else if (normalized.includes('+3') || normalized.includes('gm3')) {
    tier = GmTier.GM3;
  } else {
    return { error: `Unable to parse GM tier from: "${gmString}"` };
  }

  return { color, tier };
}

/**
 * Extract ALL URLs from a string (for multiple evidence links)
 */
export function extractAllUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s,]+/gi);
  return matches ? matches : [];
}

/**
 * Map a cell value to a RunType based on keywords and presence of URL
 * Returns null if the cell is effectively empty/unrecognized
 * Returns an array of runs if multiple evidence URLs are present
 * 
 * Actual CSV values:
 * - v = clear with video
 * - nv = clear without video  
 * - fc = full clear
 * - FC = full clear (uppercase)
 * - g = golden berry
 * - Creator = clear by creator
 * - s = deathless segments
 * - Combinations: fc1 fc2, v1 v2, FC1 fc2, etc. (multiple evidence URLs)
 */
export function mapCellToRunType(cellValue: string): {
  type: RunType;
  evidenceUrls: string[];
} | null {
  const normalized = cellValue.trim().toLowerCase();
  if (!normalized || normalized === '') {
    return null;
  }
  // Extract ALL URLs from the cell
  const urls = extractAllUrls(cellValue);
  
  // Debug flag for specific Discord URL
  const debugThis = false;
  // Remove URLs from the cell value before checking for run type patterns
  if (debugThis) console.log('cellValue', cellValue);
  const cellValueWithoutUrls = cellValue.replace(/https?:\/\/[^\s,]+/gi, '').trim();
  const normalizedWithoutUrls = cellValueWithoutUrls.toLowerCase();
 
  if (debugThis) console.log('fixed normalized', normalizedWithoutUrls);
 
  // Handle actual CSV abbreviations first
  // Check for "fc" (full clear) - case insensitive, with optional numbers like fc1, fc2, FC3
  const hasFc = normalizedWithoutUrls.includes('fc') || normalizedWithoutUrls.includes('full clear');
  
  // Check for variations - also handle numbered variants like v1, v2, nv1, nv2, etc.
  const hasV = /\bv\d*/i.test(cellValueWithoutUrls) || normalizedWithoutUrls.includes('video') || normalizedWithoutUrls.includes('literally 1984') || normalizedWithoutUrls.includes('literally 1997');
  const hasNv = /\bnv\d*/i.test(cellValueWithoutUrls) || normalizedWithoutUrls.includes('no video') || normalizedWithoutUrls.includes('without video');
  const hasG = normalizedWithoutUrls.includes('g') || normalizedWithoutUrls.includes('golden berry');
  const hasS = /\bs\d*/i.test(cellValueWithoutUrls) || normalizedWithoutUrls.includes('deathless') || normalizedWithoutUrls.includes('segment');
  const Creator = normalizedWithoutUrls === 'creator' || normalizedWithoutUrls.includes('creator') || normalizedWithoutUrls==='C';
  const hasAnd = normalizedWithoutUrls.includes('&');
  
  let type: RunType | null = null;
  if (debugThis) console.log(hasV, hasNv, hasG, hasS, Creator);
  // Priority mapping (most specific first)

  if (Creator) {
    if (hasG) {
      if(hasFc) {
        type = RunType.CREATOR_FULL_CLEAR_GOLDEN;
        //console.log(cellValue, 'CREATOR_FULL_CLEAR_GOLDEN');
      } else {
        type = RunType.CREATOR_GOLDEN;
        //console.log(cellValue, 'CREATOR_GOLDEN');

      }
    } else if(hasFc) {
      type = RunType.CREATOR_FULL_CLEAR;
      //console.log(cellValue, 'CREATOR_FULL_CLEAR');
    } else {
      type = RunType.CREATOR_CLEAR;
      //console.log(cellValue, 'CREATOR_CLEAR');
    }
  } 
  
  else if (hasFc && hasG && hasAnd) {
    type = RunType.GOLDEN_AND_FULL_CLEAR;
    //console.log(cellValue, 'GOLDEN_AND_FULL_CLEAR');
    
  } else if (hasG) {
    if (hasFc){
      type = RunType.FULL_CLEAR_GB;
      //console.log(cellValue, 'FULL_CLEAR_GB');
    } else if (!normalizedWithoutUrls.includes('not good enough')){
      type=RunType.CLEAR_GB;
      //console.log(cellValue, 'CLEAR_GB');
    }

  // Creator
  } else if (hasS) {
    type = RunType.ALL_DEATHLESS_SEGMENTS;
    //console.log(cellValue, 'ALL_DEATHLESS_SEGMENTS');

  // Video
  } else if (hasV && !hasNv) {
    if (hasFc) {
      type = RunType.CLEAR_VIDEO_AND_FC;
    } else {
      type = RunType.CLEAR_VIDEO;
      //console.log(cellValue, 'CLEAR_VIDEO');
    }
  } else if (hasFc && urls.length > 0 && !hasNv) {
    type = RunType.FULL_CLEAR_VIDEO;
    //console.log(cellValue, 'FULL_CLEAR_VIDEO');
  }
  // No video
   else if (hasNv) {
    if(hasFc) {
      type=RunType.FULL_CLEAR;
      //console.log(cellValue, 'FULL_CLEAR');
    } else{
      //console.log(cellValue, 'CLEAR');
      type = RunType.CLEAR;
    }
  } else {
    console.log(cellValue, 'Invalid run type SKIPPING!!!!!!!!!!!!');
  }
  if (debugThis) console.log('type', type);
  if (debugThis) console.log('*************');

  if (!type) {
    return null;
  }

  // If no URLs found, return empty array (no evidence)
  return {
    type,
    evidenceUrls: urls.length > 0 ? urls : [''], // Use empty string if no URL
  };
}

/**
 * Normalize whitespace in a string (trim and collapse internal whitespace)
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Parse an integer from a string, returning null if invalid
 */
export function parseIntSafe(value: string | undefined | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse "Map Name by Creator Name" format
 * Returns { mapName, creatorName } or null if format doesn't match
 */
export function parseMapCreator(combined: string): { mapName: string; creatorName: string } | null {
  const trimmed = combined.trim();
  
  // Look for " by " (case insensitive)
  const byMatch = trimmed.match(/^(.+?)\s+by\s+(.+)$/i);
  
  if (byMatch) {
    return {
      mapName: byMatch[1].trim(),
      creatorName: byMatch[2].trim(),
    };
  }
  
  // If no " by " found, treat entire string as map name with unknown creator
  return {
    mapName: trimmed,
    creatorName: 'Unknown',
  };
}

/**
 * Derive GM color and tier from star rating
 * 1 star = Green GM+1, 2 star = Yellow GM+1, 3 star = Red GM+1
 * 4 star = Green GM+2, 5 star = Yellow GM+2, 6 star = Red GM+2
 * 7 star = Green GM+3, 8 star = Yellow GM+3
 */
export function getGMFromStars(stars: number): { color: GmColor; tier: GmTier } | null {
  if (stars < 1 || stars > 8) return null;

  // Determine tier based on star grouping
  let tier: GmTier;
  let colorIndex: number;

  if (stars >= 1 && stars <= 3) {
    tier = GmTier.GM1;
    colorIndex = stars - 1; // 0, 1, 2 for stars 1, 2, 3
  } else if (stars >= 4 && stars <= 6) {
    tier = GmTier.GM2;
    colorIndex = stars - 4; // 0, 1, 2 for stars 4, 5, 6
  } else {
    // stars 7-8
    tier = GmTier.GM3;
    colorIndex = stars - 7; // 0, 1 for stars 7, 8
  }

  // Map colorIndex to color
  const colors = [GmColor.GREEN, GmColor.YELLOW, GmColor.RED];
  const color = colors[colorIndex];

  return { color, tier };
}

