import { supabase } from '@/lib/supabase';
import { loadFriendsSnapshot } from '@/lib/friends';

export interface FriendWatchingItem {
  friendId: string;
  friendName: string;
  titleId: string;
  titleName: string;
  posterUrl: string;
  updatedAt: string;
}

export interface FriendPublisherItem {
  friendId: string;
  friendName: string;
  publisherName: string;
}

export interface FriendsActivity {
  watching: FriendWatchingItem[];
  publishers: FriendPublisherItem[];
}

export async function loadFriendsActivity(userId: string): Promise<FriendsActivity> {
  const snapshot = await loadFriendsSnapshot(userId);
  const friends = snapshot.friends;
  if (!friends.length) return { watching: [], publishers: [] };

  const friendIds = friends.map((friend) => friend.otherUserId);
  const friendById = new Map(friends.map((friend) => [
    friend.otherUserId,
    friend.profile?.display_name || friend.profile?.username || 'Cinema Member',
  ]));
  const cutoff = new Date(Date.now() - 20 * 60 * 1000).toISOString();

  const [progressResult, followsResult] = await Promise.all([
    supabase.from('watch_progress')
      .select('user_id,title_id,updated_at,completed,position_seconds')
      .in('user_id', friendIds)
      .eq('completed', false)
      .gt('position_seconds', 5)
      .gte('updated_at', cutoff)
      .order('updated_at', { ascending: false })
      .limit(24),
    supabase.from('publisher_follows')
      .select('user_id,publisher_name')
      .in('user_id', friendIds)
      .order('publisher_name', { ascending: true })
      .limit(60),
  ]);

  if (progressResult.error) throw progressResult.error;
  if (followsResult.error) throw followsResult.error;

  const progress = progressResult.data ?? [];
  const titleIds = [...new Set(progress.map((entry) => entry.title_id))];
  const titlesResult = titleIds.length
    ? await supabase.from('titles').select('id,title,poster_url,is_published').in('id', titleIds).eq('is_published', true)
    : { data: [], error: null };
  if (titlesResult.error) throw titlesResult.error;

  const titleById = new Map((titlesResult.data ?? []).map((title) => [title.id, title]));
  const watching = progress.flatMap((entry) => {
    const title = titleById.get(entry.title_id);
    if (!title) return [];
    return [{
      friendId: entry.user_id,
      friendName: friendById.get(entry.user_id) ?? 'Cinema Member',
      titleId: title.id,
      titleName: title.title,
      posterUrl: title.poster_url ?? '',
      updatedAt: entry.updated_at,
    }];
  });

  const publishers = (followsResult.data ?? []).map((entry) => ({
    friendId: entry.user_id,
    friendName: friendById.get(entry.user_id) ?? 'Cinema Member',
    publisherName: entry.publisher_name,
  }));

  return { watching, publishers };
}
