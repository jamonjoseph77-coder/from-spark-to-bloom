import { supabase } from '@/lib/supabase';
import type { Title } from '@/lib/types';

export async function fetchFollowedSeries(userId: string): Promise<Title[]> {
  if (!userId) return [];
  const { data: follows, error: followsError } = await supabase.from('series_follows').select('title_id').eq('user_id', userId);
  if (followsError) throw followsError;
  const ids = (follows ?? []).map((item) => item.title_id);
  if (!ids.length) return [];
  const { data, error } = await supabase.from('titles').select('*').in('id', ids).eq('type', 'series').eq('is_published', true).order('title', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Title[];
}
