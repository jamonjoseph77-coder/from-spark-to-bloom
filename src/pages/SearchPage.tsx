import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search as SearchIcon, Compass, MessageSquareText, Users, Clapperboard, Megaphone, Sparkles } from 'lucide-react';
import { TitleGrid } from '@/components/catalogue/TitleGrid';
import { TmdbSearchResults } from '@/components/tmdb/TmdbSearchResults';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, INPUT, PAGE_CONTAINER, LABEL } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { genresOf, matchesQuery } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';
import { navigateTo } from '@/lib/router';
const destinations = [
 { href:'/discover', label:'Discover', detail:'Trailers, Shorts and new releases', icon:Compass },
 { href:'/letterbox', label:'Letterbox', detail:'Entertainment conversations', icon:MessageSquareText },
 { href:'/friends', label:'Friends', detail:'Find people and recommendations', icon:Users },
 { href:'/publishers', label:'Studios & Publishers', detail:'Explore official industry profiles', icon:Megaphone },
 { href:'/my-cinema', label:'My Cinema', detail:'Your saved entertainment', icon:Clapperboard },
];
export function SearchPage({ query }: { query: string }) {
 const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
 const [draft, setDraft] = useState(query);
 useEffect(() => { setDraft(query); }, [query]);
 const results = useMemo(() => (titles ?? []).filter((title) => matchesQuery(title, query)), [titles, query]);
 const suggestions = useMemo(() => genresOf(titles ?? []).slice(0, 10), [titles]);
 const trimmed = query.trim();
 function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); navigateTo(`/search?q=${encodeURIComponent(draft.trim())}`); }
 return <div className={`${PAGE_CONTAINER} space-y-9 pb-12`}>
  <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/15 bg-gradient-to-br from-cinema-700/25 via-ink-900 to-ink-950 p-6 sm:p-9">
   <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cinema-200"><Sparkles className="h-4 w-4" /> Find your next experience</p><h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Search Cinema</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Explore movies, series, sports, publishers and the stories people are talking about.</p>
   <form onSubmit={handleSubmit} role="search" className="mt-6 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><label htmlFor="search-page-input" className="sr-only">Search Cinema</label><input id="search-page-input" type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search titles, genres, people, studios..." className={`${INPUT} py-4 pl-11 text-base`} /></div><button type="submit" className={`${BUTTON_PRIMARY} sm:min-w-32`}>Search</button></form>
  </header>
  {!titles && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}
  {titles && !trimmed && <section className="space-y-5"><p className={LABEL}>Explore Cinema</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{destinations.map(({href,label,detail,icon:Icon}) => <a key={href} href={href} className="group rounded-2xl border border-white/10 bg-ink-900/80 p-4 transition hover:-translate-y-1 hover:border-cinema-400/35"><span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-cinema-500/15 text-cinema-200"><Icon className="h-5 w-5" /></span><span className="block font-bold text-white">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{detail}</span></a>)}</div><div className="space-y-3"><p className={LABEL}>Browse by genre</p>{suggestions.length ? <div className="flex flex-wrap gap-2">{suggestions.map((genre) => <a key={genre} href={`/search?q=${encodeURIComponent(genre)}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cinema-400/40 hover:text-white">{genre}</a>)}</div> : <p className="text-sm text-slate-400">Genres will appear as titles are published.</p>}</div></section>}
  {titles && trimmed && <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-slate-400">{results.length} Cinema {results.length === 1 ? 'title' : 'titles'} matching <span className="font-semibold text-slate-200">“{trimmed}”</span></p><a href="/discover" className="text-sm font-semibold text-cinema-300 hover:text-white">Explore Discover</a></div>{results.length ? <TitleGrid titles={results} /> : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No published Cinema titles match that search. Try another title, genre or publisher name.</p>}</section>}
  {trimmed && <section className="space-y-6"><p className={LABEL}>More to discover</p><TmdbSearchResults query={trimmed} /></section>}
 </div>;
}
