import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clapperboard, MessageCircle, Play, RefreshCw, Sparkles } from 'lucide-react';
import { ShortCard } from '@/components/discover/ShortCard';
import { ContentEngagement } from '@/components/discover/ContentEngagement';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchPublishedShorts, isPlayableShort, type DiscoverClip } from '@/lib/clips';
import { fetchLetterboxFeed, type LetterboxPost } from '@/lib/letterbox';

function getShortsErrorDescription(error: unknown): string {
  const details = typeof error === 'object' && error !== null
    ? error as { code?: unknown; message?: unknown }
    : {};
  const code = typeof details.code === 'string' ? details.code : '';
  const message = typeof details.message === 'string'
    ? details.message.toLowerCase()
    : error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();

  if (code === 'PGRST205' || code === '42P01' || message.includes('public.discover_clips') || message.includes('discover_clips')) {
    return 'The Cinema Shorts database table is missing from the connected Supabase project or its schema cache. Apply the latest Cinema Shorts migration in Supabase, then refresh the schema cache.';
  }

  return "Cinema Shorts couldn't connect to the video library. We tried again automatically. Please try again shortly.";
}

function ShortsLoading() {
  return (
    <div role="status" aria-label="Loading Cinema Shorts" className="-mx-4 flex snap-x gap-3 overflow-hidden px-4 pb-3 sm:mx-0 sm:gap-4 sm:px-0">
      {Array.from({ length: 5 }, (_, index) => <div key={index} className="cinema-short-skeleton aspect-[9/16] w-[min(38vw,148px)] shrink-0 rounded-[1.2rem] sm:w-[148px]" />)}
    </div>
  );
}

export function DiscoverShorts() {
  const [active, setActive] = useState<DiscoverClip | null>(null);
  const { data, error, reload } = useAsyncData(fetchPublishedShorts, []);
  useEffect(() => {
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [reload]);
  const shorts = useMemo(
    () => (data ?? []).filter((clip) => (clip.kind === 'short' || clip.kind === 'clip') && isPlayableShort(clip)).sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''))
      .slice(0, 18),
    [data],
  );

  useEffect(() => {
    if (!data || !shorts.length) return;
    const match = window.location.hash.match(/^#short-(.+)$/);
    if (!match) return;
    const linked = shorts.find((clip) => clip.id === match[1]);
    if (linked) setActive(linked);
  }, [data, shorts]);

  function closeViewer() {
    setActive(null);
    if (window.location.hash.startsWith('#short-')) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  return (
    <section className="space-y-5" aria-label="Cinema Shorts">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-slate-200"><Play className="h-3.5 w-3.5 fill-current text-sky-200" /> Short-Form Video</p>
          <h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Cinema Shorts</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">Short Films, Highlights, Previews And Behind-The-Scenes Stories From Cinema Publishers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/15 bg-sky-300/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-100 transition hover:border-sky-200/35 hover:bg-sky-300/[.12]"><RefreshCw className="h-3 w-3" /> Refresh</button>
          <span className="rounded-full border border-white/15 bg-white/[.045] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-200">Up To 90 Seconds</span>
          <a href="/creator/shorts" className="rounded-full border border-white/20 bg-white/[.045] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:border-sky-200/45 hover:bg-white/[.08]">Submit A Short</a>
        </div>
      </div>
      {!data && !error && <ShortsLoading />}
      {!data && error && <ErrorState onRetry={reload} description={getShortsErrorDescription(error)} />}
      {data && shorts.length === 0 && <EmptyState icon={<Clapperboard className="h-7 w-7 text-cinema-300" />} title="Your Shorts Feed Is Ready For More" description="Newly Approved Publisher And Creator Shorts Will Appear Here. Return To This Page To Check For New Videos." />}
      {shorts.length > 0 && <div className="cinema-shorts-rail -mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {shorts.map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActive} />)}
      </div>}
      {active && <ShortViewer clip={active} onClose={closeViewer} />}
    </section>
  );
}

function PulseCard({ post }: { post: LetterboxPost }) {
  const reactions = post.reactionCount;
  const comments = post.comments?.length ?? 0;
  return (
    <article className="min-w-0 rounded-2xl border border-white/10 bg-[#0a1220]/90 p-4 transition hover:border-cinema-300/25 hover:bg-white/[.035]">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cinema-300/20 bg-cinema-300/10 text-sm font-black text-cinema-100">{(post.author?.display_name || post.author?.username || 'C').slice(0,1).toUpperCase()}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{post.author?.display_name || post.author?.username || 'Cinema Member'}</p><p className="text-[10px] text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p></div>
        <MessageCircle className="h-4 w-4 text-cinema-300" />
      </div>
      <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.body}</p>
      {post.title && <a href={`/title/${post.title.id}`} className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5 transition hover:border-cinema-300/30"><span className="h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-ink-800">{post.title.poster_url && <img src={post.title.poster_url} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-wider text-cinema-300">About this title</span><span className="block truncate text-xs font-bold text-white">{post.title.title}</span></span><ArrowRight className="h-4 w-4 text-slate-500" /></a>}
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500"><span>{reactions} {reactions === 1 ? 'Reaction' : 'Reactions'}</span><span>{comments} {comments === 1 ? 'Comment' : 'Comments'}</span><a href="/friends" className="ml-auto font-semibold text-cinema-200 hover:text-white">Open community <ArrowRight className="inline h-3 w-3" /></a></div>
      <ContentEngagement contentKey={`letterbox:${post.id}`} title={`Letterbox: ${post.body.slice(0, 100)}`} href={`/letterbox#post-${post.id}`} imageUrl={post.title?.poster_url || ''} compact />
    </article>
  );
}

export function CinemaPulse() {
  const { data, error, reload } = useAsyncData(() => fetchLetterboxFeed(12), []);
  return (
    <section className="space-y-5" aria-label="Cinema community conversations">
      <div className="flex items-end justify-between gap-3">
        <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300"><Sparkles className="h-3.5 w-3.5" /> The Conversation</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Cinema Pulse</h2><p className="mt-1 text-sm text-slate-400">Public thoughts and conversations around the stories people care about.</p></div>
        <a href="/friends" className="shrink-0 text-xs font-bold text-cinema-200 hover:text-white">Visit friends <ArrowRight className="inline h-3.5 w-3.5" /></a>
      </div>
      {!data && !error && <LoadingState label="Gathering the conversation" />}
      {!data && error && <ErrorState onRetry={reload} />}
      {data && data.length === 0 && <EmptyState icon={<MessageCircle className="h-7 w-7 text-cinema-300" />} title="The conversation starts here" description="Public posts about movies and series will appear here as the Cinema community shares its thoughts." />}
      {data && data.length > 0 && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.slice(0, 6).map((post) => <PulseCard key={post.id} post={post} />)}</div>}
    </section>
  );
}
