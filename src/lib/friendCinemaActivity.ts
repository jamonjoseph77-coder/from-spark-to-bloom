import { supabase } from '@/lib/supabase';
import type { Profile, Title } from '@/lib/types';

export interface FriendPublisherInterest {
  userId: string;
  publisherName: string;
}

export interface FriendWatchingEntry {
  userId: string;
  updatedAt: string;
  title: Pick<Title, 'id' | 'title' | 'type' | 'poster_url' | 'backdrop_url' | 'publisher' | 'genre'>;
  profile: Profile | null;
}

export async function fetchFriendsPublisherInterests(friendIds: string[]): Promise<FriendPublisherInterest[]> {
  if (!friendIds.length) return [];
  const { data, error } = await supabase
    .from('publisher_follows')
    .select('user_id,publisher_name')
    .in('user_id', friendIds)
    .order('publisher_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: { user_id: string; publisher_name: string }) => ({
    userId: row.user_id,
    publisherName: row.publisher_name,
  }));
}

export async function fetchFriendsCurrentlyWatching(friendIds: string[]): Promise<FriendWatchingEntry[]> {
  if (!friendIds.length) return [];
  const { data, error } = await supabase
    .from('friend_watch_activity')
    .select('user_id,updated_at,title:titles!inner(id,title,type,poster_url,backdrop_url,publisher,genre)')
    .in('user_id', friendIds)
    .gt('expires_at', new Date().toISOString())
    .order('updated_at', { ascending: false })
    .limit(12);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<{ user_id: string; updated_at: string; title: FriendWatchingEntry['title'] }>;
  return rows.map((row) => ({ userId: row.user_id, updatedAt: row.updated_at, title: row.title, profile: null }));
}
