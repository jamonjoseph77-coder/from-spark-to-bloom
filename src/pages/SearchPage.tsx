import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search as SearchIcon, Compass, MessageSquareText, Users, Clapperboard, Megaphone, Sparkles, BadgeCheck, Building2, Film, ArrowUpRight, X } from 'lucide-react';
import { TitleGrid } from '@/components/catalogue/TitleGrid';
import { TmdbSearchResults } from '@/components/tmdb/TmdbSearchResults';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, INPUT, PAGE_CONTAINER, LABEL, chipClass, CHIP_BASE } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { genresOf, matchesQuery } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';
import { navigateTo } from '@/lib/router';
import { groupByPublisher, publisherHref } from '@/lib/publishers';
import { fetchVerifiedStudios } from '@/lib/studios';

type SearchScope = 'all' | 'titles' | 'studios';
const scopes: { id: SearchScope; label: string }[] = [
  { id: 'all', label: 'All results' },
  { id: 'titles', label: 'Movies & Shows' },
  { id: 'studios', label: 'Studios & Publishers' },
];
const destinations = [
  { href: '/discover', label: 'Discover', detail: 'Trailers, Shorts and new releases', icon: Compass },
  { href: '/letterbox', label: 'Letterbox', detail: 'Entertainment conversations', icon: MessageSquareText },
  { href: '/friends', label: 'Friends', detail: 'Find people and recommendations', icon: Users },
  { href: '/publishers', label: 'Studios', detail: 'Explore official industry profiles', icon: Megaphone },
  { href: '/my-cinema', label: 'My Cinema', detail: 'Your saved entertainment', icon: Clapperboard },
];

