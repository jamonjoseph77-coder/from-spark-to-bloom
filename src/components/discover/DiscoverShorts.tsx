import { useMemo, useState } from 'react';
import { ArrowRight, Clapperboard, MessageCircle, Play, Sparkles } from 'lucide-react';
import { ShortCard } from '@/components/discover/ShortCard';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchPublishedClips, isPlayableShort, type DiscoverClip } from '@/lib/clips';
import { fetchLetterboxFeed, type LetterboxPost } from '@/lib/letterbox';

export function DiscoverShorts() {
  const [active, setActive] = useState<DiscoverClip | null>(null);
  const { data, error, reload } = useAsyncData(fetchPublishedClips, []);
  const shorts = useMemo(
    () => (data ?? []).filter((clip) => (clip.kind === 'short' || clip.kind === 'clip') && isPlayableShort(clip)).slice(0, 18),
    [data],
  );

  return (
    <section className="space-y-5" aria-label="Cinema Shorts">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300"><Play className="h-3.5 w-3.5 fill-current" /> Short-Form Video</p>
          <h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Cinema Shorts</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">Quick, Useful Moments From Official Publishers — Highlights, Previews And Behind-The-Scenes Stories.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cinema-300/20 bg-cinema-300/[.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cinema-200">Up To 90 Seconds</span>
          <a href="/creator/shorts" className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:border-cinema-300/50 hover:text-cinema-200">Submit A Short</a>
        </div>
      </div>
      {!data && !error && <LoadingState label="Finding Short Stories" />}
      {!data && error && <ErrorState onRetry={reload} description={error.message} />}
      {data && shorts.length === 0 && <EmptyState icon={<Clapperboard className="h-7 w-7 text-cinema-300" />} title="Cinema Shorts Are Getting Ready" description="YouTube Videos And Creator Uploads Will Appear Here After They Are Added And Approved By Cinema." />}
      {shorts.length > 0 && <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {shorts.map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActive} />)}
      </div>}
      {active && <ShortViewer clip={active} onClose={() => setActive(null)} />}
    </section>
  );
}

function PulseCard({ post }: { post: LetterboxPost }) {
  const reactions = post.reactions?.length ?? 0;
  const comments = post.comments?.length ?? 0;
  return (
    <article className="min-w-0 rounded-2xl border border-white/10 bg-[#0a1220]/90 p-4 transition hover:border-cinema-300/25 hover:bg-white/[.035]">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cinema-300/20 bg-cinema-300/10 text-sm font-black text-cinema-100">{(post.author?.display_name || post.author?.username || 'C').slice(0,1).toUpperCase()}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{post.author?.display_name || post.author?.username || 'Cinema Member'}</p><p className="text-[10px] text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p></div>
        <MessageCircle className="h-4 w-4 text-cinema-300" />
      </div>
      <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.body}</p>
      {post.title && <a href={`/title/${post.title.id}`} className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5 transition hover:border-cinema-300/30"><span className="h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-ink-800">{post.title.poster_url && <img src={post.title.poster_url} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-wider text-cinema-300">About This Title</span><span className="block truncate text-xs font-bold text-white">{post.title.title}</span></span><ArrowRight className="h-4 w-4 text-slate-500" /></a>}
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500"><span>{reactions} {reactions === 1 ? 'Reaction' : 'Reactions'}</span><span>{comments} {comments === 1 ? 'Comment' : 'Comments'}</span><a href="/friends" className="ml-auto font-semibold text-cinema-200 hover:text-white">Open Community <ArrowRight className="inline h-3 w-3" /></a></div>
    </article>
  );
}

export function CinemaPulse() {
  const { data, error, reload } = useAsyncData(() => fetchLetterboxFeed(12), []);
  return (
    <section className="space-y-5" aria-label="Cinema community conversations">
      <div className="flex items-end justify-between gap-3">
        <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300"><Sparkles className="h-3.5 w-3.5" /> The Conversation</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Cinema Pulse</h2><p className="mt-1 text-sm text-slate-400">Public Thoughts And Conversations Around The Stories People Care About.</p></div>
        <a href="/friends" className="shrink-0 text-xs font-bold text-cinema-200 hover:text-white">Visit Friends <ArrowRight className="inline h-3.5 w-3.5" /></a>
      </div>
      {!data && !error && <LoadingState label="Gathering The Conversation" />}
      {!data && error && <ErrorState onRetry={reload} />}
      {data && data.length === 0 && <EmptyState icon={<MessageCircle className="h-7 w-7 text-cinema-300" />} title="The Conversation Starts Here" description="Public Posts About Movies And Series Will Appear Here As The Cinema Community Shares Its Thoughts." />}
      {data && data.length > 0 && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.slice(0, 6).map((post) => <PulseCard key={post.id} post={post} />)}</div>}
    </section>
  );
}
