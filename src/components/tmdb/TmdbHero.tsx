import { useEffect, useState } from 'react';
import { Info, Play, Pause, Star } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { VideoDialog } from '@/components/player/VideoDialog';
import { BUTTON_ACCENT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/ui/styles';
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
      <section className="relative flex min-h-[25rem] items-end overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(ellipse_at_78%_16%,rgba(96,165,250,.16),transparent_44%),linear-gradient(120deg,#111925,#080c12_70%)] p-7 sm:min-h-[34rem] sm:p-12">
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
        className="group cinema-hero relative isolate min-h-[31rem] overflow-hidden rounded-[2rem] border border-sky-200/20 bg-ink-900 shadow-[0_40px_120px_rgba(0,0,0,.58)] sm:min-h-[40rem] lg:min-h-[46rem]"
      >
        <Artwork key={item.id} src={image} alt="" fallbackTitle={item.title} className="absolute inset-0 h-full w-full animate-fade-in object-cover object-center saturate-[1.12] transition-transform duration-[12000ms] group-hover:scale-[1.035]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080d14] via-[#080d14]/80 to-[#080d14]/8" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a12] via-[#050a12]/10 to-black/20" />
        <div className="cinema-hero-light cinema-hero-light--one" aria-hidden="true" />
        <div className="cinema-hero-light cinema-hero-light--two" aria-hidden="true" />
        <div key={`${item.mediaType}-${item.id}`} className="relative flex min-h-[31rem] max-w-3xl flex-col justify-end gap-4 p-6 pb-20 animate-rise-in sm:min-h-[40rem] sm:p-14 sm:pb-28 lg:min-h-[46rem]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-sky-200/30 bg-sky-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-cinema-200 backdrop-blur">Featured on Cinema</span>
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-300">{label}{year ? ` · ${year}` : ''}</span>
            {item.rating !== null && <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-100"><Star className="h-3.5 w-3.5 fill-current" />{item.rating.toFixed(1)}</span>}
          </div>
          <h1 className="max-w-2xl text-4xl font-black leading-[.98] tracking-[-.045em] text-white drop-shadow-[0_8px_34px_rgba(0,0,0,.55)] sm:text-6xl lg:text-7xl">{item.title}</h1>
          {item.overview && <p className="line-clamp-3 max-w-xl text-sm leading-7 text-slate-200/90 sm:text-base">{item.overview}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            {current.videoKey && <button type="button" onClick={() => setTrailerOpen(true)} className={BUTTON_ACCENT}><Play className="h-4 w-4 fill-current" /> Watch trailer</button>}
            <a href={tmdbHref(item)} className={BUTTON_SECONDARY}><Info className="h-4 w-4" /> Explore title</a>
          </div>
        </div>
        {entries.length > 1 && (
          <>
          <div className="absolute right-7 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 xl:flex">
            {[1, 2, 3].map((offset) => {
              const position = (index + offset) % entries.length;
              const preview = entries[position].item;
              const previewImage = tmdbImageUrl(preview.posterPath, 'w500') || tmdbImageUrl(preview.backdropPath, 'w780');
              return <button key={`${preview.mediaType}-${preview.id}`} type="button" onClick={() => setIndex(position)} aria-label={`Feature ${preview.title}`} className="group/preview flex w-52 items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-2 text-left shadow-xl backdrop-blur-xl transition hover:-translate-x-1 hover:border-sky-200/35 hover:bg-black/55">
                <div className="h-[4.5rem] w-14 shrink-0 overflow-hidden rounded-xl bg-ink-800"><Artwork src={previewImage} alt="" fallbackTitle={preview.title} className="h-full w-full object-cover transition duration-500 group-hover/preview:scale-105" /></div>
                <span className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-sky-200/80">Up next</span><span className="mt-1 line-clamp-2 block text-xs font-bold leading-4 text-white">{preview.title}</span></span>
              </button>;
            })}
          </div>
          <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-2 backdrop-blur sm:bottom-8 sm:right-8">
            <div className="flex items-center gap-1.5" aria-label={`Featured title ${index + 1} of ${entries.length}`}>
              {entries.map((entry, position) => <button key={`${entry.item.mediaType}-${entry.item.id}`} type="button" onClick={() => setIndex(position)} aria-label={`Show ${entry.item.title}`} aria-current={position === index} className={`h-1.5 rounded-full transition-all ${position === index ? 'w-7 bg-sky-300' : 'w-1.5 bg-white/40 hover:bg-white/80'}`} />)}
            </div>
            <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Resume featured titles' : 'Pause featured titles'} className="grid h-7 w-7 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">{paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</button>
          </div>
          </>
        )}
      </section>
      {trailerOpen && current.videoKey && <VideoDialog url={`https://www.youtube.com/watch?v=${current.videoKey}`} label={`${item.title} official trailer`} heading={`Trailer · ${item.title}`} onClose={() => setTrailerOpen(false)} />}
    </>
  );
}
