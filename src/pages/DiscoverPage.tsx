import { useMemo, useState } from 'react';
import { Compass, Film, MessageCircle, Play, Share2, Sparkles, Users } from 'lucide-react';
import { ShortCard } from '@/components/discover/ShortCard';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { VideoDialog } from '@/components/player/VideoDialog';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { CHIP_BASE, PAGE_CONTAINER, chipClass } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { fetchPublishedClips, type DiscoverClip } from '@/lib/clips';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchDiscoverTrailers, tmdbHref, tmdbImageUrl, type TmdbTrailer } from '@/lib/tmdb';
import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import type { Title } from '@/lib/types';
import type { VideoSource } from '@/lib/videoSource';

type FeedTab = 'for-you' | 'shorts' | 'trailers' | 'clips';
const TABS: { id: FeedTab; label: string }[] = [
  { id: 'for-you', label: 'For you' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'trailers', label: 'Trailers' },
  { id: 'clips', label: 'Clips & features' },
];

interface DiscoverData { titles: Title[]; clips: DiscoverClip[]; trailers: TmdbTrailer[] }
interface VideoTileData {
  id: string;
  heading: string;
  publisher: string;
  image: string;
  description: string;
  kind: string;
  href: string | null;
  source: VideoSource;
}

async function loadDiscover(): Promise<DiscoverData> {
  const [titles, clips, trailers] = await Promise.allSettled([
    fetchPublishedTitles(),
    fetchPublishedClips(),
    fetchDiscoverTrailers(4),
  ]);
  if (titles.status === 'rejected') console.warn('Cinema titles unavailable in Discover', titles.reason);
  if (clips.status === 'rejected') console.warn('Cinema publisher clips unavailable in Discover', clips.reason);
  if (trailers.status === 'rejected') console.warn('Cinema official trailer discovery unavailable', trailers.reason);
  return {
    titles: titles.status === 'fulfilled' ? titles.value : [],
    clips: clips.status === 'fulfilled' ? clips.value : [],
    trailers: trailers.status === 'fulfilled' ? trailers.value : [],
  };
}

