import { useCallback, useEffect, useState } from 'react';
import { Film } from 'lucide-react';
import { TrailerCard } from '@/components/discover/TrailerCard';
import { TrailerDialog } from '@/components/discover/TrailerDialog';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_SECONDARY, CHIP_BASE, SECTION_HEADING, chipClass } from '@/components/ui/styles';
import { fetchTrailerFeed, TmdbError, type TmdbTrailerItem, type TrailerMediaFilter, type TrailerSource } from '@/lib/tmdb';
import type { PromoKind } from '@/lib/trailerSelection';

const SOURCES: { id: TrailerSource; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'upcoming', label: 'Coming soon' },
  { id: 'popular', label: 'Popular' },
];
const MEDIA: { id: TrailerMediaFilter; label: string }[] = [
  { id: 'all', label: 'Movies and series' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'Series' },
];
const KINDS: { id: PromoKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All official videos' },
  { id: 'trailer', label: 'Trailers' },
  { id: 'teaser', label: 'Teasers' },
  { id: 'clip', label: 'Official clips' },
];

type Status = 'loading' | 'ready' | 'error' | 'unavailable';

function Chips<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (id: T) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.id} type="button" aria-pressed={value === option.id} onClick={() => onChange(option.id)} className={`${CHIP_BASE} shrink-0 ${chipClass(value === option.id)}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Official promotional videos only, sourced through the approved trailer feed. */
export function OfficialTrailers({ limit, onSeeAll }: { limit?: number; onSeeAll?: () => void }) {
  const preview = limit !== undefined;
  const [source, setSource] = useState<TrailerSource>('trending');
  const [media, setMedia] = useState<TrailerMediaFilter>('all');
  const [kind, setKind] = useState<PromoKind | 'all'>('all');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TmdbTrailerItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<Status>('loading');
  const [retry, setRetry] = useState(0);
  const [active, setActive] = useState<TmdbTrailerItem | null>(null);

  useEffect(() => {
    let current = true;
    setStatus((previous) => (page === 1 ? 'loading' : previous));
    fetchTrailerFeed(source, media, page)
      .then((result) => {
        if (!current) return;
        setItems((previous) => {
          if (page === 1) return result.items;
          const seen = new Set(previous.map((entry) => `${entry.mediaType}:${entry.id}`));
          return [...previous, ...result.items.filter((entry) => !seen.has(`${entry.mediaType}:${entry.id}`))];
        });
        setHasMore(result.hasMore);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (current) setStatus(error instanceof TmdbError && error.reason === 'not_configured' ? 'unavailable' : 'error');
      });
    return () => { current = false; };
  }, [source, media, page, retry]);

  const reset = useCallback(() => {
    setPage(1);
    setItems([]);
    setStatus('loading');
  }, []);

  const visible = items.filter((entry) => kind === 'all' || entry.video.kind === kind);
  const shown = preview ? visible.slice(0, limit) : visible;

  if (status === 'unavailable') {
    return preview ? null : <EmptyState icon={<Film className="h-7 w-7 text-cinema-300" />} title="Official trailers are on their way" description="Official studio and publisher previews will appear here when the trailer feed is configured." />;
  }

  return (
    <section className="space-y-6" aria-label="Official trailers">
      {preview && <h2 className={SECTION_HEADING}>Official trailers</h2>}
      {!preview && (
        <div className="space-y-3">
          <Chips label="Trailer list" value={source} options={SOURCES} onChange={(id) => { setSource(id); reset(); }} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Chips label="Type of title" value={media} options={MEDIA} onChange={(id) => { setMedia(id); reset(); }} />
            <Chips label="Type of official video" value={kind} options={KINDS} onChange={setKind} />
          </div>
        </div>
      )}
      {status === 'loading' && <LoadingState label="Finding official trailers" />}
      {status === 'error' && items.length === 0 && <ErrorState onRetry={() => { setStatus('loading'); setRetry((value) => value + 1); }} />}
      {status === 'ready' && shown.length === 0 && <EmptyState icon={<Film className="h-7 w-7 text-cinema-300" />} title="No official previews match these filters" description="Try another list or title type. Not every title has an official preview yet." action={<button type="button" onClick={() => { setKind('all'); setMedia('all'); reset(); }} className={BUTTON_SECONDARY}>Reset filters</button>} />}
      {shown.length > 0 && <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{shown.map((entry) => <TrailerCard key={`${entry.mediaType}-${entry.id}`} item={entry} onPlay={setActive} />)}</div>}
      {preview && onSeeAll && shown.length > 0 && <button type="button" onClick={onSeeAll} className={BUTTON_SECONDARY}>See all trailers</button>}
      {!preview && status === 'ready' && hasMore && <div className="flex justify-center"><button type="button" onClick={() => setPage((value) => value + 1)} className={BUTTON_SECONDARY}>Show more</button></div>}
      {active && <TrailerDialog item={active} video={active.video} onClose={() => setActive(null)} />}
    </section>
  );
}
