import { useState, type ReactNode } from 'react';
import { Compass, Play } from 'lucide-react';
import { VideoCard } from '@/components/catalogue/VideoCard';
import { ClipCard } from '@/components/discover/ClipCard';
import { ShortCard } from '@/components/discover/ShortCard';
import { VideoDialog } from '@/components/player/VideoDialog';
import { titleTrailerSource, type VideoSource } from '@/lib/videoSource';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, CHIP_BASE, PAGE_CONTAINER, SECTION_HEADING, chipClass } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchPublishedClips, type DiscoverClip } from '@/lib/clips';
import { fetchPublishedTitles } from '@/lib/library';
import { publisherHref } from '@/lib/publishers';
import type { Title } from '@/lib/types';
import { fetchDiscoverTrailers, tmdbHref, tmdbImageUrl, type TmdbTrailer } from '@/lib/tmdb';

type DiscoverTab = 'all' | 'shorts' | 'trailers' | 'clips';

const TABS: { id: DiscoverTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'trailers', label: 'Trailers' },
  { id: 'clips', label: 'Clips' },
];

interface DiscoverData {
  titles: Title[];
  clips: DiscoverClip[];
  tmdbTrailers: TmdbTrailer[];
}

async function loadDiscover(): Promise<DiscoverData> {
  const [titles, clips, tmdbTrailers] = await Promise.all([
    fetchPublishedTitles(),
    fetchPublishedClips(),
    fetchDiscoverTrailers().catch(() => []),
  ]);
  return { titles, clips, tmdbTrailers };
}

function DiscoverSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className={SECTION_HEADING}>{heading}</h2>
      {children}
    </section>
  );
}

function EmptySection({ label }: { label: string }) {
  return <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No {label} published yet.</p>;
}

