// src/lib/video.js
// Parse and validate YouTube/Instagram video URLs for embed.

/**
 * Parse a URL and return embed info.
 * Returns { platform, videoId, embedUrl, watchUrl } or null if invalid.
 */
export function parseVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // YouTube — handle multiple formats
  const ytPatterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of ytPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        platform: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }
  }

  // Instagram Reel / Post
  const igPatterns = [
    /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
    /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of igPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const postId = match[1];
      return {
        platform: 'instagram',
        videoId: postId,
        embedUrl: `https://www.instagram.com/p/${postId}/embed`,
        watchUrl: `https://www.instagram.com/p/${postId}/`,
      };
    }
  }

  return null;
}

export function isValidVideoUrl(url) {
  if (!url || url.trim() === '') return true; // empty is valid (optional field)
  return parseVideoUrl(url) !== null;
}
