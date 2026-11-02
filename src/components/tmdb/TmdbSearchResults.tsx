import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import { TmdbCard } from '@/components/tmdb/TmdbCard';
import { TmdbErrorState } from '@/components/tmdb/TmdbErrorState';
import { LoadingState } from '@/components/ui/StatusViews';
import { SECTION_HEADING } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { searchTmdb, type TmdbItem, type TmdbMediaType } from '@/lib/tmdb';

function ResultGroup({ heading, items }: { heading: string; items: TmdbItem[] }) {
  return (
    <section className="space-y-5">
      <h2 className={SECTION_HEADING}>{heading}</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => <TmdbCard key={`${item.mediaType}-${item.id}`} item={item} />)}
      </div>
    </section>
  );
}

export function TmdbSearchResults({ query }: { query: string }) {
  const { data, error, loading, reload } = useAsyncData(
    async () => Promise.all((['movie', 'tv'] as TmdbMediaType[]).map(async (type) => {
      try {
        return { type, items: await searchTmdb(type, query), error: null as Error | null };
      } catch (reason) {
        return { type, items: [] as TmdbItem[], error: reason instanceof Error ? reason : new Error('Search request failed.') };
      }
    })),
    [query],
  );

  if (loading) return <LoadingState label="Searching movies and series" />;
  if (error) return <TmdbErrorState error={error} onRetry={reload} />;
  if (!data) return null;

  const movies = data.find((group) => group.type === 'movie');
  const series = data.find((group) => group.type === 'tv');
  const failures = data.filter((group) => group.error);
  if (failures.length === data.length) {
    return <TmdbErrorState error={failures[0].error ?? new Error('Search is temporarily unavailable.')} onRetry={reload} />;
  }

  const movieItems = movies?.items ?? [];
  const seriesItems = series?.items ?? [];
  return (
    <div className="space-y-8">
      {failures.length > 0 && (
        <p role="status" className="rounded-xl border border-amber-300/15 bg-amber-300/[.05] px-4 py-3 text-xs leading-5 text-amber-100/80">
          Some discovery results are temporarily unavailable. Results from the available source are still shown.
        </p>
      )}
      {movieItems.length > 0 && <ResultGroup heading="Movies" items={movieItems} />}
      {seriesItems.length > 0 && <ResultGroup heading="Series" items={seriesItems} />}
      {movieItems.length === 0 && seriesItems.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-ink-850/60 p-8 text-center text-sm text-slate-400">
          No movies or series match &quot;{query}&quot;.
        </p>
      )}
      {(movieItems.length > 0 || seriesItems.length > 0) && <TmdbAttribution />}
    </div>
  );
}
