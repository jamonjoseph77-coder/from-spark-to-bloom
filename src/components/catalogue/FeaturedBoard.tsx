import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Info, Pause, Play, Sparkles } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/ui/styles';
import { VideoDialog } from '@/components/player/VideoDialog';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchTmdbDetail, fetchTmdbList, tmdbHref, tmdbImageUrl, tmdbYear, type TmdbDetail, type TmdbItem, type TmdbMediaType } from '@/lib/tmdb';
import { titleHref, titleMeta } from '@/lib/catalogue';
import type { Title } from '@/lib/types';

type Feature = { kind: 'tmdb'; item: TmdbItem; detail: TmdbDetail } | { kind: 'local'; item: Title };
async function loadFeatures(mediaType?: TmdbMediaType): Promise<Feature[]> {
  const types: TmdbMediaType[] = mediaType ? [mediaType] : ['movie', 'tv'];
  const lists = await Promise.all(types.map((type) => fetchTmdbList(type, 'trending')));
  const candidates = types.flatMap((type, index) => lists[index].slice(0, mediaType ? 6 : 4).map((item) => ({ ...item, mediaType: type })))
    .filter((item) => item.backdropPath || item.posterPath).slice(0, 6);
  const details = await Promise.allSettled(candidates.map((item) => fetchTmdbDetail(item.mediaType, item.id)));
  return details.flatMap((result, index): Feature[] => result.status === 'fulfilled'
    ? [{ kind: 'tmdb', item: candidates[index], detail: result.value }]
    : []);
}
export function FeaturedBoard({ fallbackTitles = [], mediaType }: { fallbackTitles?: Title[]; mediaType?: TmdbMediaType }) {
  const { data } = useAsyncData(() => loadFeatures(mediaType), [mediaType]);
  const features = useMemo<Feature[]>(() => {
    if (data?.length) return data;
    return fallbackTitles.slice(0, 5).map((item) => ({ kind: 'local', item }));
  }, [data, fallbackTitles]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [trailer, setTrailer] = useState<{ url: string; label: string; heading: string } | null>(null);
  useEffect(() => { setIndex(0); }, [features.length]);
  useEffect(() => {
    if (paused || features.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % features.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused, features.length]);
  const current = features[index % Math.max(1, features.length)];
  if (!current) return (
    <section className="cinema-feature-board cinema-feature-board--empty">
      <div><span className="cinema-kicker">CINEMA ORIGINAL EXPERIENCE</span><h1>Experience the World of Stories.</h1><p>Discover movies, series and entertainment from across the world.</p><a href="/movies" className={BUTTON_PRIMARY}>Explore Cinema <ArrowRight className="h-4 w-4" /></a></div>
    </section>
  );
  const remoteItem = current.kind === 'tmdb' ? current.item : null;
  const localItem = current.kind === 'local' ? current.item : null;
  const title = remoteItem ? remoteItem.title : localItem!.title;
  const artwork = remoteItem
    ? tmdbImageUrl(remoteItem.backdropPath, 'w1280') || tmdbImageUrl(remoteItem.posterPath, 'w500')
    : localItem!.backdrop_url || localItem!.poster_url;
  const meta = remoteItem
    ? [remoteItem.mediaType === 'movie' ? 'Film' : 'Series', tmdbYear(remoteItem)].filter(Boolean).join('  ·  ')
    : titleMeta(localItem!);
  const remoteTrailer = remoteItem ? current.kind === 'tmdb' ? current.detail.videos.find((video) => video.official && video.type === 'Trailer') : null : null;
  const href = remoteItem ? tmdbHref(remoteItem) : titleHref(localItem!);
  return (
    <>
      <section aria-label="Featured on Cinema" aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}
        className="cinema-feature-board">
        <Artwork key={title} src={artwork} alt="" fallbackTitle={title} className="cinema-feature-art" />
        <div className="cinema-feature-shade" />
        <div className="cinema-feature-copy" key={'copy-' + title}>
          <span className="cinema-kicker"><Sparkles className="h-3.5 w-3.5" /> THE WORLD OF STORIES</span>
          <p className="cinema-feature-meta">{meta}</p>
          <h1>{title}</h1>
          <p className="cinema-feature-description">{remoteItem ? current.kind === 'tmdb' ? current.detail.overview : '' : localItem!.synopsis}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            {localItem && localItem.playback_url.trim()
              ? <a href={href} className={BUTTON_PRIMARY}><Play className="h-4 w-4 fill-current" /> Watch now</a>
              : <a href={href} className={BUTTON_PRIMARY}><Info className="h-4 w-4" /> Explore title</a>}
            {remoteTrailer && <button type="button" onClick={() => setTrailer({ url: 'https://www.youtube.com/watch?v=' + remoteTrailer.key, label: title + ' official trailer', heading: 'Official trailer · ' + title })} className={BUTTON_SECONDARY}><Play className="h-4 w-4" /> Watch trailer</button>}
            {localItem && localItem.trailer_url.trim() && <button type="button" onClick={() => setTrailer({ url: localItem.trailer_url, label: title + ' trailer', heading: 'Trailer · ' + title })} className={BUTTON_SECONDARY}><Play className="h-4 w-4" /> Watch trailer</button>}
          </div>
        </div>
        <div className="cinema-feature-controls">
          <div className="flex items-center gap-2">{features.map((feature, position) => <button key={feature.kind === 'tmdb' ? feature.item.mediaType + '-' + feature.item.id : feature.item.id} type="button" aria-label={'Feature ' + (position + 1)} aria-current={position === index} onClick={() => setIndex(position)} className={'cinema-feature-dot ' + (position === index ? 'is-active' : '')} />)}</div>
          <button type="button" className="cinema-feature-pause" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Resume featured rotation' : 'Pause featured rotation'}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
          <a href={mediaType === 'tv' ? '/series' : '/movies'} className="cinema-feature-all">Explore catalogue <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>
      {trailer && <VideoDialog {...trailer} onClose={() => setTrailer(null)} />}
    </>
  );
}
