import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search as SearchIcon, Compass, Users, Clapperboard, Megaphone, Sparkles, BadgeCheck, Building2, Film, ArrowUpRight, X } from 'lucide-react';
import { TitleGrid } from '@/components/catalogue/TitleGrid';
import { TmdbSearchResults } from '@/components/tmdb/TmdbSearchResults';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { INPUT, PAGE_CONTAINER, LABEL, chipClass, CHIP_BASE } from '@/components/ui/styles';
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
  { href: '/discover', label: 'Discover', detail: 'Trailers, Shorts And New Releases', icon: Compass, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=82' }
  { href: '/friends', label: 'Friends', detail: 'Find People And Recommendations', icon: Users, image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=82' }
  { href: '/publishers', label: 'Studios', detail: 'Explore Official Industry Profiles', icon: Megaphone, image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&q=82' }
  { href: '/my-cinema', label: 'My Cinema', detail: 'Your Saved Entertainment', icon: Clapperboard, image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900&q=82' }
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
        if (!matches.has(key)) matches.set(key, { name: studio.studio_name, titles: [], upcoming: [], trailers: [] });
      });
    return [...matches.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [publishers, query, verifiedStudios]);
  const verifiedNames = useMemo(() => new Set((verifiedStudios ?? []).map((studio) => studio.studio_name.trim().toLowerCase())), [verifiedStudios]);
  const suggestions = useMemo(() => genresOf(titles ?? []).slice(0, 10), [titles]);
  const trimmed = query.trim();

  function clearSearch() {
    setDraft('');
    if (query.trim()) navigateTo('/search');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = draft.trim();
    if (!nextQuery) { navigateTo("/search"); return; }
    navigateTo(`/search?q=${encodeURIComponent(nextQuery)}`);
  }

  return (
    <div className={`${PAGE_CONTAINER} cinema-search-page space-y-9 pb-12`}>
      <header className="cinema-search-hero relative isolate overflow-hidden rounded-[2rem] border border-white/10 p-6 shadow-xl shadow-black/25 sm:p-9">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-white/[.035] blur-3xl" />
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cinema-200"><Sparkles aria-hidden="true" className="h-4 w-4" /> Find Your Next Experience</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Search The World Of Stories.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Find Movies, Series, Genres And The Studios Behind The Stories — All Connected To The Cinema Experience.</p>
        <form onSubmit={handleSubmit} role="search" className="mt-6">
          <div className="group relative flex items-center rounded-full border border-white/15 bg-[#090d0b]/90 p-1.5 shadow-inner shadow-black/20 transition focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/[.06]">
            <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="search-page-input" className="sr-only">Search Cinema</label>
            <input
              id="search-page-input"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') clearSearch();
              }}
              placeholder="Search Titles, Genres, Studios Or Publishers..."
              autoComplete="off"
              enterKeyHint="search"
              className={`${INPUT} !rounded-full !border-0 !bg-transparent py-4 pl-11 pr-12 text-base shadow-none focus:!ring-0`}
            />
            {draft && (
              <button type="button" onClick={clearSearch} aria-label="Clear Search" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
            <button type="submit" aria-label="Search Cinema" className="ml-1 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-sky-200/45 bg-gradient-to-r from-sky-500 via-cyan-500 to-cinema-500 px-5 text-sm font-extrabold text-white shadow-lg shadow-sky-950/40 transition hover:brightness-110 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
              <SearchIcon aria-hidden="true" className="h-4 w-4" />
              Search
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-slate-400">Search Movies, Series, Genres And Official Studios In One Place.</p>
      </header>

      {!titles && !trimmed && (error ? <ErrorState onRetry={reload} /> : <LoadingState label="Loading Cinema Catalogue" />)}
      {!titles && trimmed && error && <div className="rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-4 text-sm text-amber-100/80">Cinema Catalogue Results Could Not Be Loaded. External Movie And Series Search Is Still Available Below. <button type="button" onClick={reload} className="ml-2 font-bold underline">Try Again</button></div>}

      {titles && !trimmed && (
        <section className="space-y-6">
          <div className="space-y-3">
            <p className={LABEL}>Explore Cinema</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {destinations.map(({ href, label, detail, icon: Icon, image }) => (
                <a key={href} href={href} className="cinema-search-destination group relative isolate flex min-h-40 flex-col overflow-hidden rounded-2xl border border-white/12 p-4 transition hover:-translate-y-1 hover:border-cinema-300/50">
                  <img src={image} alt="" loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover opacity-38 transition duration-700 group-hover:scale-105 group-hover:opacity-50" />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#070b12]/95 via-[#070b12]/68 to-[#070b12]/36" />
                  <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-black/40 text-cinema-100 shadow-lg backdrop-blur-sm"><Icon className="h-5 w-5" /></span>
                  <span className="block font-bold text-white">{label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{detail}</span>
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className={LABEL}>Browse By Genre</p>
            {suggestions.length ? <div className="flex flex-wrap gap-2">{suggestions.map((genre) => <a key={genre} href={`/search?q=${encodeURIComponent(genre)}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cinema-400/40 hover:text-white">{genre}</a>)}</div> : <p className="text-sm text-slate-400">Genres Will Appear As Titles Are Published.</p>}
          </div>
        </section>
      )}

      {titles && trimmed && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm text-slate-400">Search Results For <span className="font-semibold text-slate-100">“{trimmed}”</span></p><p className="mt-1 text-xs text-slate-500">{results.length} titles · {publisherResults.length} publisher profiles</p></div>
            <a href="/discover" className="text-sm font-semibold text-cinema-300 hover:text-white">Explore Discover</a>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Search Result Type">
            {scopes.map((item) => <button key={item.id} type="button" role="tab" aria-selected={scope === item.id} onClick={() => setScope(item.id)} className={`${CHIP_BASE} shrink-0 ${chipClass(scope === item.id)}`}>{item.label}</button>)}
          </div>
          {(scope === 'all' || scope === 'titles') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Film className="h-4 w-4 text-cinema-300" /><h2 className="text-lg font-extrabold text-white">Movies & Shows</h2></div>
              {results.length ? <TitleGrid titles={results} /> : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No Published Cinema Titles Match This Search.</p>}
            </div>
          )}
          {(scope === 'all' || scope === 'studios') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-cinema-300" /><h2 className="text-lg font-extrabold text-white">Studios & Publishers</h2></div>
              {publisherResults.length ? <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{publisherResults.map((publisher) => {
                const verified = verifiedNames.has(publisher.name.trim().toLowerCase());
                return <li key={publisher.name}><a href={publisherHref(publisher.name)} className="group flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/80 p-4 transition hover:border-cinema-400/35 hover:bg-ink-800"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cinema-500/15 text-lg font-black uppercase text-cinema-100">{publisher.name.slice(0, 1)}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-sm font-bold text-white">{publisher.name}</span>{verified && <BadgeCheck className="h-4 w-4 shrink-0 text-cinema-300" aria-label="Verified Studio" />}</span><span className="mt-1 block text-xs text-slate-400">{verified ? "Official Profile" : `${publisher.titles.length} Titles On Cinema`}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-cinema-200" /></a></li>;
              })}</ul> : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No Studio Or Publisher Profiles Match This Search.</p>}
            </div>
          )}
        </section>
      )}
      {trimmed && <section className="space-y-4"><div><p className={LABEL}>Search Across Movies & Series</p><p className="mt-1 text-xs text-slate-500">Cinema Catalogue Results Remain Available Above While Additional Discovery Results Load.</p></div><TmdbSearchResults query={trimmed} /></section>}
      <p className="text-xs leading-5 text-slate-500">Studio Verification Confirms An Official Organisation Presence On Cinema. It Does Not Mean Every Title In A Profile Is Licensed For Viewing.</p>
    </div>
  );
}
