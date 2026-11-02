import { useMemo, useState } from 'react';
import { ArrowUpRight, Clapperboard, Play, Search, Share2, Sparkles, Users, Video } from 'lucide-react';
import { ShortCard } from '@/components/discover/ShortCard';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { VideoDialog } from '@/components/player/VideoDialog';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { CHIP_BASE, INPUT, PAGE_CONTAINER, chipClass } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { fetchPublishedClips, type DiscoverClip } from '@/lib/clips';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchDiscoverTrailers, tmdbHref, tmdbYear, type TmdbTrailer } from '@/lib/tmdb';
import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import type { Title } from '@/lib/types';
import type { VideoSource } from '@/lib/videoSource';

type DiscoverTab = 'all' | 'trailers' | 'clips' | 'shorts';
const TABS: { id: DiscoverTab; label: string }[] = [
  { id: 'all', label: 'All videos' }, { id: 'trailers', label: 'Trailers' }, { id: 'clips', label: 'Clips & first looks' }, { id: 'shorts', label: 'Shorts' },
];
interface DiscoverData { titles: Title[]; clips: DiscoverClip[]; trailers: TmdbTrailer[] }
async function loadDiscover(): Promise<DiscoverData> {
  const results = await Promise.allSettled([fetchPublishedTitles(), fetchPublishedClips(), fetchDiscoverTrailers(4)]);
  return {
    titles: results[0].status === 'fulfilled' ? results[0].value : [],
    clips: results[1].status === 'fulfilled' ? results[1].value : [],
    trailers: results[2].status === 'fulfilled' ? results[2].value : [],
  };
}
type VideoCardData = { id: string; title: string; publisher: string; image: string; description: string; href: string | null; url: string; meta: string };
function VideoTile({ item, onPlay, onShare }: { item: VideoCardData; onPlay: (item: VideoCardData) => void; onShare: (item: VideoCardData) => void }) {
  return (
    <article className="cinema-video-tile">
      <button type="button" onClick={() => onPlay(item)} className="cinema-video-thumb group" aria-label={'Play ' + item.title}>
        <Artwork src={item.image} alt="" fallbackTitle={item.title} className="h-full w-full transition duration-500 group-hover:scale-[1.04]" />
        <span className="cinema-video-play"><Play className="h-6 w-6 fill-current" /></span>
        <span className="cinema-video-duration">{item.meta}</span>
      </button>
      <div className="flex gap-3 pt-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-cinema-200"><Clapperboard className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-white">{item.title}</h3>
          <p className="mt-1 truncate text-xs text-slate-400">{item.publisher}</p>
          {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>}
          <div className="mt-2 flex items-center gap-3">
            {item.href && <a href={item.href} className="inline-flex items-center gap-1 text-xs font-semibold text-cinema-200 hover:text-white">Explore title <ArrowUpRight className="h-3.5 w-3.5" /></a>}
            <button type="button" onClick={() => onShare(item)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-white"><Share2 className="h-3.5 w-3.5" /> Share</button>
          </div>
        </div>
      </div>
    </article>
  );
}
export function DiscoverPage() {
  const { data, error, reload } = useAsyncData(loadDiscover, []);
  const [tab, setTab] = useState<DiscoverTab>('all');
  const [query, setQuery] = useState('');
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoSource | null>(null);
  const { notify } = useToast();
  const shorts = useMemo(() => (data?.clips ?? []).filter((clip) => clip.kind === 'short'), [data]);
  const videos = useMemo<VideoCardData[]>(() => {
    if (!data) return [];
    const official = data.trailers.map((item) => ({
      id: 'tmdb-' + item.mediaType + '-' + item.id,
      title: item.title + ' · Official trailer',
      publisher: 'Official trailer',
      image: 'https://img.youtube.com/vi/' + item.videoKey + '/hqdefault.jpg',
      description: item.overview,
      href: tmdbHref(item),
      url: 'https://www.youtube.com/watch?v=' + item.videoKey,
      meta: (item.mediaType === 'movie' ? 'Movie' : 'Series') + (tmdbYear(item) ? ' · ' + tmdbYear(item) : ''),
    }));
    const publisherClips = data.clips.filter((clip) => clip.kind === 'trailer' || clip.kind === 'clip' || clip.kind === 'featured').map((clip) => ({
      id: clip.id, title: clip.headline, publisher: clip.publisher_name || 'Cinema publisher',
      image: clip.poster_url, description: clip.description, href: clip.title_id ? '/title/' + clip.title_id : null,
      url: clip.video_url, meta: clip.kind === 'trailer' ? 'Trailer' : clip.kind === 'featured' ? 'Featured' : 'Clip',
    }));
    const titleTrailers = data.titles.filter((title) => title.trailer_url.trim()).map((title) => ({
      id: 'title-' + title.id, title: title.title + ' · Trailer', publisher: title.publisher || 'Cinema catalogue',
      image: title.backdrop_url || title.poster_url, description: title.synopsis, href: '/title/' + title.id,
      url: title.trailer_url, meta: 'Trailer',
    }));
    const unique = new Map<string, VideoCardData>();
    [...publisherClips, ...titleTrailers, ...official].forEach((item) => unique.set(item.id, item));
    return [...unique.values()];
  }, [data]);
  const visible = useMemo(() => videos.filter((item) => {
    const matches = !query.trim() || (item.title + ' ' + item.publisher + ' ' + item.description).toLowerCase().includes(query.trim().toLowerCase());
    if (!matches) return false;
    if (tab === 'trailers') return item.meta.toLowerCase().includes('trailer') || item.publisher === 'Official trailer';
    if (tab === 'clips') return !item.meta.toLowerCase().includes('trailer') && item.publisher !== 'Official trailer';
    return tab === 'all';
  }), [videos, query, tab]);
  async function share(item: VideoCardData) {
    const url = item.href ? new URL(item.href, window.location.origin).toString() : item.url;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); notify('Link copied. Share it with your friends.'); }
      else notify('Copy the video link from your browser to share it.');
    } catch (cause) { if ((cause as { name?: string }).name !== 'AbortError') notify('Could not share this video.', 'error'); }
  }
  if (!data) return <div className={PAGE_CONTAINER}>{error ? <ErrorState onRetry={reload} /> : <LoadingState />}</div>;
  return (
    <div className={PAGE_CONTAINER + ' space-y-8 pb-14'}>
      <header className="flex flex-col gap-5 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="cinema-kicker"><Sparkles className="h-3.5 w-3.5" /> THE WORLD OF STORIES</p><h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Discover</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Trailers, first looks, official clips and short videos from the worlds of entertainment.</p></div>
        <a href="/friends" className="inline-flex items-center gap-2 self-start rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:self-auto"><Users className="h-4 w-4" /> Share with friends</a>
      </header>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Discover categories">
          {TABS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={CHIP_BASE + ' shrink-0 ' + chipClass(tab === item.id)}>{item.label}</button>)}
        </div>
        <label className="relative block w-full md:max-w-xs"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search videos and stories" className={INPUT + ' pl-10'} aria-label="Search Discover" /></label>
      </div>
      {(tab === 'all' || tab === 'shorts') && <section className="space-y-4">
        <div className="flex items-end justify-between"><div><p className="cinema-kicker">QUICK WATCH</p><h2 className="mt-1 text-xl font-extrabold text-white">Cinema Shorts</h2><p className="mt-1 text-sm text-slate-400">Short-form videos published by approved Cinema publishers.</p></div><span className="text-xs text-slate-500">{shorts.length} available</span></div>
        {shorts.length ? <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">{shorts.map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActiveShort} />)}</div> : <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">No approved Shorts have been published yet. Official trailers and clips are available below.</div>}
      </section>}
      {tab !== 'shorts' && <section className="space-y-5">
        <div className="flex items-end justify-between"><div><p className="cinema-kicker">WATCH & EXPLORE</p><h2 className="mt-1 text-xl font-extrabold text-white">{tab === 'trailers' ? 'Official trailers & first looks' : tab === 'clips' ? 'Publisher clips' : 'Videos from the world of entertainment'}</h2></div><span className="text-xs text-slate-500">{visible.length} videos</span></div>
        {visible.length ? <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <VideoTile key={item.id} item={item} onPlay={(value) => setActiveVideo({ url: value.url, label: value.title, heading: value.title })} onShare={(value) => void share(value)} />)}</div> : <EmptyState icon={<Video className="h-7 w-7 text-cinema-200" />} title="No videos match this view" description="Try another category or search. More official content appears as publishers make it available." />}
      </section>}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-sm text-slate-400"><span>Found something worth sharing?</span><a href="/friends" className="inline-flex items-center gap-2 font-semibold text-cinema-200 hover:text-white">Write a Letterbox post <ArrowUpRight className="h-4 w-4" /></a></div>
      <TmdbAttribution />
      {activeShort && <ShortViewer clip={activeShort} onClose={() => setActiveShort(null)} />}
      {activeVideo && <VideoDialog {...activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