export function DiscoverPage() {
  const { data, error, reload } = useAsyncData(loadDiscover, []);
  const [tab, setTab] = useState<DiscoverTab>('all');
  const [activeVideo, setActiveVideo] = useState<VideoSource | null>(null);

  if (!data) {
    return <div className={PAGE_CONTAINER}>{error ? <ErrorState onRetry={reload} /> : <LoadingState />}</div>;
  }

  const featured = data.clips.find((clip) => clip.kind === 'featured') ?? null;
  const shorts = data.clips.filter((clip) => clip.kind === 'short');
  const clipTrailers = data.clips.filter((clip) => clip.kind === 'trailer');
  const titleTrailers = data.titles.filter((title) => title.trailer_url.trim() !== '');
  const clips = data.clips.filter((clip) => clip.kind === 'clip');
  const hasAnything = data.clips.length > 0 || titleTrailers.length > 0 || data.tmdbTrailers.length > 0;

  const openClip = (clip: DiscoverClip) =>
    setActiveVideo({ url: clip.video_url, label: clip.headline, heading: clip.headline });

  const trailerGrid = (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {clipTrailers.map((clip) => (
        <ClipCard key={`clip-${clip.id}`} clip={clip} onOpen={openClip} />
      ))}
      {titleTrailers.map((title) => (
        <VideoCard key={`title-${title.id}`} title={title} onTrailer={(item) => setActiveVideo(titleTrailerSource(item))} />
      ))}
      {data.tmdbTrailers.map((item) => (
        <article key={`tmdb-${item.mediaType}-${item.id}`} className="group flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setActiveVideo({ url: `https://www.youtube.com/watch?v=${item.videoKey}`, label: `${item.title} trailer`, heading: `Official trailer: ${item.title}` })}
            className="relative block aspect-video overflow-hidden rounded-2xl bg-ink-800 text-left ring-1 ring-white/10 transition hover:ring-cinema-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300"
            aria-label={`Play trailer for ${item.title}`}
          >
            <Artwork src={tmdbImageUrl(item.backdropPath, 'w780') || tmdbImageUrl(item.posterPath, 'w500')} alt="" fallbackTitle={item.title} className="h-full w-full" />
            <span className="absolute inset-0 grid place-items-center bg-ink-950/25"><span className="grid h-12 w-12 place-items-center rounded-full bg-cinema-500 text-white"><Play className="h-5 w-5 fill-current" /></span></span>
            <span className="absolute left-3 top-3 rounded-md bg-ink-950/85 px-2 py-1 text-[11px] font-semibold text-cinema-200">Official trailer</span>
          </button>
          <div className="space-y-1">
            <a href={tmdbHref(item)} className="line-clamp-2 text-sm font-semibold text-slate-100 hover:text-cinema-300">{item.title}</a>
            <p className="text-xs text-slate-400">{item.mediaType === 'movie' ? 'Movie' : 'Series'} · Trailer via YouTube</p>
          </div>
        </article>
      ))}
    </div>
  );

  const shortsRow = (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 [&::-webkit-scrollbar]:hidden">
      {shorts.map((clip) => (
        <ShortCard key={clip.id} clip={clip} onOpen={openClip} />
      ))}
    </div>
  );

  const clipGrid = (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} onOpen={openClip} />
      ))}
    </div>
  );

  return (
    <div className={`${PAGE_CONTAINER} space-y-10`}>
      <header className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cinema-300">
          <Compass className="h-4 w-4" /> Discover
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Trailers, shorts and clips</h1>
        <p className="max-w-2xl text-sm text-slate-400">Preview what is coming, watch short-form stories, and jump to the full title.</p>
      </header>

      {!hasAnything ? (
        <EmptyState
          icon={<Compass className="h-7 w-7 text-cinema-300" />}
          title="Nothing to discover yet"
          description="Trailers, shorts and clips will appear here once they are published."
        />
      ) : (
        <>
          <div className="sticky top-16 z-10 -mx-4 border-b border-white/5 bg-ink-950/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter discover content">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={`${CHIP_BASE} shrink-0 ${chipClass(tab === item.id)}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'all' && featured && (
            <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-ink-900">
              <div className="absolute inset-0">
                <Artwork src={featured.poster_url} alt="" fallbackTitle={featured.headline} className="h-full w-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/20" />
              </div>
              <div className="relative max-w-2xl space-y-4 p-6 sm:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cinema-300">Featured</p>
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{featured.headline}</h2>
                {featured.description && <p className="text-sm leading-relaxed text-slate-300">{featured.description}</p>}
                {featured.publisher_name && (
                  <a href={publisherHref(featured.publisher_name)} className="text-sm font-semibold text-slate-200 transition hover:text-cinema-300">
                    {featured.publisher_name}
                  </a>
                )}
                <div>
                  <button type="button" onClick={() => openClip(featured)} className={BUTTON_PRIMARY}>
                    <Play className="h-4 w-4 fill-current" /> Play
                  </button>
                </div>
              </div>
            </section>
          )}

          {tab === 'all' && (
            <>
              <DiscoverSection heading="Shorts">
                {shorts.length > 0 ? shortsRow : <EmptySection label="shorts" />}
              </DiscoverSection>
              <DiscoverSection heading="Trailers">
                {clipTrailers.length + titleTrailers.length + data.tmdbTrailers.length > 0 ? trailerGrid : <EmptySection label="trailers" />}
              </DiscoverSection>
              <DiscoverSection heading="Clips">
                {clips.length > 0 ? clipGrid : <EmptySection label="clips" />}
              </DiscoverSection>
            </>
          )}

          {tab === 'shorts' && (
            <DiscoverSection heading="Shorts">{shorts.length > 0 ? shortsRow : <EmptySection label="shorts" />}</DiscoverSection>
          )}
          {tab === 'trailers' && (
            <DiscoverSection heading="Trailers">{clipTrailers.length + titleTrailers.length > 0 ? trailerGrid : <EmptySection label="trailers" />}</DiscoverSection>
          )}
          {tab === 'clips' && (
            <DiscoverSection heading="Clips">{clips.length > 0 ? clipGrid : <EmptySection label="clips" />}</DiscoverSection>
          )}
        </>
      )}

      {activeVideo && <VideoDialog {...activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