export function DiscoverPage() {
  const { data, error, reload } = useAsyncData(loadDiscover, []);
  const [tab, setTab] = useState<FeedTab>('for-you');
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoSource | null>(null);
  const { notify } = useToast();

  const shorts = useMemo(() => (data?.clips ?? []).filter((clip) => clip.kind === 'short'), [data]);
  const videos = useMemo<VideoTileData[]>(() => {
    if (!data) return [];
    const publisherClips: VideoTileData[] = data.clips
      .filter((clip) => clip.kind !== 'short')
      .map((clip) => ({
        id: `clip-${clip.id}`,
        heading: clip.headline,
        publisher: clip.publisher_name || 'Cinema publisher',
        image: clip.poster_url,
        description: clip.description,
        kind: clip.kind === 'trailer' ? 'Publisher trailer' : 'Publisher feature',
        href: clip.title ? `/title/${clip.title.id}` : null,
        source: { url: clip.video_url, label: clip.headline, heading: clip.headline },
      }));
    const titleTrailers: VideoTileData[] = data.titles
      .filter((title) => Boolean(title.trailer_url?.trim()))
      .map((title) => ({
        id: `title-${title.id}`,
        heading: `${title.title} · Official trailer`,
        publisher: title.publisher || 'Official publisher',
        image: title.backdrop_url || title.poster_url,
        description: title.synopsis,
        kind: 'Cinema catalogue trailer',
        href: `/title/${title.id}`,
        source: { url: title.trailer_url, label: `${title.title} trailer`, heading: `Trailer · ${title.title}` },
      }));
    const tmdbTrailers: VideoTileData[] = data.trailers.map((trailer) => ({
      id: `tmdb-${trailer.mediaType}-${trailer.id}`,
      heading: trailer.videoName || `${trailer.title} · Official trailer`,
      publisher: 'Official trailer',
      image: tmdbImageUrl(trailer.backdropPath, 'w780') || tmdbImageUrl(trailer.posterPath, 'w500'),
      description: trailer.overview,
      kind: trailer.mediaType === 'movie' ? 'Movie trailer' : 'Series trailer',
      href: tmdbHref(trailer),
      source: { url: `https://www.youtube.com/watch?v=${trailer.videoKey}`, label: `${trailer.title} official trailer`, heading: `Trailer · ${trailer.title}` },
    }));
    return [...publisherClips, ...titleTrailers, ...tmdbTrailers];
  }, [data]);

  const visibleVideos = useMemo(() => {
    if (tab === 'trailers') return videos.filter((video) => /trailer/i.test(video.kind));
    if (tab === 'clips') return videos.filter((video) => !/trailer/i.test(video.kind));
    return videos;
  }, [videos, tab]);

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
      if ((cause as { name?: string }).name !== 'AbortError') notify('Could not share this link.', 'error');
    }
  }

  if (!data) return <div className={PAGE_CONTAINER}>{error ? <ErrorState onRetry={reload} /> : <LoadingState label="Finding stories and videos" />}</div>;

  return (
    <div className={`${PAGE_CONTAINER} space-y-8 pb-14`}>
      <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-cinema-300"><Compass className="h-4 w-4" /> Explore the world of stories</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Discover</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">Official trailers, short videos, clips and entertainment worth your time. Find something interesting and move straight to its story.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/friends" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"><Users className="h-4 w-4" /> Friends</a>
          <a href="/watch-parties" className="inline-flex items-center gap-2 rounded-full bg-cinema-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cinema-400"><Sparkles className="h-4 w-4" /> Watch together</a>
        </div>
      </header>

      <div className="sticky top-16 z-20 -mx-4 border-b border-white/8 bg-ink-950/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Discover categories">
          {TABS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`${CHIP_BASE} shrink-0 ${chipClass(tab === item.id)}`}>{item.label}</button>)}
        </div>
      </div>

      {(tab === 'for-you' || tab === 'shorts') && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">Quick stories</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Shorts</h2><p className="mt-1 text-sm text-slate-400">Short-form videos from approved publishers and creators.</p></div>
            <span className="text-xs text-slate-500">{shorts.length} available</span>
          </div>
          {shorts.length ? <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">{shorts.map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActiveShort} />)}</div> : <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">No approved Shorts have been published yet. New clips will appear here when Cinema publishers make them available.</p>}
        </section>
      )}

      {(tab !== 'shorts') && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">Watch something</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">{tab === 'trailers' ? 'Trailers & first looks' : tab === 'clips' ? 'Clips & features' : 'Videos picked for discovery'}</h2></div>
            <span className="text-xs text-slate-500">{visibleVideos.length} videos</span>
          </div>
          {visibleVideos.length ? (
            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {visibleVideos.map((video) => (
                <article key={video.id} className="group min-w-0">
                  <button type="button" onClick={() => setActiveVideo(video.source)} className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-ink-800 text-left ring-1 ring-white/10 transition group-hover:ring-cinema-300/45">
                    <Artwork src={video.image} alt="" fallbackTitle={video.heading} className="h-full w-full transition duration-500 group-hover:scale-[1.035]" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">{video.kind}</span>
                    <span className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full border border-white/35 bg-black/35 text-white shadow-xl backdrop-blur transition group-hover:scale-110 group-hover:bg-cinema-500"><Play className="h-5 w-5 fill-current" /></span></span>
                  </button>
                  <div className="flex gap-3 pt-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cinema-300/20 bg-cinema-300/10 text-cinema-200"><Film className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-bold leading-5 text-white">{video.heading}</h3>
                      <p className="mt-1 text-xs text-slate-400">{video.publisher}</p>
                      {video.href && <a href={video.href} className="mt-2 inline-flex text-xs font-semibold text-cinema-200 hover:text-white">Explore title</a>}
                      {video.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{video.description}</p>}
                    </div>
                    <button type="button" aria-label={`Share ${video.heading}`} onClick={() => void shareItem(video.heading, video.href ? new URL(video.href, window.location.origin).toString() : window.location.href)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"><Share2 className="h-4 w-4" /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : <EmptyState icon={<Compass className="h-7 w-7 text-cinema-300" />} title="Nothing in this category yet" description="Official trailers and approved publisher videos will appear here as they become available." />}
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-bold text-white">Found something worth sharing?</p><p className="mt-1 text-sm text-slate-400">Send it to a friend or start a conversation around the story.</p></div>
        <a href="/friends" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-cinema-200 hover:text-white"><MessageCircle className="h-4 w-4" /> Go to your friends</a>
      </section>
      <TmdbAttribution />

      {activeShort && <ShortViewer clip={activeShort} onClose={() => setActiveShort(null)} />}
      {activeVideo && <VideoDialog {...activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
