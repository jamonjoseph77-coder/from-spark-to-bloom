import { supabase } from '@/lib/supabase';
import { createRealtimeChannel } from '@/lib/realtime';

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
  reactionCount: number;
  likedByCurrentUser: boolean;
  comments?: { id: string; author_id: string; body: string; created_at: string }[];
}

export async function fetchLetterboxFeed(limit = 40, authorId?: string): Promise<LetterboxPost[]> {
  let postsQuery = supabase
    .from('letterbox_posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (authorId) postsQuery = postsQuery.eq('author_id', authorId);
  const { data: posts, error } = await postsQuery;
  if (error) throw error;
  if (!posts?.length) return [];

  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const titleIds = [...new Set(posts.flatMap((post) => post.title_id ? [post.title_id] : []))];
  const postIds = posts.map((post) => post.id);

  const [authorsResult, titlesResult, engagementResult, commentsResult] = await Promise.all([
    supabase.from('profiles').select('user_id,username,display_name').in('user_id', authorIds),
    titleIds.length
      ? supabase.from('titles').select('id,title,poster_url,type').in('id', titleIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.rpc('get_letterbox_post_engagement', { p_post_ids: postIds }),
    supabase.from('letterbox_comments').select('id,post_id,author_id,body,created_at').eq('status', 'published').in('post_id', postIds).order('created_at'),
  ]);

  if (authorsResult.error) throw authorsResult.error;
  if (titlesResult.error) throw titlesResult.error;
  if (engagementResult.error) throw engagementResult.error;
  if (commentsResult.error) throw commentsResult.error;

  const authors = authorsResult.data ?? [];
  const titles = titlesResult.data ?? [];
  const engagements = new Map((engagementResult.data ?? []).map((row) => [row.post_id, row]));
  const comments = commentsResult.data ?? [];

  return posts.map((post) => ({
    ...post,
    visibility: post.visibility as LetterboxPost['visibility'],
    status: post.status as LetterboxPost['status'],
    author: authors.find((author) => author.user_id === post.author_id) ?? null,
    title: titles.find((title) => title.id === post.title_id) ?? null,
    reactionCount: engagements.get(post.id)?.reaction_count ?? 0,
    likedByCurrentUser: engagements.get(post.id)?.liked_by_current_user ?? false,
    comments: comments
      .filter((comment) => comment.post_id === post.id)
      .map(({ id, author_id, body, created_at }) => ({ id, author_id, body, created_at })),
  }));
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
  const { error } = await supabase.from('letterbox_reactions').insert(
    { post_id: postId, user_id: userId, reaction: 'like' },
  );
  if (error && error.code !== '23505') throw error;
}

export async function addLetterboxComment(postId: string, authorId: string, body: string): Promise<void> {
  const { error } = await supabase.from('letterbox_comments').insert({
    post_id: postId,
    author_id: authorId,
    body: body.trim(),
    status: 'published',
  });
  if (error) throw error;
}

export function subscribeToLetterbox(onChange: () => void): () => void {
  const channel = createRealtimeChannel('cinema-letterbox-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'letterbox_posts' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'letterbox_comments' }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}
