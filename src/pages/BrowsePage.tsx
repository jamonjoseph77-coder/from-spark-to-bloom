import { useMemo, useState } from 'react';
import { TitleGrid } from '@/components/catalogue/TitleGrid';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { CHIP_BASE, INPUT, LABEL, PAGE_CONTAINER, chipClass } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { genresOf, hasGenre, matchesQuery, SORT_LABELS, sortTitles, type SortOption } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';
import type { TitleType } from '@/lib/types';
import { Clapperboard, Radio, Trophy, Newspaper } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { CinemaCategoryNav } from '@/components/layout/CinemaCategoryNav';
import { CategoryCinemaFeed } from '@/components/catalogue/CategoryCinemaFeed';

type LocalBrowseKind = Exclude<TitleType, 'movie' | 'series'>;
const COPY: Record<LocalBrowseKind, { heading: string; intro: string; empty: string }> = {
  sport: { heading: 'Sports', intro: 'Matches, Highlights And Sports Programmes.', empty: 'Sports Fixtures, Highlights And Replays Will Appear Here When Verified Feeds And Publisher Content Are Connected.' },
  live: { heading: 'Live TV', intro: 'Television, Live Events And Programmes.', empty: 'Live Channels And Programme Schedules Will Appear Here When Broadcaster Feeds Are Connected.' },
  news: { heading: 'News', intro: 'News, Documentaries And Current Affairs.', empty: 'News Programmes Will Appear Here As Verified Publishers Make Them Available.' },
};
const ALL_GENRES = 'All';

export function BrowsePage({ kind }: { kind: LocalBrowseKind }) {
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, [kind]);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState(ALL_GENRES);
  const [sort, setSort] = useState<SortOption>('newest');
  const copy = COPY[kind];
  const ofType = useMemo(() => (titles ?? []).filter((title) => title.type === kind), [titles, kind]);
  const genres = useMemo(() => genresOf(ofType), [ofType]);
  const visible = useMemo(() => sortTitles(ofType.filter((title) => (genre === ALL_GENRES || hasGenre(title, genre)) && matchesQuery(title, query)), sort), [ofType, genre, query, sort]);

  const HeroIcon = kind === 'sport' ? Trophy : kind === 'live' ? Radio : Newspaper;
  const heroImage = ofType[0]?.backdrop_url || ofType[0]?.poster_url || '';

  return (
    <div className={`${PAGE_CONTAINER} cinema-browse-page space-y-8`}>
      <CinemaCategoryNav active={copy.heading} />
      <header className="cinema-category-live-hero relative isolate overflow-hidden rounded-[1.8rem] border border-sky-200/20 p-6 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-10 lg:p-12">
        {heroImage && <Artwork src={heroImage} alt="" fallbackTitle={copy.heading} className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="cinema-category-hero__orb cinema-category-hero__orb--one" aria-hidden="true" />
        <div className="cinema-category-hero__orb cinema-category-hero__orb--two" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.24em] text-sky-200"><HeroIcon className="h-4 w-4" /> Cinema Destination · {copy.heading}</p>
          <h1 className="mt-5 text-4xl font-black tracking-[-.04em] text-white sm:text-6xl">{copy.heading}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/85 sm:text-base">{copy.intro}</p>
          <a href="/search" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#087cff] px-5 py-3 text-xs font-extrabold text-white shadow-[0_8px_26px_rgba(8,124,255,.25)] transition hover:bg-[#168cff]">Find More On Cinema</a>
        </div>
      </header>
      {!titles && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}
      {titles && ofType.length === 0 && <EmptyState icon={<Clapperboard className="h-7 w-7 text-cinema-300" />} title={`${copy.heading} Is Getting Ready`} description={copy.empty} />}
      {titles && ofType.length > 0 && <>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="w-full sm:w-72"><label htmlFor="browse-filter" className={LABEL}>Filter</label><input id="browse-filter" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Filter ${copy.heading.toLowerCase()}`} className={INPUT} /></div>
            <div className="w-full sm:w-52"><label htmlFor="browse-sort" className={LABEL}>Sort By</label><select id="browse-sort" value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className={INPUT}>{(Object.keys(SORT_LABELS) as SortOption[]).map((option) => <option key={option} value={option}>{SORT_LABELS[option]}</option>)}</select></div>
          </div>
        </div>
        {genres.length > 0 && <div className="flex flex-wrap gap-2" role="group" aria-label="Genres">{[ALL_GENRES, ...genres].map((item) => <button key={item} type="button" aria-pressed={genre === item} onClick={() => setGenre(item)} className={`${CHIP_BASE} ${chipClass(genre === item)}`}>{item}</button>)}</div>}
        {visible.length === 0 ? <p className="rounded-2xl border border-white/10 bg-ink-850/60 p-8 text-center text-sm text-slate-400">Nothing Matches Those Filters. Try A Different Genre Or Clear The Search.</p> : <><p className="text-sm text-slate-500">{visible.length} {visible.length === 1 ? 'title' : 'titles'}</p><TitleGrid titles={visible} /></>}
      </>}
      <CategoryCinemaFeed category={kind} label={copy.heading} />
    </div>
  );
}
