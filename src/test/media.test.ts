import { describe, expect, it } from 'vitest';
import { getYouTubeThumbnailUrl, getYouTubeVideoId, isDirectVideoUrl, isHlsUrl, isHttpUrl, toEmbedUrl } from '@/lib/media';
import { isPlayableShort, type DiscoverClip } from '@/lib/clips';

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

  it('extracts YouTube video IDs and thumbnails from supported URL forms', () => {
    expect(getYouTubeVideoId('https://www.youtube.com/shorts/abcdefgh')).toBe('abcdefgh');
    expect(getYouTubeVideoId('https://youtu.be/abcdefgh')).toBe('abcdefgh');
    expect(getYouTubeThumbnailUrl('https://www.youtube.com/watch?v=abcdefgh')).toContain('/vi/abcdefgh/hqdefault.jpg');
    expect(getYouTubeVideoId('https://youtube.evil.com/shorts/abcdefgh')).toBeNull();
  });

  it('builds safe YouTube and Vimeo embeds', () => {
    expect(toEmbedUrl('https://youtu.be/abcdefgh')).toContain('youtube.com/embed/abcdefgh');
    expect(toEmbedUrl('https://www.youtube.com/shorts/abcdefgh')).toContain('youtube.com/embed/abcdefgh');
    expect(toEmbedUrl('https://vimeo.com/123456')).toContain('player.vimeo.com/video/123456');
    expect(toEmbedUrl('https://evilvimeo.com/123456')).toBeNull();
    expect(toEmbedUrl('http://youtu.be/abcdefgh')).toBeNull();
  });
});

describe('Cinema Shorts eligibility', () => {
  const short = {
    id: 'short-1',
    kind: 'short',
    headline: 'Official Behind-The-Scenes Moment',
    description: '',
    video_url: 'https://cdn.example.com/short.mp4?token=abc',
    poster_url: '',
    publisher_name: '',
    title_id: null,
    duration_seconds: null,
    sort_order: 1,
    is_published: true,
    title: null,
  } as DiscoverClip;

  it('does not hide approved shorts just because optional poster, publisher, or duration metadata is missing', () => {
    expect(isPlayableShort(short)).toBe(true);
  });

  it('rejects unpublished, unsupported, and overlong shorts', () => {
    expect(isPlayableShort({ ...short, is_published: false })).toBe(false);
    expect(isPlayableShort({ ...short, video_url: 'https://example.com/article' })).toBe(false);
    expect(isPlayableShort({ ...short, duration_seconds: 91 })).toBe(false);
  });
});
