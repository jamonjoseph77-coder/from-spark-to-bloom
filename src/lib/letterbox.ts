import { supabase } from '@/lib/supabase';

export interface LetterboxPost {
  id: string;
  author_id: string;
  body: string;
  title_id: string | null;
  image_url: string | null;
  visibility: 'public' | 'friends';
  status: 'published' | 'hidden' | 'removed';
  created_at: string;
  author?: { username: string; display_name: string } | null;
  title?: { id: string; title: string; poster_url: string; type: string } | null;
  reactions?: { user_id: string; reaction: string }[];
  comments?: { id: string; author_id: string; body: string; created_at: string }[];
}

export async function fetchLetterboxFeed(limit = 40): Promise<LetterboxPost[]> {
  const { data, error } = await supabase
    .from('letterbox_posts')
    .select('*, author:profiles!letterbox_posts_author_id_fkey(username,display_name), title:titles(id,title,poster_url,type), reactions:letterbox_reactions(user_id,reaction), comments:letterbox_comments(id,author_id,body,created_at)')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LetterboxPost[];
}

export async function createLetterboxPost(authorId: string, body: string, titleId: string | null): Promise<void> {
  const { error } = await supabase.from('letterbox_posts').insert({
    author_id: authorId,
    body: body.trim(),
    title_id: titleId,
    visibility: 'public',
    status: 'published',
  });
  if (error) throw error;
}

export async function toggleLetterboxReaction(postId: string, userId: string, active: boolean): Promise<void> {
  if (active) {
    const { error } = await supabase.from('letterbox_reactions').delete().eq('post_id', postId).eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('letterbox_reactions').upsert(
    { post_id: postId, user_id: userId, reaction: 'like' },
    { onConflict: 'post_id,user_id' },
  );
  if (error) throw error;
}

export async function addLetterboxComment(postId: string, authorId: string, body: string): Promise<void> {
  const { error } = await supabase.from('letterbox_comments').insert({
    post_id: postId, author_id: authorId, body: body.trim(), status: 'published',
  });
  if (error) throw error;
}

export function subscribeToLetterbox(onChange: () => void): () => void {
 const channel = supabase.channel('cinema-letterbox-feed')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'letterbox_posts' }, onChange)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'letterbox_reactions' }, onChange)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'letterbox_comments' }, onChange)
  .subscribe();
 return () => { void supabase.removeChannel(channel); };
}
