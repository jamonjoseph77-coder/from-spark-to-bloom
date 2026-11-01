import { useMemo, useState } from 'react';
import { ArrowUpRight, Bookmark, Clapperboard, Compass, Film, MessageCircle, Play, Share2, Sparkles, Tv } from 'lucide-react';
import { ShortCard } from '@/components/discover/ShortCard';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { VideoDialog } from '@/components/player/VideoDialog';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_SECONDARY, CHIP_BASE, PAGE_CONTAINER, chipClass } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { fetchPublishedClips, type DiscoverClip } from '@/lib/clips';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchDiscoverTrailers, tmdbHref, tmdbImageUrl, type TmdbTrailer } from '@/lib/tmdb';
import type { Title } from '@/lib/types';
import type { VideoSource } from '@/lib/videoSource';

type FeedTab = 'for-you' | 'shorts' | 'trailers' | 'clips';
const TABS: { id: FeedTab; label: string }[] = [
  { id: 'for-you', label: 'For you' }, { id: 'shorts', label: 'Shorts' }, { id: 'trailers', label: 'Trailers' }, { id: 'clips', label: 'Clips' },
];
interface DiscoverData { titles: Title[]; clips: DiscoverClip[]; trailers: TmdbTrailer[] }

async function loadDiscover(): Promise<DiscoverData> {
  const [titles, clips, trailers] = await Promise.allSettled([fetchPublishedTitles(), fetchPublishedClips(), fetchDiscoverTrailers()]);
  if (titles.status === 'rejected') console.warn('Cinema titles unavailable in Discover', titles.reason);
  if (clips.status === 'rejected') console.warn('Cinema clips unavailable in Discover', clips.reason);
  if (trailers.status === 'rejected') console.warn('Cinema trailer discovery unavailable', trailers.reason);
  return {
    titles: titles.status === 'fulfilled' ? titles.value : [],
    clips: clips.status === 'fulfilled' ? clips.value : [],
    trailers: trailers.status === 'fulfilled' ? trailers.value : [],
  };
}

