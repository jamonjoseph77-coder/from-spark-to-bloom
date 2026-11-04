import { supabase } from '@/lib/supabase';
import { fetchProfilesByIds } from '@/lib/profiles';

export interface DiscoverContentComment {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name: string;
}
export interface DiscoverContentEngagement {
  reactions: { user_id: string }[];
  comments: DiscoverContentComment[];
}
export interface SharedDiscoverContent {
  id: string;
  content_key: string;
  content_title: string;
  content_url: string;
  image_url: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  sender_name: string;
}

export async function fetchDiscoverContentEngagement(contentKey: string): Promise<DiscoverContentEngagement> {
  const [reactionsResult, commentsResult] = await Promise.all([
    supabase.from('discover_content_reactions').select('user_id').eq('content_key', contentKey),
    supabase.from('discover_content_comments').select('id,author_id,body,created_at').eq('content_key', contentKey)
      .eq('status', 'published').order('created_at', { ascending: false }).limit(40),
  ]);
  if (reactionsResult.error) throw reactionsResult.error;
  if (commentsResult.error) throw commentsResult.error;
  const comments = commentsResult.data ?? [];
  const profiles = await fetchProfilesByIds([...new Set(comments.map((comment) => comment.author_id))]);
  const byId = new Map(profiles.map((profile) => [profile.user_id, profile]));
  return {
    reactions: reactionsResult.data ?? [],
    comments: comments.map((comment) => {
      const profile = byId.get(comment.author_id);
      return { ...comment, author_name: profile?.is_discoverable ? (profile.display_name || profile.username || 'Cinema Member') : 'Cinema Member' };
    }),
  };
}

export async function toggleDiscoverContentLike(contentKey: string, userId: string, active: boolean): Promise<void> {
  if (active) {
    const { error } = await supabase.from('discover_content_reactions').delete().eq('content_key', contentKey).eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('discover_content_reactions')
    .upsert({ content_key: contentKey, user_id: userId }, { onConflict: 'content_key,user_id' });
  if (error) throw error;
}

export async function addDiscoverContentComment(contentKey: string, authorId: string, body: string): Promise<void> {
  const { error } = await supabase.from('discover_content_comments').insert({
    content_key: contentKey, author_id: authorId, body: body.trim(), status: 'published',
  });
  if (error) throw error;
}

export async function shareDiscoverContent(input: {
  contentKey: string; title: string; url: string; imageUrl?: string; senderId: string; recipientId: string; message?: string;
}): Promise<void> {
  const { error } = await supabase.from('discover_content_shares').insert({
    content_key: input.contentKey,
    content_title: input.title,
    content_url: input.url,
    image_url: input.imageUrl ?? '',
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    message: input.message?.trim() ?? '',
  });
  if (error) throw error;
}

export async function fetchSharedDiscoverContent(userId: string): Promise<SharedDiscoverContent[]> {
  if (!userId) return [];
  const { data, error } = await supabase.from('discover_content_shares').select('*')
    .eq('recipient_id', userId).order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  const rows = data ?? [];
  const profiles = await fetchProfilesByIds([...new Set(rows.map((row) => row.sender_id))]);
  const byId = new Map(profiles.map((profile) => [profile.user_id, profile]));
  return rows.map((row) => {
    const sender = byId.get(row.sender_id);
    return { ...row, sender_name: sender?.is_discoverable ? (sender.display_name || sender.username || 'A Cinema Friend') : 'A Cinema Friend' };
  });
}
