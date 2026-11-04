import { supabase } from '@/lib/supabase';
import type { TitleType } from '@/lib/types';
import { getYouTubeThumbnailUrl, isDirectVideoUrl, isHlsUrl, toEmbedUrl } from '@/lib/media';

export type ClipKind = 'trailer' | 'short' | 'clip' | 'featured' | 'behind_the_scenes' | 'interview' | 'making_of' | 'deleted_scene' | 'cast_featurette' | 'production_diary';
export interface ClipTitle { id: string; title: string; type: TitleType; playback_url?: string | null }
export interface DiscoverClip {
  id: string; kind: ClipKind; headline: string; description: string; video_url: string;
  poster_url: string; publisher_name: string; title_id: string | null; duration_seconds: number | null;
  sort_order: number; created_at?: string; is_published: boolean; download_allowed: boolean; views_count?: number; title: ClipTitle | null;
}
export interface ClipComment { id: string; author_id: string; body: string; created_at: string; author_name: string }
export interface ClipEngagement { reactions: { user_id: string }[]; comments: ClipComment[] }

export const CLIP_KIND_LABEL: Record<ClipKind, string> = {
  trailer: 'Trailer', short: 'Short', clip: 'Clip', featured: 'Featured',
  behind_the_scenes: 'Behind the scenes', interview: 'Interview', making_of: 'Making of',
  deleted_scene: 'Deleted scene', cast_featurette: 'Cast featurette', production_diary: 'Production diary',
};

function normalizeClip(clip: Record<string, unknown>) {
  const videoUrl = typeof clip.video_url === 'string' ? clip.video_url.trim() : '';
  return {
    ...clip,
    video_url: videoUrl,
    poster_url: typeof clip.poster_url === 'string' && clip.poster_url.trim() ? clip.poster_url.trim() : getYouTubeThumbnailUrl(videoUrl) || '',
    download_allowed: clip.download_allowed === true,
  };
}

async function attachTitles(clips: Omit<DiscoverClip, 'title'>[]): Promise<DiscoverClip[]> {
  const titleIds = [...new Set(clips.map((clip) => clip.title_id).filter((id): id is string => Boolean(id)))];
  if (!titleIds.length) return clips.map((clip) => ({ ...clip, title: null }));
  const { data: titles, error } = await supabase.from('titles').select('id, title, type, playback_url').in('id', titleIds);
  if (error) console.warn('Cinema video title metadata is temporarily unavailable', error);
  const byId = new Map((titles ?? []).map((title) => [title.id, title]));
  return clips.map((clip) => ({ ...clip, title: clip.title_id ? (byId.get(clip.title_id) as ClipTitle | undefined) ?? null : null }));
}

export async function fetchPublishedClips(): Promise<DiscoverClip[]> {
  const { data, error } = await supabase.from('discover_clips').select('*').eq('is_published', true)
    .order('created_at', { ascending: false }).order('sort_order', { ascending: true });
  if (error) throw error;
  return attachTitles((data ?? []).map((clip) => normalizeClip(clip as Record<string, unknown>)) as Omit<DiscoverClip, 'title'>[]);
}

/**
 * Fetch only the published short-form feed. Keeping this query scoped avoids
 * downloading trailers and other long-form promotional assets into Shorts.
 */
export async function fetchPublishedShorts(): Promise<DiscoverClip[]> {
  const { data, error } = await supabase.from('discover_clips').select('*')
    .eq('is_published', true)
    .in('kind', ['short', 'clip'])
    .order('created_at', { ascending: false })
    .order('sort_order', { ascending: true })
    .limit(60);
  if (error) throw error;
  const normalized = (data ?? []).map((clip) => normalizeClip(clip as Record<string, unknown>)) as Omit<DiscoverClip, 'title'>[];
  const playable = normalized.filter((clip) => {
    const url = typeof clip.video_url === 'string' ? clip.video_url.trim() : '';
    const supported = Boolean(url) && (isDirectVideoUrl(url) || Boolean(toEmbedUrl(url)));
    const duration = clip.duration_seconds;
    return supported && (duration === null || (duration > 0 && duration <= 90));
  });
  return attachTitles(playable);
}

export function isPlayableShort(clip: DiscoverClip): boolean {
  const url = clip.video_url?.trim() ?? '';
  const supported = Boolean(url) && (isDirectVideoUrl(url) || Boolean(toEmbedUrl(url)));
  const validDuration = clip.duration_seconds === null || (clip.duration_seconds > 0 && clip.duration_seconds <= 90);
  return clip.is_published && supported && validDuration;
}

