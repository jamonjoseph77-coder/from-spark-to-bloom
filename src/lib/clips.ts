import { supabase } from '@/lib/supabase';
import type { TitleType } from '@/lib/types';
import { isDirectVideoUrl, toEmbedUrl } from '@/lib/media';

export type ClipKind = 'trailer' | 'short' | 'clip' | 'featured' | 'behind_the_scenes' | 'interview' | 'making_of' | 'deleted_scene' | 'cast_featurette' | 'production_diary';

export interface ClipTitle {
  id: string;
  title: string;
  type: TitleType;
  playback_url?: string | null;
}

export interface DiscoverClip {
  id: string;
  kind: ClipKind;
  headline: string;
  description: string;
  video_url: string;
  poster_url: string;
  publisher_name: string;
  title_id: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_published: boolean;
  title: ClipTitle | null;
}

export const CLIP_KIND_LABEL: Record<ClipKind, string> = {
  trailer: 'Trailer',
  short: 'Short',
  clip: 'Clip',
  featured: 'Featured',
  behind_the_scenes: 'Behind the scenes',
  interview: 'Interview',
  making_of: 'Making of',
  deleted_scene: 'Deleted scene',
  cast_featurette: 'Cast featurette',
  production_diary: 'Production diary',
};

export async function fetchPublishedClips(): Promise<DiscoverClip[]> {
  const { data, error } = await supabase
    .from('discover_clips')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;

  const clips = (data ?? []) as Omit<DiscoverClip, 'title'>[];
  const titleIds = [...new Set(clips.map((clip) => clip.title_id).filter((id): id is string => Boolean(id)))];
  if (titleIds.length === 0) return clips.map((clip) => ({ ...clip, title: null }));

  // The short-video feed must not fail just because optional title metadata is unavailable.
  const { data: titles, error: titleError } = await supabase
    .from('titles')
    .select('id, title, type, playback_url')
    .in('id', titleIds);
  if (titleError) console.warn('Cinema Shorts title metadata is temporarily unavailable', titleError);

  const titleById = new Map((titles ?? []).map((title) => [title.id, title]));
  return clips.map((clip) => ({
    ...clip,
    title: clip.title_id ? (titleById.get(clip.title_id) as ClipTitle | undefined) ?? null : null,
  }));
}

export function isPlayableShort(clip: DiscoverClip): boolean {
  const supported = isDirectVideoUrl(clip.video_url) || Boolean(toEmbedUrl(clip.video_url));
  const durationIsValid = clip.duration_seconds === null
    || (clip.duration_seconds > 0 && clip.duration_seconds <= 90);
  return clip.is_published && supported && durationIsValid;
}

export interface ClipInput {
  kind: ClipKind;
  headline: string;
  description: string;
  video_url: string;
  poster_url: string;
  publisher_name: string;
  title_id: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_published: boolean;
}

export async function fetchAllClips(): Promise<DiscoverClip[]> {
  const { data, error } = await supabase
    .from('discover_clips')
    .select('*, title:titles(id, title, type, playback_url)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DiscoverClip[];
}

export async function saveClip(id: string | null, input: ClipInput): Promise<void> {
  const payload = { ...input, updated_at: new Date().toISOString() };
  const { error } = id
    ? await supabase.from('discover_clips').update(payload).eq('id', id)
    : await supabase.from('discover_clips').insert(payload);
  if (error) throw error;
}

export async function setClipPublished(id: string, isPublished: boolean): Promise<void> {
  const { error } = await supabase
    .from('discover_clips')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteClip(id: string): Promise<void> {
  const { error } = await supabase.from('discover_clips').delete().eq('id', id);
  if (error) throw error;
}

export function formatClipDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}
