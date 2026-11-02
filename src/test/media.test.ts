import { describe, expect, it } from 'vitest';
import { isDirectVideoUrl, isHlsUrl, isHttpUrl, toEmbedUrl } from '@/lib/media';

describe('Cinema media URL validation', () => {
  it('accepts secure direct video URLs with signed query strings', () => {
    expect(isDirectVideoUrl('https://cdn.example.com/short.mp4?token=abc')).toBe(true);
    expect(isDirectVideoUrl('https://cdn.example.com/short.webm')).toBe(true);
    expect(isDirectVideoUrl('https://cdn.example.com/live/master.m3u8?signature=abc')).toBe(true);
  });

  it('rejects insecure, malformed, and non-video URLs as direct media', () => {
    expect(isDirectVideoUrl('http://cdn.example.com/short.mp4')).toBe(false);
    expect(isDirectVideoUrl('javascript:alert(1)')).toBe(false);
    expect(isDirectVideoUrl('https://example.com/watch?id=123')).toBe(false);
  });

  it('identifies HLS playlists safely', () => {
    expect(isHlsUrl('https://cdn.example.com/live/master.m3u8?token=abc')).toBe(true);
    expect(isHlsUrl('http://cdn.example.com/live/master.m3u8')).toBe(false);
  });

  it('accepts valid web links and rejects malformed URLs', () => {
    expect(isHttpUrl('https://example.com')).toBe(true);
    expect(isHttpUrl('http://example.com')).toBe(true);
    expect(isHttpUrl('not a URL')).toBe(false);
  });

  it('builds safe YouTube and Vimeo embeds', () => {
    expect(toEmbedUrl('https://youtu.be/abcdefgh')).toContain('youtube-nocookie.com/embed/abcdefgh');
    expect(toEmbedUrl('https://www.youtube.com/shorts/abcdefgh')).toContain('youtube-nocookie.com/embed/abcdefgh');
    expect(toEmbedUrl('https://vimeo.com/123456')).toContain('player.vimeo.com/video/123456');
    expect(toEmbedUrl('https://evilvimeo.com/123456')).toBeNull();
    expect(toEmbedUrl('http://youtu.be/abcdefgh')).toBeNull();
  });
});