export async function fetchClipEngagement(clipId: string): Promise<ClipEngagement> {
  const [reactionsResult, commentsResult] = await Promise.all([
    supabase.from('discover_clip_reactions').select('user_id').eq('clip_id', clipId),
    supabase.from('discover_clip_comments').select('id,author_id,body,created_at').eq('clip_id', clipId)
      .eq('status', 'published').order('created_at', { ascending: false }).limit(30),
  ]);
  if (reactionsResult.error) throw reactionsResult.error;
  if (commentsResult.error) throw commentsResult.error;
  const comments = commentsResult.data ?? [];
  const authorIds = [...new Set(comments.map((comment) => comment.author_id))];
  const profiles = authorIds.length
    ? await supabase.from('profiles').select('user_id,display_name,username,is_discoverable').in('user_id', authorIds)
    : { data: [], error: null };
  if (profiles.error) throw profiles.error;
  const byId = new Map((profiles.data ?? []).map((profile) => [profile.user_id, profile]));
  return {
    reactions: reactionsResult.data ?? [],
    comments: comments.map((comment) => {
      const profile = byId.get(comment.author_id);
      return { ...comment, author_name: profile?.is_discoverable ? (profile.display_name || profile.username || 'Cinema Member') : 'Cinema Member' };
    }),
  };
}

export async function toggleClipReaction(clipId: string, userId: string, active: boolean): Promise<void> {
  if (active) {
    const { error } = await supabase.from('discover_clip_reactions').delete().eq('clip_id', clipId).eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('discover_clip_reactions').upsert(
    { clip_id: clipId, user_id: userId }, { onConflict: 'clip_id,user_id' },
  );
  if (error) throw error;
}

export async function addClipComment(clipId: string, authorId: string, body: string): Promise<void> {
  const { error } = await supabase.from('discover_clip_comments').insert({
    clip_id: clipId, author_id: authorId, body: body.trim(), status: 'published',
  });
  if (error) throw error;
}

export async function recordDiscoverClipView(clipId: string): Promise<number> {
  const { data, error } = await supabase.rpc('record_discover_clip_view', { p_clip_id: clipId });
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

export async function fetchSavedDiscoverClipIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await supabase.from('discover_clip_saves').select('clip_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.clip_id);
}

export async function setDiscoverClipSaved(clipId: string, userId: string, saved: boolean): Promise<void> {
  if (saved) {
    const { error } = await supabase.from('discover_clip_saves').upsert(
      { clip_id: clipId, user_id: userId }, { onConflict: 'clip_id,user_id' },
    );
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('discover_clip_saves').delete().eq('clip_id', clipId).eq('user_id', userId);
  if (error) throw error;
}

export async function fetchSavedDiscoverClips(userId: string): Promise<DiscoverClip[]> {
  if (!userId) return [];
  const { data, error } = await supabase.from('discover_clip_saves').select('clip_id')
    .eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  const savedIds = (data ?? []).map((row) => row.clip_id);
  if (!savedIds.length) return [];
  const clips = await fetchPublishedClips();
  const byId = new Map(clips.map((clip) => [clip.id, clip]));
  return savedIds.flatMap((id) => {
    const clip = byId.get(id);
    return clip ? [clip] : [];
  });
}

export async function fetchDownloadableClips(): Promise<DiscoverClip[]> {
  return (await fetchPublishedClips()).filter((clip) => clip.download_allowed && isDirectVideoUrl(clip.video_url) && !isHlsUrl(clip.video_url));
}

export async function downloadPermittedClip(clip: DiscoverClip): Promise<void> {
  if (!clip.download_allowed || !isDirectVideoUrl(clip.video_url) || isHlsUrl(clip.video_url)) throw new Error('This video is not approved for download.');
  const response = await fetch(clip.video_url);
  if (!response.ok) throw new Error('The download could not be started.');
  const objectUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  const extension = new URL(clip.video_url).pathname.split('.').pop()?.toLowerCase() || 'mp4';
  anchor.download = `${clip.headline.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'cinema-video'}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

export interface ClipInput {
  kind: ClipKind; headline: string; description: string; video_url: string; poster_url: string;
  publisher_name: string; title_id: string | null; duration_seconds: number | null; sort_order: number;
  is_published: boolean; download_allowed: boolean;
}

export async function fetchAllClips(): Promise<DiscoverClip[]> {
  const { data, error } = await supabase.from('discover_clips').select('*')
    .order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  if (error) throw error;
  return attachTitles((data ?? []).map((clip) => normalizeClip(clip as Record<string, unknown>)) as Omit<DiscoverClip, 'title'>[]);
}

export async function saveClip(id: string | null, input: ClipInput): Promise<void> {
  const payload = { ...input, updated_at: new Date().toISOString() };
  const { error } = id
    ? await supabase.from('discover_clips').update(payload).eq('id', id)
    : await supabase.from('discover_clips').insert(payload);
  if (error) throw error;
}
export async function setClipPublished(id: string, isPublished: boolean): Promise<void> {
  const { error } = await supabase.from('discover_clips').update({ is_published: isPublished, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
export async function deleteClip(id: string): Promise<void> {
  const { error } = await supabase.from('discover_clips').delete().eq('id', id);
  if (error) throw error;
}
export function formatClipDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