export function SearchPage({ query }: { query: string }) {
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
  const { data: verifiedStudios } = useAsyncData(() => fetchVerifiedStudios().catch(() => []), []);
  const [draft, setDraft] = useState(query);
  const [scope, setScope] = useState<SearchScope>('all');
  useEffect(() => { setDraft(query); }, [query]);

  const results = useMemo(() => (titles ?? []).filter((title) => matchesQuery(title, query)), [titles, query]);
  const publishers = useMemo(() => groupByPublisher(titles ?? []), [titles]);
  const publisherResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const matches = new Map<string, (typeof publishers)[number]>();
    publishers
      .filter((publisher) => publisher.name.toLowerCase().includes(needle))
      .forEach((publisher) => matches.set(publisher.name.trim().toLowerCase(), publisher));
    (verifiedStudios ?? [])
      .filter((studio) => studio.studio_name.toLowerCase().includes(needle))
      .forEach((studio) => {
        const key = studio.studio_name.trim().toLowerCase();
        if (!matches.has(key)) matches.set(key, { name: studio.studio_name, titles: [] });
      });
    return [...matches.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [publishers, query, verifiedStudios]);
  const verifiedNames = useMemo(() => new Set((verifiedStudios ?? []).map((studio) => studio.studio_name.trim().toLowerCase())), [verifiedStudios]);
  const suggestions = useMemo(() => genresOf(titles ?? []).slice(0, 10), [titles]);
  const trimmed = query.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = draft.trim();
    if (!nextQuery) return;
    navigateTo(`/search?q=${encodeURIComponent(nextQuery)}`);
  }

  return (
    <div className={`${PAGE_CONTAINER} space-y-9 pb-12`}>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/15 bg-gradient-to-br from-cinema-700/25 via-ink-900 to-ink-950 p-6 shadow-xl shadow-black/20 sm:p-9">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-cinema-400/15 blur-3xl" />
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cinema-200"><Sparkles aria-hidden="true" className="h-4 w-4" /> Find Your Next Experience</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Search The World Of Stories.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Find Movies, Series, Genres And The Studios Behind The Stories — All Connected To The Cinema Experience.</p>
        <form onSubmit={handleSubmit} role="search" className="mt-6">
          <div className="group relative flex items-center rounded-full border border-white/15 bg-ink-850/90 p-1.5 shadow-inner shadow-black/20 transition focus-within:border-cinema-300/60 focus-within:ring-2 focus-within:ring-cinema-300/15">
            <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="search-page-input" className="sr-only">Search Cinema</label>
            <input
              id="search-page-input"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setDraft('');
              }}
              placeholder="Search Titles, Genres, Studios Or Publishers..."
              autoComplete="off"
              enterKeyHint="search"
              className={`${INPUT} !rounded-full !border-0 !bg-transparent py-4 pl-11 pr-12 text-base shadow-none focus:!ring-0`}
            />
            {draft && (
              <button
                type="button"
                onClick={() => setDraft('')}
                aria-label="Clear search"
                className="absolute right-[8.25rem] top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300 sm:right-[9rem]"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
          <button type="submit" disabled={!draft.trim()} aria-label="Search Cinema" className="ml-2 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-cinema-200/20 bg-cinema-500 px-5 text-sm font-bold text-white shadow-lg shadow-cinema-950/25 transition hover:bg-cinema-400 active:scale-[.98] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-slate-500">
            <SearchIcon aria-hidden="true" className="h-4 w-4" />
            Search
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-400">Search Movies, Series, Genres And Official Studios In One Place.</p>
      </header>

      {!titles && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}

      {titles && !trimmed && (
        <section className="space-y-6">
          <div className="space-y-3">
            <p className={LABEL}>Explore Cinema</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {destinations.map(({ href, label, detail, icon: Icon }) => (
                <a key={href} href={href} className="group rounded-2xl border border-white/10 bg-ink-900/80 p-4 transition hover:-translate-y-1 hover:border-cinema-400/35">
                  <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-cinema-500/15 text-cinema-200"><Icon className="h-5 w-5" /></span>
                  <span className="block font-bold text-white">{label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{detail}</span>
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className={LABEL}>Browse By Genre</p>
            {suggestions.length ? <div className="flex flex-wrap gap-2">{suggestions.map((genre) => <a key={genre} href={`/search?q=${encodeURIComponent(genre)}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cinema-400/40 hover:text-white">{genre}</a>)}</div> : <p className="text-sm text-slate-400">Genres will appear as titles are published.</p>}
          </div>
        </section>
      )}

      {titles && trimmed && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm text-slate-400">Search Results For <span className="font-semibold text-slate-100">“{trimmed}”</span></p><p className="mt-1 text-xs text-slate-500">{results.length} titles · {publisherResults.length} publisher profiles</p></div>
            <a href="/discover" className="text-sm font-semibold text-cinema-300 hover:text-white">Explore Discover</a>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Search result type">
            {scopes.map((item) => <button key={item.id} type="button" role="tab" aria-selected={scope === item.id} onClick={() => setScope(item.id)} className={`${CHIP_BASE} shrink-0 ${chipClass(scope === item.id)}`}>{item.label}</button>)}
          </div>
          {(scope === 'all' || scope === 'titles') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Film className="h-4 w-4 text-cinema-300" /><h2 className="text-lg font-extrabold text-white">Movies & shows</h2></div>
              {results.length ? <TitleGrid titles={results} /> : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No published Cinema titles match this search.</p>}
            </div>
          )}
          {(scope === 'all' || scope === 'studios') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-cinema-300" /><h2 className="text-lg font-extrabold text-white">Studios & publishers</h2></div>
              {publisherResults.length ? <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{publisherResults.map((publisher) => {
                const verified = verifiedNames.has(publisher.name.trim().toLowerCase());
                return <li key={publisher.name}><a href={publisherHref(publisher.name)} className="group flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/80 p-4 transition hover:border-cinema-400/35 hover:bg-ink-800"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cinema-500/15 text-lg font-black uppercase text-cinema-100">{publisher.name.slice(0, 1)}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-sm font-bold text-white">{publisher.name}</span>{verified && <BadgeCheck className="h-4 w-4 shrink-0 text-cinema-300" aria-label="Verified studio" />}</span><span className="mt-1 block text-xs text-slate-400">{verified ? "Official Profile" : `${publisher.titles.length} Titles On Cinema`}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-cinema-200" /></a></li>;
              })}</ul> : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No studio or publisher profiles match this search.</p>}
            </div>
          )}
          {(scope === 'all' || scope === 'titles') && <section className="space-y-6"><p className={LABEL}>More To Discover</p><TmdbSearchResults query={trimmed} /></section>}
        </section>
      )}
      <p className="text-xs leading-5 text-slate-500">Studio verification confirms an official organisation presence on Cinema. It does not mean every title in a profile is licensed for viewing.</p>
    </div>
  );
}
