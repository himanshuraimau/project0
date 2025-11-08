/**
 * Utility functions for YouTube video handling
 */

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string | null | undefined): string | null {
  // Handle null, undefined, or empty strings
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  const cleanUrl = url.trim();
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    try {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    } catch (error) {
      console.warn('Error matching YouTube URL pattern:', error);
      continue;
    }
  }

  return null;
}

/**
 * Validate if a string is a valid YouTube URL or video ID
 */
export function isValidYouTubeUrl(url: string | null | undefined): boolean {
  return extractVideoId(url) !== null;
}

/**
 * Generate YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg', 
    high: 'hqdefault.jpg',
    standard: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

/**
 * Generate YouTube watch URL from video ID
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Validate if a video ID is in the correct format (11 characters, alphanumeric + _ -)
 */
export function isValidVideoId(videoId: string | null | undefined): boolean {
  if (!videoId || typeof videoId !== 'string') {
    return false;
  }
  
  const cleanId = videoId.trim();
  return /^[a-zA-Z0-9_-]{11}$/.test(cleanId);
}

/**
 * Safely get a clean video ID with validation
 */
export function getCleanVideoId(videoId: string | null | undefined): string | null {
  const extracted = extractVideoId(videoId);
  return extracted && isValidVideoId(extracted) ? extracted : null;
}