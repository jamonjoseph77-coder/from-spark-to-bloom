import { useEffect, useMemo } from 'react';
import { ArrowUpRight, Film, Heart, MessageCircle, Sparkles, Users } from 'lucide-react';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchLetterboxFeed, subscribeToLetterbox } from '@/lib/letterbox';

interface CircleActivityProps {
  friendIds: string[];
}

export function CircleActivity({ friendIds }: CircleActivityProps) {
  const feed = useAsyncData(() => fetchLetterboxFeed(100), []);
  useEffect(() => subscribeToLetterbox(feed.reload), [feed.reload]);
  const friendSet = useMemo(() => new Set(friendIds), [friendIds]);
  const activity = useMemo(
    () => (feed.data ?? []).filter((post) => friendSet.has(post.author_id)).slice(0, 24),
    [feed.data, friendSet],
  );

  if (feed.loading && !feed.data) return <LoadingState label="Finding what your friends are sharing" />;
  if (feed.error) return <ErrorState onRetry={feed.reload} />;

  if (friendIds.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-7 w-7 text-cinema-300" />}
        title="Your circle starts with a connection"
        description="Find people you know on Cinema. Their public entertainment recommendations and conversations will appear here."
      />
    );
  }

  if (activity.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-7 w-7 text-cinema-300" />}
        title="Your circle is ready for its first story"
        description="When your friends share a public recommendation, review or title discussion, you will find it here."
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-cinema-300">From your people</p>
          <h2 className="mt-1 text-xl font-extrabold text-white">Your circle's activity</h2>
          <p className="mt-1 text-sm text-slate-400">Public recommendations and conversations shared by your friends.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-slate-400">{activity.length} recent posts</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {activity.map((post) => {
          const author = post.author?.display_name || post.author?.username || 'Cinema member';
          const profileUrl = post.author?.username ? `/profile?username=${encodeURIComponent(post.author.username)}` : '/friends';
          return (
            <article key={post.id} id={`post-${post.id}`} className="rounded-3xl border border-white/10 bg-ink-900/80 p-5 shadow-lg shadow-black/10 transition hover:border-cinema-400/25">
              <div className="flex items-center gap-3">
                <ProfileAvatar name={author} size="sm" />
                <div className="min-w-0 flex-1">
                  <a href={profileUrl} className="block truncate text-sm font-extrabold text-white hover:text-cinema-200">{author}</a>
                  <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                </div>
                <span className="rounded-full border border-cinema-400/20 bg-cinema-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cinema-200">Friend</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{post.body}</p>
              {post.title && (
                <a href={`/title/${post.title.id}`} className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3 transition hover:border-cinema-400/30">
                  <div className="grid h-12 w-10 shrink-0 place-items-center rounded-lg bg-cinema-500/10"><Film className="h-5 w-5 text-cinema-200" /></div>
                  <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-wider text-cinema-300">Talking about</span><span className="block truncate text-sm font-bold text-white">{post.title.title}</span></span>
                  <ArrowUpRight className="h-4 w-4 text-slate-500" />
                </a>
              )}
              <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-cinema-300" /> {post.reactionCount}</span>
                <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-cinema-300" /> {post.comments?.length ?? 0}</span>
                <a href={`/friends#post-${post.id}`} className="ml-auto font-semibold text-cinema-200 hover:text-white">Open conversation</a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
