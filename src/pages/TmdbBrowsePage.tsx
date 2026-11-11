import { useEffect, useState } from 'react';
import { ArrowRight, Search as SearchIcon, Star } from 'lucide-react';
import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import { TmdbCard } from '@/components/tmdb/TmdbCard';
import { TmdbErrorState } from '@/components/tmdb/TmdbErrorState';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState, LoadingState } from '@/components/ui/StatusViews';
import { CHIP_BASE, INPUT, LABEL, PAGE_CONTAINER, chipClass } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchTmdbGenres, fetchTmdbList, searchTmdb, tmdbImageUrl, tmdbYear, type TmdbListKind, type TmdbMediaType } from '@/lib/tmdb';
import { Clapperboard } from 'lucide-react';
import { CinemaCategoryNav } from '@/components/layout/CinemaCategoryNav';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { fetchPublishedTitles } from '@/lib/library';
import { canonicalCinemaHref } from '@/lib/canonicalTitle';
import { CategoryCinemaFeed } from '@/components/catalogue/CategoryCinemaFeed';
import { CinemaSeasonalSpotlight } from '@/components/catalogue/CinemaSeasonalSpotlight';
import { YourNextWatch } from '@/components/catalogue/YourNextWatch';

const MODE_LABELS: Record<TmdbListKind, string> = { popular: 'Popular', trending: 'Trending this week' };
const SEARCH_DEBOUNCE_MS = 350;

export function TmdbBrowsePage({ mediaType }: { mediaType: TmdbMediaType }) {
  const heading = mediaType === 'movie' ? 'Movies' : 'Series';
  const [mode, setMode] = useState<TmdbListKind>('popular');
  const [genreId, setGenreId] = useState(0);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(draft.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const genres = useAsyncData(() => fetchTmdbGenres(mediaType), [mediaType]);
  const localTitles = useAsyncData(fetchPublishedTitles, []);
  const items = useAsyncData(
    () => (query ? searchTmdb(mediaType, query) : fetchTmdbList(mediaType, mode, genreId)),
    [mediaType, mode, genreId, query],
  );

  function selectMode(next: TmdbListKind) {
    setMode(next);
    setGenreId(0);
  }

  const featured = items.data?.[0];
  const featuredImage = featured
    ? tmdbImageUrl(featured.backdropPath, 'w1280') || tmdbImageUrl(featured.posterPath, 'w500')
    : '';

  return (
    <div className={`${PAGE_CONTAINER} space-y-8 pb-12`}>
      <CinemaCategoryNav active={heading} />
      <header className="cinema-category-live-hero relative isolate flex min-h-[13rem] flex-col justify-center gap-3 overflow-hidden rounded-[1.7rem] border border-sky-200/15 p-6 shadow-[0_24px_70px_rgba(0,0,0,.3)] sm:min-h-[16rem] sm:p-8">
        {featuredImage && <Artwork src={featuredImage} alt="" fallbackTitle={heading} className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[.38]" />}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#05080e]/90 via-[#05080e]/68 to-[#05080e]/38" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#05080e]/65 via-transparent to-[#05080e]/20" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-cinema-200">Explore Cinema</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">{heading}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/90 sm:text-base">Explore real titles, discover official trailers and find the stories you want to experience. Availability to watch on Cinema depends on distribution rights.</p>
        </div>
      </header>

      <YourNextWatch titleTypes={[mediaType === 'movie' ? 'movie' : 'series']} categoryLabel={heading} fallbackMediaType={mediaType} fallbackGenreId={genreId || undefined} />
      <CinemaSeasonalSpotlight categoryLabel={heading} mediaType={mediaType} genreId={genreId || undefined} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full sm:w-96">
          <label htmlFor="tmdb-browse-search" className={LABEL}>Search {heading}</label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input id="tmdb-browse-search" type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Search ${heading.toLowerCase()}`} className={`${INPUT} pl-11`} />
          </div>
        </div>
        {!query && <div className="flex flex-wrap gap-2" role="group" aria-label="Browse mode">{(Object.keys(MODE_LABELS) as TmdbListKind[]).map((option) => <button key={option} type="button" aria-pressed={mode === option && genreId === 0} onClick={() => selectMode(option)} className={`${CHIP_BASE} ${chipClass(mode === option && genreId === 0)}`}>{MODE_LABELS[option]}</button>)}</div>}
      </div>

      {!query && genres.data && genres.data.length > 0 && <div className="flex flex-wrap gap-2" role="group" aria-label="Genres">{[{ id: 0, name: 'All genres' }, ...genres.data].map((genre) => <button key={genre.id} type="button" aria-pressed={genreId === genre.id} onClick={() => setGenreId(genre.id)} className={`${CHIP_BASE} ${chipClass(genreId === genre.id)}`}>{genre.name}</button>)}</div>}

      {items.loading && <LoadingState label={`Finding ${heading.toLowerCase()}`} />}
      {!items.loading && items.error && <TmdbErrorState error={items.error} onRetry={items.reload} />}
      {!items.loading && !items.error && items.data && items.data.length === 0 && <EmptyState icon={<Clapperboard className="h-7 w-7 text-cinema-300" />} title={query ? `No results for "${query}"` : `No ${heading.toLowerCase()} to show`} description="Try a different search or genre." />}

      {!items.loading && !items.error && items.data && items.data.length > 0 && <>
        {!query && featured && <a href={canonicalCinemaHref(featured, localTitles.data ?? [])} className="group cinema-category-live-hero relative isolate block min-h-[21rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-900 sm:min-h-[27rem]">
          <Artwork src={featuredImage} alt="" fallbackTitle={featured.title} className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-[1.02]" />
          <span className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <span className="relative z-10 flex min-h-[21rem] max-w-2xl flex-col justify-end p-6 sm:min-h-[27rem] sm:p-9">
            <span className="text-[10px] font-bold uppercase tracking-[.22em] text-cinema-200">Spotlight · {featured.mediaType === 'movie' ? 'Movie' : 'Series'}{tmdbYear(featured) ? ` · ${tmdbYear(featured)}` : ''}</span>
            <span className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">{featured.title}</span>
            {featured.overview && <span className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-slate-200">{featured.overview}</span>}
            <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-cinema-500 px-5 py-3 text-sm font-bold text-white transition group-hover:bg-cinema-400">Explore title <ArrowRight className="h-4 w-4" /></span>
            {featured.rating !== null && <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-bold text-amber-200 backdrop-blur"><Star className="h-3.5 w-3.5 fill-current" />{featured.rating.toFixed(1)}</span>}
          </span>
        </a>}
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-white">{query ? 'Search results' : mode === 'trending' ? 'Trending now' : 'Popular picks'}</h2><p className="mt-1 text-xs text-slate-500">{items.data.length} titles · Metadata and artwork supplied by TMDB</p></div></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {(query ? items.data : items.data.slice(1)).map((item) => <TmdbCard key={item.id} item={item} localTitles={localTitles.data ?? []} />)}
        </div>
      </>}

      {!query && <section className="space-y-10 border-t border-white/10 pt-8">
        <TmdbRow heading={mediaType === 'movie' ? 'Trending Movies' : 'Trending Series'} description="Stories gaining attention across Cinema's discovery catalogue." mediaType={mediaType} list="trending" />
        <TmdbRow heading={mediaType === 'movie' ? 'Popular Movies' : 'Popular Series'} description="More titles to explore and add to your Cinema journey." mediaType={mediaType} list="popular" />
      </section>}
      <CategoryCinemaFeed category={mediaType === 'movie' ? 'movie' : 'series'} label={heading} />
      <TmdbAttribution />
    </div>
  );
}
