import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, Clapperboard, Tv, Trophy, Compass, MessageSquareText, Users, PartyPopper } from 'lucide-react';
import { ContinueWatchingRow } from '@/components/catalogue/ContinueWatchingRow';
import { HeroBanner } from '@/components/catalogue/HeroBanner';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { TmdbHero } from '@/components/tmdb/TmdbHero';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { comingSoonTitles, featuredTitles, progressRatioByTitle, resumeItems, titlesOfType, genresOf, hasGenre } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';

const headlines = [
 'Experience the world of stories.',
 'Find your next favourite story.',
 'The stories you love, all together.',
 'Discover what everyone will be talking about.',
];
function SeeAll({ href, label }: { href: string; label: string }) {
 return <a href={href} className="whitespace-nowrap text-sm font-semibold text-cinema-300 transition hover:text-white">{label}</a>;
}
const destinations = [
 { href: '/movies', label: 'Movies', detail: 'Feature films and new stories', icon: Clapperboard },
 { href: '/series', label: 'Series', detail: 'Stories to follow episode by episode', icon: Tv },
 { href: '/sports', label: 'Sports', detail: 'Events, highlights and replays', icon: Trophy },
 { href: '/discover', label: 'Discover', detail: 'Trailers, clips and what is next', icon: Compass },
];
export function HomePage() {
 const { user } = useAuth();
 const { progress } = useLibrary();
 const [headlineIndex, setHeadlineIndex] = useState(0);
 useEffect(() => {
  const timer = window.setInterval(() => setHeadlineIndex((current) => (current + 1) % headlines.length), 6500);
  return () => window.clearInterval(timer);
 }, []);
 const { data: titles, error, reload } = useAsyncData(() => fetchPublishedTitles().catch((cause) => { console.warn('Cinema catalogue is temporarily unavailable', cause); return []; }), []);
 const view = useMemo(() => {
  if (!titles) return null;
  const featured = featuredTitles(titles);
  const genres = genresOf(titles).slice(0, 4);
  return {
   hero: (featured.length > 0 ? featured : titles).slice(0, 5), recent: titles.slice(0, 12),
   upcoming: comingSoonTitles(titles), movies: titlesOfType(titles, 'movie'), series: titlesOfType(titles, 'series'),
   live: titlesOfType(titles, 'live'), sports: titlesOfType(titles, 'sport'), news: titlesOfType(titles, 'news'),
   resume: resumeItems(progress, titles), ratios: progressRatioByTitle(progress),
   genreShelves: genres.map((genre) => ({ genre, titles: titles.filter((title) => hasGenre(title, genre)).slice(0, 10) })),
  };
 }, [titles, progress]);
 if (!view) return <div className={PAGE_CONTAINER}>{error ? <ErrorState onRetry={reload} /> : <LoadingState />}</div>;
 return (
  <div className={`${PAGE_CONTAINER} space-y-12 pb-12 sm:space-y-16`}>
   <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/15 bg-gradient-to-br from-cinema-700/25 via-ink-900 to-ink-950 p-6 shadow-2xl shadow-black/20 sm:p-8">
    <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-cinema-400/15 blur-3xl" />
    <div className="flex flex-wrap items-end justify-between gap-5">
     <div className="max-w-3xl"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-cinema-200">Your digital entertainment home</p><h1 key={headlineIndex} aria-live="polite" className="mt-3 min-h-[2.3em] animate-rise-in text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">{headlines[headlineIndex]}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Discover movies, series, live television and the moments worth sharing.</p></div>
     <a href="/discover" className="inline-flex items-center gap-2 rounded-full border border-cinema-300/30 bg-cinema-500/15 px-4 py-2.5 text-sm font-bold text-cinema-100 transition hover:bg-cinema-500/25">Explore Discover <Compass className="h-4 w-4" /></a>
    </div>
    <div className="mt-6 flex flex-wrap gap-2"><a href="/letterbox" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/15"><MessageSquareText className="h-4 w-4" /> Letterbox</a><a href="/friends" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/15"><Users className="h-4 w-4" /> Friends</a><a href="/watch-parties" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/15"><PartyPopper className="h-4 w-4" /> Watch Parties</a></div>
   </header>
   {view.hero.length > 0 ? <HeroBanner titles={view.hero} /> : <TmdbHero />}
   {!user && <div className="flex flex-col gap-4 rounded-2xl border border-cinema-400/20 bg-gradient-to-r from-cinema-700/20 to-ink-850 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-200">Sign in to build your watchlist, save favourites and pick up where you left off.</p><a href="/sign-in" className={`${BUTTON_PRIMARY} shrink-0 px-4 py-2.5`}>Sign in</a></div>}
   <section className="space-y-5"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cinema-300">Your Cinema</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">Where would you like to go?</h2></div><SeeAll href="/search" label="Search Cinema" /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{destinations.map(({ href, label, detail, icon: Icon }) => <a key={href} href={href} className="group relative isolate overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800 via-ink-850 to-ink-950 p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-cinema-300/40 hover:shadow-cinema-950/30"><span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-cinema-300/15 bg-gradient-to-br from-cinema-400/20 to-indigo-500/10 text-cinema-200 shadow-inner"><Icon className="h-5 w-5" /></span><span className="block font-bold text-white group-hover:text-cinema-200">{label}</span><span className="mt-1 block text-sm text-slate-400">{detail}</span></a>)}</div></section>
   <ContinueWatchingRow items={view.resume} />
   <TitleRow heading="Coming soon" description="Stories on the horizon." titles={view.upcoming} />
   <TitleRow heading="Recently added" description="Fresh additions to Cinema." titles={view.recent} progressById={view.ratios} />
   <TitleRow heading="Movies" titles={view.movies} progressById={view.ratios} action={<SeeAll href="/movies" label="Explore movies" />} />
   <TitleRow heading="Series" titles={view.series} progressById={view.ratios} action={<SeeAll href="/series" label="Explore series" />} />
   <TitleRow heading="Live TV" titles={view.live} landscape action={<SeeAll href="/live-tv" label="View Live TV" />} />
   <TitleRow heading="Sports" titles={view.sports} landscape action={<SeeAll href="/sports" label="Explore sports" />} />
   <TitleRow heading="News and current affairs" titles={view.news} action={<SeeAll href="/news" label="Explore news" />} />
   {view.genreShelves.map(({ genre, titles }) => <TitleRow key={genre} heading={genre} titles={titles} />)}
   <TmdbRow heading="Trending movies" description="Stories audiences are exploring right now." mediaType="movie" list="trending" action={<SeeAll href="/movies" label="See all" />} />
   <TmdbRow heading="Popular movies" description="Popular films worth discovering." mediaType="movie" list="popular" action={<SeeAll href="/movies" label="See all" />} />
   <TmdbRow heading="Trending series" description="Series creating a buzz." mediaType="tv" list="trending" action={<SeeAll href="/series" label="See all" />} />
   <TmdbRow heading="Popular series" description="More series to explore." mediaType="tv" list="popular" action={<SeeAll href="/series" label="See all" />} />
   <a href="/search" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-850/60 p-5 text-sm text-slate-400 transition hover:border-cinema-400/40 hover:text-slate-200"><SearchIcon className="h-4 w-4 text-cinema-300" /> Looking for something specific? Search the whole catalogue.</a>
  </div>
 );
}
