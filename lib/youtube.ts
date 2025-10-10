/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null

  try {
    const urlObj = new URL(url)

    // Standard youtube.com watch URL
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v')
    }

    // Shortened youtu.be URL
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1)
    }

    // YouTube embed URL
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/')[2]
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get YouTube thumbnail URL for a video ID
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality: 'default', 'medium', 'high', 'standard', 'maxres'
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault',
  }

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

/**
 * Get YouTube thumbnail URL from a YouTube URL
 */
export function getYouTubeThumbnailFromUrl(url: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string | null {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) return null
  return getYouTubeThumbnailUrl(videoId, quality)
}

/**
 * Get YouTube embed URL from a YouTube URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) return null
  return `https://www.youtube.com/embed/${videoId}`
}

