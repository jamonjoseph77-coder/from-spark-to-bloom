import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, Clapperboard, Tv, Trophy, Compass, MessageSquareText, Users, PartyPopper, Megaphone, ChevronRight, Pause, Play } from 'lucide-react';
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
  'Your next favourite story starts here.',
  'The stories you love. The people you share them with.',
  'Discover what the world is watching.',
  'Every story has a world. Come explore.',
];

function SeeAll({ href, label }: { href: string; label: string }) {
  return <a href={href} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-cinema-300 transition hover:text-white">{label}<ChevronRight className="h-4 w-4" /></a>;
}

const destinations = [
  { href: '/movies', label: 'Movies', detail: 'Feature films and new stories', icon: Clapperboard },
  { href: '/series', label: 'Series', detail: 'Stories to follow episode by episode', icon: Tv },
  { href: '/sports', label: 'Sports', detail: 'Events, highlights and replays', icon: Trophy },
  { href: '/discover', label: 'Discover', detail: 'Trailers, clips and what is next', icon: Compass },
  { href: '/publishers', label: 'Studios', detail: 'Explore official story publishers', icon: Megaphone },
];

export function HomePage() {
  const { user } = useAuth();
  const { progress } = useLibrary();
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [headlinePaused, setHeadlinePaused] = useState(false);

  useEffect(() => {
    if (headlinePaused) return;
    const timer = window.setInterval(() => {
      setHeadlineIndex((current) => (current + 1) % headlines.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [headlinePaused]);

  const { data: titles, error, reload } = useAsyncData(
    () => fetchPublishedTitles().catch((cause) => {
      console.warn('Cinema catalogue is temporarily unavailable', cause);
      return [];
    }),
    [],
  );

  const view = useMemo(() => {
    if (!titles) return null;
    const featured = featuredTitles(titles);
    const genres = genresOf(titles).slice(0, 4);
    return {
      hero: (featured.length > 0 ? featured : titles).slice(0, 5),
      recent: titles.slice(0, 12),
      upcoming: comingSoonTitles(titles),
      movies: titlesOfType(titles, 'movie'),
      series: titlesOfType(titles, 'series'),
      live: titlesOfType(titles, 'live'),
      sports: titlesOfType(titles, 'sport'),
      news: titlesOfType(titles, 'news'),
      resume: resumeItems(progress, titles),
      ratios: progressRatioByTitle(progress),
      genreShelves: genres.map((genre) => ({
        genre,
        titles: titles.filter((title) => hasGenre(title, genre)).slice(0, 10),
      })),
    };
  }, [titles, progress]);

  if (!view) return <div className={PAGE_CONTAINER}>{error ? <ErrorState onRetry={reload} /> : <LoadingState />}</div>;

  return (
    <div className={`${PAGE_CONTAINER} space-y-12 pb-12 sm:space-y-16`}>
      <header
        className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cinema-500/25 via-ink-900 to-ink-950 p-6 shadow-2xl shadow-black/25 sm:p-9"
        onMouseEnter={() => setHeadlinePaused(true)}
        onMouseLeave={() => setHeadlinePaused(false)}
        onFocus={() => setHeadlinePaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeadlinePaused(false);
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-80 w-80 rounded-full bg-cinema-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 -z-10 h-64 w-64 rounded-full bg-blue-700/10 blur-3xl" />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-cinema-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cinema-300 shadow-[0_0_12px_rgba(96,165,250,0.9)]" />
              Your digital entertainment home
            </p>
            <h1 key={headlineIndex} aria-live="polite" className="mt-4 min-h-[2.25em] max-w-3xl animate-rise-in text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {headlines[headlineIndex]}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Discover movies, series, live television, sports and the people who make every story worth sharing.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="/discover" className={`${BUTTON_PRIMARY} rounded-full px-5 py-3`}>
                Explore Cinema <Compass className="h-4 w-4" />
              </a>
              <a href="/search" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-cinema-300/40 hover:bg-white/10">
                <SearchIcon className="h-4 w-4" /> Find a story
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-950/55 p-2 backdrop-blur">
            <div className="flex items-center gap-1.5 px-2" aria-label={`Headline ${headlineIndex + 1} of ${headlines.length}`}>
              {headlines.map((headline, index) => (
                <button
                  key={headline}
                  type="button"
                  onClick={() => setHeadlineIndex(index)}
                  aria-label={`Show headline ${index + 1}`}
                  aria-pressed={headlineIndex === index}
                  className={`h-1.5 rounded-full transition-all ${headlineIndex === index ? 'w-7 bg-cinema-300' : 'w-1.5 bg-white/35 hover:bg-white/70'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setHeadlinePaused((paused) => !paused)}
              aria-label={headlinePaused ? 'Resume headline rotation' : 'Pause headline rotation'}
              className="grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {headlinePaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-5">
          <a href="/friends" className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15"><Users className="h-4 w-4 text-cinema-200" /> Friends</a>
          <a href="/watch-parties" className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15"><PartyPopper className="h-4 w-4 text-cinema-200" /> Watch parties</a>
          <a href="/publishers" className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15"><Megaphone className="h-4 w-4 text-cinema-200" /> Studios & publishers</a>
        </div>
      </header>

      {view.hero.length > 0 ? <HeroBanner titles={view.hero} /> : <TmdbHero />}

      {!user && (
        <div className="flex flex-col gap-4 rounded-2xl border border-cinema-400/20 bg-gradient-to-r from-cinema-700/20 to-ink-850 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-200">Create your Cinema identity to save stories, build your watchlist and keep your viewing journey together.</p>
          <a href="/sign-in" className={`${BUTTON_PRIMARY} shrink-0 px-4 py-2.5`}>Sign in</a>
        </div>
      )}

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cinema-300">Explore</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">A world of entertainment.</h2></div>
          <SeeAll href="/search" label="Search Cinema" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {destinations.map(({ href, label, detail, icon: Icon }, index) => (
            <a key={href} href={href} className="group relative isolate overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800 via-ink-850 to-ink-950 p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-cinema-300/40 hover:shadow-cinema-950/30">
              <span className="absolute -right-6 -top-8 -z-10 h-24 w-24 rounded-full bg-cinema-400/0 blur-2xl transition group-hover:bg-cinema-400/15" />
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-cinema-300/15 bg-gradient-to-br from-cinema-400/20 to-blue-500/10 text-cinema-200 shadow-inner"><Icon className="h-5 w-5" /></span>
              <span className="block font-bold text-white transition group-hover:text-cinema-200">{label}</span>
              <span className="mt-1 block text-sm text-slate-400">{detail}</span>
              <span className="mt-4 flex items-center gap-1 text-xs font-bold text-cinema-300 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100">Explore <ChevronRight className="h-3.5 w-3.5" /></span>
            </a>
          ))}
        </div>
      </section>

      <ContinueWatchingRow items={view.resume} />
      <TitleRow heading="Coming soon" description="Stories on the horizon. Discover what is next." titles={view.upcoming} />
      <TitleRow heading="Recently added" description="Fresh additions to the Cinema catalogue." titles={view.recent} progressById={view.ratios} />
      <TitleRow heading="Movies" titles={view.movies} progressById={view.ratios} action={<SeeAll href="/movies" label="Explore movies" />} />
      <TitleRow heading="Series" titles={view.series} progressById={view.ratios} action={<SeeAll href="/series" label="Explore series" />} />
      <TitleRow heading="Live TV" titles={view.live} landscape action={<SeeAll href="/live-tv" label="View Live TV" />} />
      <TitleRow heading="Sports" titles={view.sports} landscape action={<SeeAll href="/sports" label="Explore sports" />} />
      <TitleRow heading="News and current affairs" titles={view.news} action={<SeeAll href="/news" label="Explore news" />} />
      {view.genreShelves.map(({ genre, titles }) => <TitleRow key={genre} heading={genre} titles={titles} />)}

      <section className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/15 bg-gradient-to-br from-cinema-700/20 via-ink-900 to-ink-950 p-6 sm:p-8">
        <div className="absolute -right-10 -top-16 -z-10 h-56 w-56 rounded-full bg-cinema-400/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cinema-300">More than the screen</p><h2 className="mt-2 text-2xl font-black tracking-tight text-white">Stories are better when they bring us together.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Find friends, follow official studios and broadcasters, share recommendations and create a watch party around a story you love.</p></div>
          <div className="flex flex-wrap gap-2 md:max-w-xs md:justify-end">
            <a href="/friends" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"><Users className="h-4 w-4" /> Friends</a>
            <a href="/watch-parties" className="inline-flex items-center gap-2 rounded-full bg-cinema-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cinema-400"><PartyPopper className="h-4 w-4" /> Watch together</a>
          </div>
        </div>
      </section>

      <TmdbRow heading="Trending movies" description="Stories audiences are exploring right now." mediaType="movie" list="trending" action={<SeeAll href="/movies" label="See all" />} />
      <TmdbRow heading="Popular movies" description="Popular films worth discovering." mediaType="movie" list="popular" action={<SeeAll href="/movies" label="See all" />} />
      <TmdbRow heading="Trending series" description="Series creating a buzz." mediaType="tv" list="trending" action={<SeeAll href="/series" label="See all" />} />
      <TmdbRow heading="Popular series" description="More series to explore." mediaType="tv" list="popular" action={<SeeAll href="/series" label="See all" />} />
      <a href="/search" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-850/60 p-5 text-sm text-slate-400 transition hover:border-cinema-400/40 hover:text-slate-200"><SearchIcon className="h-4 w-4 text-cinema-300" /> Looking for something specific? Search the whole Cinema catalogue.</a>
    </div>
  );
}
