import { supabase } from '@/lib/supabase';
import type { StudioSeriesEpisode } from '@/lib/studio-content';

export async function isFollowingSeries(userId: string, titleId: string): Promise<boolean> {
  if (!userId || !titleId) return false;
  const { data, error } = await supabase
    .from('series_follows')
    .select('title_id')
    .eq('user_id', userId)
    .eq('title_id', titleId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function followSeries(userId: string, titleId: string): Promise<void> {
  if (!userId) throw new Error('Sign in to follow this series.');
  const { error } = await supabase
    .from('series_follows')
    .upsert({ user_id: userId, title_id: titleId }, { onConflict: 'user_id,title_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function unfollowSeries(userId: string, titleId: string): Promise<void> {
  const { error } = await supabase
    .from('series_follows')
    .delete()
    .eq('user_id', userId)
    .eq('title_id', titleId);
  if (error) throw error;
}

export async function fetchPublicSeriesEpisodes(titleId: string): Promise<StudioSeriesEpisode[]> {
  if (!titleId) return [];
  const { data: submissions, error: submissionError } = await supabase
    .from('studio_title_submissions')
    .select('id')
    .eq('published_title_id', titleId)
    .eq('content_type', 'series')
    .eq('status', 'approved');
  if (submissionError) throw submissionError;
  const submissionIds = (submissions ?? []).map((item) => item.id);
  if (!submissionIds.length) return [];
  const { data, error } = await supabase
    .from('studio_title_submission_episodes')
    .select('id,submission_id,season_number,episode_number,episode_title,synopsis,duration_minutes,poster_url,playback_url,release_at,delivery_status,created_at,updated_at')
    .in('submission_id', submissionIds)
    .order('release_at', { ascending: true, nullsFirst: false })
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as StudioSeriesEpisode[];
}
