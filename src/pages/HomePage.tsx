import { useMemo } from 'react';
import { ArrowRight, Radio, Trophy, Tv, Users, Sparkles } from 'lucide-react';
import { FeaturedBoard } from '@/components/catalogue/FeaturedBoard';
import { ContinueWatchingRow } from '@/components/catalogue/ContinueWatchingRow';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useLibrary } from '@/hooks/useLibrary';
import { comingSoonTitles, progressRatioByTitle, resumeItems, titlesOfType, genresOf, hasGenre } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';

function SeeAll({ href, label }: { href: string; label: string }) {
  return <a href={href} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-cinema-200 transition hover:text-white">{label}<ArrowRight className="h-4 w-4" /></a>;
}

export function HomePage() {
  const { progress } = useLibrary();
  const { data: titles, error, reload } = useAsyncData(
    () => fetchPublishedTitles().catch((cause) => { console.warn('Cinema catalogue is temporarily unavailable', cause); return []; }),
    [],
  );
  const view = useMemo(() => {
    if (!titles) return null;
    const genres = genresOf(titles).slice(0, 4);
    return {
      recent: titles.slice(0, 12),
      upcoming: comingSoonTitles(titles),
      movies: titlesOfType(titles, 'movie'),
      series: titlesOfType(titles, 'series'),
      live: titlesOfType(titles, 'live'),
      sports: titlesOfType(titles, 'sport'),
      news: titlesOfType(titles, 'news'),
      resume: resumeItems(progress, titles),
      ratios: progressRatioByTitle(progress),
      genreShelves: genres.map((genre) => ({ genre, titles: titles.filter((title) => hasGenre(title, genre)).slice(0, 10) })),
    };
  }, [titles, progress]);

  if (!view) return <div className={PAGE_CONTAINER}>{error ? <ErrorState onRetry={reload} /> : <LoadingState />}</div>;

  return (
    <div className="cinema-home">
      <div className={PAGE_CONTAINER}>
        <FeaturedBoard fallbackTitles={titles.slice(0, 5)} />
      </div>

      <div className={`${PAGE_CONTAINER} space-y-12 pb-16 pt-10 sm:space-y-16`}>
        <ContinueWatchingRow items={view.resume} />
        <TitleRow heading="Coming Soon" description="Get a first look at stories arriving next." titles={view.upcoming} action={<SeeAll href="/movies" label="Explore releases" />} />
        <TitleRow heading="Recently Added to Cinema" description="Titles published by Cinema and its authorised content partners." titles={view.recent} progressById={view.ratios} />
        <TmdbRow heading="Trending Movies" description="Films audiences are exploring across the world." mediaType="movie" list="trending" action={<SeeAll href="/movies" label="All movies" />} />
        <TitleRow heading="Movies on Cinema" titles={view.movies} progressById={view.ratios} action={<SeeAll href="/movies" label="Explore movies" />} />
        <TmdbRow heading="Popular Series" description="Series to discover, follow and explore." mediaType="tv" list="popular" action={<SeeAll href="/series" label="All series" />} />
        <TitleRow heading="Series on Cinema" titles={view.series} progressById={view.ratios} action={<SeeAll href="/series" label="Explore series" />} />
        <section className="cinema-home-shortcuts">
          <a href="/live-tv"><Radio /><span><b>Live TV</b><small>Television, channels and programmes</small></span><ArrowRight /></a>
          <a href="/sports"><Trophy /><span><b>Sports</b><small>Live events, competitions and highlights</small></span><ArrowRight /></a>
          <a href="/discover"><Sparkles /><span><b>Discover</b><small>Trailers, clips, shorts and official updates</small></span><ArrowRight /></a>
          <a href="/friends"><Users /><span><b>Friends</b><small>Share recommendations and enjoy stories together</small></span><ArrowRight /></a>
        </section>
        <TitleRow heading="Live Now" description="Live programming available through Cinema." titles={view.live} landscape action={<SeeAll href="/live-tv" label="Open Live TV" />} />
        <TitleRow heading="Your Sports" description="Sports content available in the Cinema catalogue." titles={view.sports} landscape action={<SeeAll href="/sports" label="Explore sports" />} />
        <TitleRow heading="News & Current Affairs" titles={view.news} landscape action={<SeeAll href="/news" label="Explore news" />} />
        {view.genreShelves.map(({ genre, titles }) => <TitleRow key={genre} heading={genre} titles={titles} />)}
        <TmdbRow heading="More Films to Explore" mediaType="movie" list="popular" action={<SeeAll href="/movies" label="Browse films" />} />
        <TmdbRow heading="More Series to Explore" mediaType="tv" list="trending" action={<SeeAll href="/series" label="Browse series" />} />
      </div>
      <TmdbAttribution />
    </div>
  );
}
