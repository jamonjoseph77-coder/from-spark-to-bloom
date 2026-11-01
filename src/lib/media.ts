const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|mov|m3u8)(\?|#|$)/i;

export function isDirectVideoUrl(url: string): boolean {
  return DIRECT_VIDEO_PATTERN.test(url);
}

export function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|#|$)/i.test(url);
}

export function isHttpUrl(value: string): boolean {
  if (value.trim() === '') return true;
  return /^https?:\/\/\S+$/i.test(value.trim());
}

export function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com' || host === 'www.youtube-nocookie.com') {
      const id = parsed.searchParams.get('v')
        || parsed.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]{6,})/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` : null;
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` : null;
    }
    if (host.endsWith('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
