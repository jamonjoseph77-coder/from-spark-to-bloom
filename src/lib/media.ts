const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|mov|m4v|m3u8)$/i;

export function isDirectVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && DIRECT_VIDEO_PATTERN.test(url.pathname);
  } catch {
    return false;
  }
}

export function isHlsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /\.m3u8$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function isHttpUrl(value: string): boolean {
  if (value.trim() === '') return true;
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}


export function getYouTubeVideoId(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) return null;
    const id = parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]{6,})/)?.[1];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnailUrl(value: string): string | null {
  const id = getYouTubeVideoId(value);
  return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : null;
}

export function toEmbedUrl(value: string, options: { autoplay?: boolean; muted?: boolean } = {}): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    const autoplay = options.autoplay ? '1' : '0';
    const muted = options.muted ? '1' : '0';
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
      const id = parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]{6,})/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}?playsinline=1&rel=0&autoplay=${autoplay}&mute=${muted}&controls=1&modestbranding=1` : null;
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}?playsinline=1&rel=0&autoplay=${autoplay}&mute=${muted}&controls=1&modestbranding=1` : null;
    }
    if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      const privacyHash = parsed.searchParams.get('h');
      const privacyParam = privacyHash ? `&h=${encodeURIComponent(privacyHash)}` : '';
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}?autoplay=${autoplay}&muted=${muted}${privacyParam}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