function FeedAction({ icon: Icon, label, onClick }: { icon: typeof Share2; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"><Icon className="h-4 w-4" />{label}</button>;
}

export function DiscoverPage() {
  const { data, error, reload } = useAsyncData(loadDiscover, []);
  const [tab, setTab] = useState<FeedTab>('for-you');
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoSource | null>(null);
  const { notify } = useToast();

  const shorts = useMemo(() => (data?.clips ?? []).filter((clip) => clip.kind === 'short'), [data]);
  const trailers = useMemo(() => [
    ...(data?.clips ?? []).filter((clip) => clip.kind === 'trailer').map((clip) => ({ type: 'clip' as const, clip })),
    ...(data?.titles ?? []).filter((title) => title.trailer_url.trim()).map((title) => ({ type: 'title' as const, title })),
    ...(data?.trailers ?? []).map((trailer) => ({ type: 'tmdb' as const, trailer })),
  ], [data]);
  const clips = useMemo(() => (data?.clips ?? []).filter((clip) => clip.kind === 'clip' || clip.kind === 'featured'), [data]);

  async function shareItem(title: string, url: string) {
    try {
      if (navigator.share) await navigator.share({ title, url });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        notify('Link copied. Share it with your friends.');
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (cause) {
      if ((cause as { name?: string }).name !== 'AbortError') notify('Could not share this link. Try copying the page address.', 'error');
    }
  }

  if (!data) return <div className={PAGE_CONTAINER}>{error ? <ErrorState onRetry={reload} /> : <LoadingState />}</div>;

  const hasFeed = data.clips.length > 0 || data.titles.some((title) => title.trailer_url.trim()) || data.trailers.length > 0;
  const feedClips = [...data.clips].sort((a, b) => a.sort_order - b.sort_order);
  const titleCount = data.titles.length;

  return (
    <div className={`${PAGE_CONTAINER} space-y-8 pb-12`}>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cinema-500/20 via-ink-900 to-ink-950 p-6 sm:p-9">
        <div className="absolute -right-10 -top-16 -z-10 h-64 w-64 rounded-full bg-cinema-500/10 blur-3xl" />
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cinema-200"><Compass className="h-4 w-4" /> Cinema Discover</div>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl"><h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">The stories everyone's talking about.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Watch first looks, catch up on short videos, explore new releases and pass the stories you love to your friends.</p></div>
          <div className="flex flex-wrap gap-2"><a href="/friends" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"><MessageCircle className="h-4 w-4" /> Friends</a><a href="/watch-parties" className="inline-flex items-center gap-2 rounded-full bg-cinema-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cinema-950/30 transition hover:bg-cinema-400"><Sparkles className="h-4 w-4" /> Watch together</a></div>
        </div>
      </header>

      <div className="sticky top-16 z-20 -mx-4 border-y border-white/5 bg-ink-950/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Discover feed">
          {TABS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`${CHIP_BASE} shrink-0 ${chipClass(tab === item.id)}`}>{item.label}</button>)}
        </div>
      </div>

      {!hasFeed && <EmptyState icon={<Compass className="h-7 w-7 text-cinema-300" />} title="The feed is getting ready" description="Publisher shorts, trailers and featured stories will appear here when they are published." />}
      {hasFeed && <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-7">
          {(tab === 'for-you' || tab === 'shorts') && <section className="space-y-4">
            <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cinema-300">Quick watch</p><h2 className="text-xl font-extrabold text-white sm:text-2xl">Cinema Shorts</h2><p className="mt-1 text-sm text-slate-400">Vertical videos from verified publishers.</p></div><span className="text-xs text-slate-500">{shorts.length} videos</span></div>
            {shorts.length ? <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">{shorts.map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActiveShort} />)}</div> : <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">No Shorts have been published yet.</p>}
          </section>}

          {(tab === 'for-you' || tab === 'trailers' || tab === 'clips') && <section className="space-y-4">
            <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cinema-300">From the Cinema community</p><h2 className="text-xl font-extrabold text-white sm:text-2xl">{tab === 'trailers' ? 'Trailers & first looks' : tab === 'clips' ? 'Featured clips' : 'The Discover feed'}</h2><p className="mt-1 text-sm text-slate-400">Publisher updates, videos and stories linked to the titles they belong to.</p></div></div>
            <div className="space-y-5">
              {tab !== 'clips' && trailers.map((item, index) => {
                const isClip = item.type === 'clip';
                const title = item.type === 'title' ? item.title : item.type === 'tmdb' ? null : item.clip.title;
                const heading = item.type === 'clip' ? item.clip.headline : item.type === 'title' ? item.title.title : item.trailer.title;
                const publisher = item.type === 'clip' ? item.clip.publisher_name : item.type === 'title' ? item.title.publisher : 'Official trailer';
                const image = item.type === 'clip' ? item.clip.poster_url : item.type === 'title' ? item.title.backdrop_url || item.title.poster_url : tmdbImageUrl(item.trailer.backdropPath, 'w780') || tmdbImageUrl(item.trailer.posterPath, 'w500');
                const href = title ? `/title/${title.id}` : item.type === 'tmdb' ? tmdbHref(item.trailer) : null;
                const play = () => setActiveVideo(item.type === 'clip' ? { url: item.clip.video_url, label: item.clip.headline, heading: item.clip.headline } : item.type === 'title' ? { url: item.title.trailer_url, label: `${item.title.title} trailer`, heading: `Trailer: ${item.title.title}` } : { url: `https://www.youtube.com/watch?v=${item.trailer.videoKey}`, label: `${item.trailer.title} trailer`, heading: `Official trailer: ${item.trailer.title}` });
                return <article key={`trailer-${index}`} className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80 shadow-xl shadow-black/10 transition hover:border-cinema-400/25">
                  <div className="flex items-center gap-3 px-4 py-4 sm:px-5"><span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cinema-400 to-indigo-700 text-white"><Clapperboard className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{publisher || 'Cinema'}</p><p className="text-xs text-slate-500">Official story update · {isClip ? 'Publisher video' : 'Trailer discovery'}</p></div><span className="rounded-full border border-cinema-400/20 bg-cinema-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cinema-200">Official</span></div>
                  <button type="button" onClick={play} className="group relative block aspect-video w-full overflow-hidden bg-ink-800 text-left"><Artwork src={image} alt="" fallbackTitle={heading} className="h-full w-full transition duration-700 group-hover:scale-[1.025]" /><span className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" /><span className="absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-white/15 text-white shadow-2xl backdrop-blur-md transition group-hover:scale-110"><Play className="h-6 w-6 fill-current" /></span></span><span className="absolute bottom-4 left-4 text-xs font-bold uppercase tracking-wider text-white/90">Watch now</span></button>
                  <div className="space-y-3 p-4 sm:p-5"><h3 className="text-lg font-extrabold leading-snug text-white">{heading}</h3>{item.type === 'clip' && item.clip.description && <p className="text-sm leading-6 text-slate-300">{item.clip.description}</p>}{title && <a href={`/title/${title.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cinema-300 hover:text-white"><Film className="h-4 w-4" /> Explore {title.title}<ArrowUpRight className="h-4 w-4" /></a>}{href && !title && <a href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-cinema-300 hover:text-white">Explore title<ArrowUpRight className="h-4 w-4" /></a>}
                    <div className="flex flex-wrap items-center gap-1 border-t border-white/5 pt-2"><FeedAction icon={Share2} label="Share" onClick={() => void shareItem(heading, href ? new URL(href, window.location.origin).toString() : window.location.href)} /><FeedAction icon={MessageCircle} label="Discuss with friends" onClick={() => { window.location.href = title ? `/title/${title.id}` : '/friends'; }} /><FeedAction icon={Bookmark} label="Explore Cinema" onClick={() => { window.location.href = href || '/discover'; }} /></div>
                  </div>
                </article>;
              })}
              {(tab === 'for-you' || tab === 'clips') && clips.map((clip) => <article key={clip.id} className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80"><div className="flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-cinema-500/15 text-cinema-200"><Tv className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{clip.publisher_name || 'Cinema publisher'}</p><p className="text-xs text-slate-500">Featured story</p></div></div><button type="button" onClick={() => setActiveVideo({ url: clip.video_url, label: clip.headline, heading: clip.headline })} className="relative block aspect-video w-full"><Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full" /><span className="absolute inset-0 grid place-items-center bg-black/20"><span className="grid h-14 w-14 place-items-center rounded-full bg-cinema-500 text-white"><Play className="h-6 w-6 fill-current" /></span></span></button><div className="space-y-3 p-4"><h3 className="font-bold text-white">{clip.headline}</h3>{clip.description && <p className="text-sm text-slate-300">{clip.description}</p>}{clip.title && <a href={`/title/${clip.title.id}`} className="text-sm font-semibold text-cinema-300">Explore {clip.title.title}</a>}<div className="flex gap-1 border-t border-white/5 pt-2"><FeedAction icon={Share2} label="Share" onClick={() => void shareItem(clip.headline, window.location.href)} /><FeedAction icon={MessageCircle} label="Discuss" onClick={() => { window.location.href = clip.title ? `/title/${clip.title.id}` : '/friends'; }} /></div></div></article>)}
              {tab === 'trailers' && trailers.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No trailers are available yet.</p>}
              {tab === 'clips' && clips.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No featured clips are available yet.</p>}
            </div>
          </section>}
        </main>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-ink-900/80 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-cinema-300">Your people</p><h2 className="mt-2 text-lg font-extrabold text-white">Stories are better together.</h2><p className="mt-2 text-sm leading-6 text-slate-400">Find friends, share titles and plan a watch party around the stories you love.</p><div className="mt-4 grid gap-2"><a href="/friends" className={`${BUTTON_SECONDARY} justify-center`}>Find friends</a><a href="/watch-parties" className="rounded-xl bg-cinema-500 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-cinema-400">Explore watch parties</a></div></section>
          <section className="rounded-3xl border border-white/10 bg-ink-900/80 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-cinema-300">On Cinema</p><div className="mt-4 space-y-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cinema-500/15 text-cinema-200"><Film className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-white">{titleCount} published titles</p><p className="text-xs text-slate-500">Explore the catalogue</p></div></div><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cinema-500/15 text-cinema-200"><Play className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-white">{shorts.length} Shorts</p><p className="text-xs text-slate-500">Quick stories and first looks</p></div></div></div></section>
        </aside>
      </div>}

      {activeShort && <ShortViewer clip={activeShort} onClose={() => setActiveShort(null)} />}
      {activeVideo && <VideoDialog {...activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
