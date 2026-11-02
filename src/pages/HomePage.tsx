import { useMemo } from 'react';
import { ArrowRight, Clapperboard, Compass, Users } from 'lucide-react';
import { ContinueWatchingRow } from '@/components/catalogue/ContinueWatchingRow';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { TmdbHero } from '@/components/tmdb/TmdbHero';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import { LoadingState } from '@/components/ui/StatusViews';
import { PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { progressRatioByTitle, resumeItems, titlesOfType } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';

export function HomePage() {
  const { user } = useAuth();
  const { progress } = useLibrary();
  const { data: titles } = useAsyncData(() => fetchPublishedTitles().catch((error) => {
    console.warn('Cinema licensed catalogue is temporarily unavailable', error);
    return [];
  }), []);

  const cinemaShelves = useMemo(() => {
    if (!titles) return null;
    return {
      movies: titlesOfType(titles, 'movie'),
      series: titlesOfType(titles, 'series'),
      resume: resumeItems(progress, titles),
      ratios: progressRatioByTitle(progress),
    };
  }, [titles, progress]);

  return (
    <div className={`${PAGE_CONTAINER} space-y-10 pb-14 sm:space-y-14`}>
      <TmdbHero />

      {user && cinemaShelves?.resume.length ? <ContinueWatchingRow items={cinemaShelves.resume} /> : null}

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-cinema-300">A world of stories</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Find your next favourite.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Explore real movie and series information, official trailers and stories from across the world.</p>
          </div>
          <a href="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-cinema-200 transition hover:text-white">Go to Discover <ArrowRight className="h-4 w-4" /></a>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <a href="/movies" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 transition hover:border-cinema-300/35 hover:bg-white/[.06]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-cinema-400/10 text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Movies</span><span className="mt-1 block text-xs text-slate-400">Films worth discovering</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
          <a href="/series" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 transition hover:border-cinema-300/35 hover:bg-white/[.06]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-cinema-400/10 text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Series</span><span className="mt-1 block text-xs text-slate-400">Stories told episode by episode</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
          <a href="/friends" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 transition hover:border-cinema-300/35 hover:bg-white/[.06]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-cinema-400/10 text-cinema-200"><Users className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Friends</span><span className="mt-1 block text-xs text-slate-400">Share what you love</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
        </div>
      </section>

      <TmdbRow heading="Trending movies" description="Films audiences are exploring this week." mediaType="movie" list="trending" action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">See all</a>} />
      <TmdbRow heading="Popular movies" mediaType="movie" list="popular" action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">See all</a>} />
      <TmdbRow heading="Trending series" description="Series creating conversation around the world." mediaType="tv" list="trending" action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">See all</a>} />
      <TmdbRow heading="Popular series" mediaType="tv" list="popular" action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">See all</a>} />

      {cinemaShelves && cinemaShelves.movies.length > 0 && <TitleRow heading="Available on Cinema" description="Content published in Cinema's own catalogue." titles={cinemaShelves.movies} progressById={cinemaShelves.ratios} />}
      {cinemaShelves && cinemaShelves.series.length > 0 && <TitleRow heading="Series available on Cinema" titles={cinemaShelves.series} progressById={cinemaShelves.ratios} />}

      {!titles && <LoadingState label="Loading your Cinema catalogue" />}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(115deg,rgba(183,164,133,.12),rgba(255,255,255,.025)_50%,rgba(255,255,255,.01))] p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-cinema-300">The Cinema experience</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Discover a story. Experience it. Share it.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">Cinema brings entertainment and the people who love it into one connected destination. Move from a trailer to a title, from a title to a conversation, and from a conversation to watching together.</p>
          <a href="/discover" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cinema-200 hover:text-white">Explore Discover <Compass className="h-4 w-4" /></a>
        </div>
      </section>
      <TmdbAttribution />
    </div>
  );
}
