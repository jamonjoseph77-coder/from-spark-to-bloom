import { useEffect, useState } from 'react';
import { Info, Play, Pause, Star } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { VideoDialog } from '@/components/player/VideoDialog';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchDiscoverTrailers, fetchTmdbList, tmdbHref, tmdbImageUrl, tmdbYear, type TmdbItem } from '@/lib/tmdb';

const ROTATE_MS = 8500;
type HeroEntry = { item: TmdbItem; videoKey?: string };

async function loadHero(): Promise<HeroEntry[]> {
  try {
    const trailers = await fetchDiscoverTrailers(4);
    if (trailers.length) return trailers.map(({ videoKey, ...item }) => ({ item, videoKey }));
  } catch (error) {
    console.warn('Cinema featured trailers are temporarily unavailable', error);
  }
  const [movies, series] = await Promise.all([
    fetchTmdbList('movie', 'trending'),
    fetchTmdbList('tv', 'trending'),
  ]);
  return [
    ...movies.slice(0, 4).map((item) => ({ item })),
    ...series.slice(0, 4).map((item) => ({ item })),
  ];
}

export function TmdbHero() {
  const { data: entries } = useAsyncData(loadHero, []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const current = entries?.[index % Math.max(entries.length, 1)];

  useEffect(() => {
    if (!entries || entries.length < 2 || paused) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % entries.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [entries, paused]);

  if (!entries?.length || !current) {
    return (
      <section className="relative flex min-h-[25rem] items-end overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(ellipse_at_75%_20%,rgba(96,165,250,.14),transparent_42%),linear-gradient(120deg,#242321,#111110_68%)] p-7 sm:min-h-[34rem] sm:p-12">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-cinema-300">Cinema · Experience the World of Stories</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl">Your world of entertainment starts here.</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">Explore movies, series, trailers and the stories people are talking about.</p>
          <a href="/discover" className={`${BUTTON_PRIMARY} mt-7`}>Explore Discover</a>
        </div>
      </section>
    );
  }

  const item = current.item;
  const year = tmdbYear(item);
  const image = tmdbImageUrl(item.backdropPath, 'w1280') || tmdbImageUrl(item.posterPath, 'w500');
  const label = item.mediaType === 'movie' ? 'Movie' : 'Series';

  return (
    <>
      <section
        aria-roledescription="carousel"
        aria-label="Featured movies and series"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}
        className="group relative isolate min-h-[29rem] overflow-hidden rounded-[2rem] border border-sky-200/15 bg-ink-900 shadow-[0_34px_100px_rgba(0,0,0,.55)] sm:min-h-[39rem] lg:min-h-[43rem]"
      >
        <Artwork key={item.id} src={image} alt="" fallbackTitle={item.title} className="absolute inset-0 h-full w-full animate-fade-in object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080d14] via-[#080d14]/80 to-[#080d14]/8" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d14] via-transparent to-black/15" />
        <div key={`${item.mediaType}-${item.id}`} className="relative flex min-h-[29rem] max-w-3xl flex-col justify-end gap-4 p-6 pb-20 animate-rise-in sm:min-h-[39rem] sm:p-14 sm:pb-28 lg:min-h-[43rem]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-sky-200/30 bg-sky-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-cinema-200 backdrop-blur">Featured on Cinema</span>
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-300">{label}{year ? ` · ${year}` : ''}</span>
            {item.rating !== null && <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-100"><Star className="h-3.5 w-3.5 fill-current" />{item.rating.toFixed(1)}</span>}
          </div>
          <h1 className="max-w-2xl text-4xl font-black leading-[1.02] tracking-[-.035em] text-white drop-shadow-lg sm:text-6xl lg:text-7xl">{item.title}</h1>
          {item.overview && <p className="line-clamp-3 max-w-xl text-sm leading-7 text-slate-200/90 sm:text-base">{item.overview}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            {current.videoKey && <button type="button" onClick={() => setTrailerOpen(true)} className={BUTTON_PRIMARY}><Play className="h-4 w-4 fill-current" /> Watch trailer</button>}
            <a href={tmdbHref(item)} className={BUTTON_SECONDARY}><Info className="h-4 w-4" /> Explore title</a>
          </div>
        </div>
        {entries.length > 1 && (
          <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-2 backdrop-blur sm:bottom-8 sm:right-8">
            <div className="flex items-center gap-1.5" aria-label={`Featured title ${index + 1} of ${entries.length}`}>
              {entries.map((entry, position) => <button key={`${entry.item.mediaType}-${entry.item.id}`} type="button" onClick={() => setIndex(position)} aria-label={`Show ${entry.item.title}`} aria-current={position === index} className={`h-1.5 rounded-full transition-all ${position === index ? 'w-7 bg-sky-300' : 'w-1.5 bg-white/40 hover:bg-white/80'}`} />)}
            </div>
            <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Resume featured titles' : 'Pause featured titles'} className="grid h-7 w-7 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">{paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</button>
          </div>
        )}
      </section>
      {trailerOpen && current.videoKey && <VideoDialog url={`https://www.youtube.com/watch?v=${current.videoKey}`} label={`${item.title} official trailer`} heading={`Trailer · ${item.title}`} onClose={() => setTrailerOpen(false)} />}
    </>
  );
}
