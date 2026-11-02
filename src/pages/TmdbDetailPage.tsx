import { useState } from 'react';
import { ArrowLeft, Play, Star } from 'lucide-react';
import { VideoDialog } from '@/components/player/VideoDialog';
import type { VideoSource } from '@/lib/videoSource';
import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import { TmdbErrorState } from '@/components/tmdb/TmdbErrorState';
import { Artwork } from '@/components/ui/Artwork';
import { LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_GHOST, CHIP_BASE, PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchTmdbDetail, tmdbImageUrl, type TmdbMediaType } from '@/lib/tmdb';
import { fetchKinoCheckVideos, type KinoCheckVideo } from '@/lib/kinocheck';

function formatReleaseDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function TmdbDetailPage({ mediaType, id }: { mediaType: TmdbMediaType; id: number }) {
  const [activeVideo, setActiveVideo] = useState<VideoSource | null>(null);
  const { data, error, loading, reload } = useAsyncData(() => fetchTmdbDetail(mediaType, id), [mediaType, id]);
  const { data: kinoVideos = [] } = useAsyncData(() => fetchKinoCheckVideos(mediaType, id), [mediaType, id]);
  const backLink = mediaType === 'movie' ? '/movies' : '/series';
  const backLabel = mediaType === 'movie' ? 'Back to movies' : 'Back to series';

  if (loading) return <div className={PAGE_CONTAINER}><LoadingState label="Loading details" /></div>;
  if (error || !data) {
    return (
      <div className={PAGE_CONTAINER}>
        <TmdbErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const backdrop = tmdbImageUrl(data.backdropPath, 'w1280');
  const poster = tmdbImageUrl(data.posterPath, 'w500');
  const typeLabel = mediaType === 'movie' ? 'Movie' : 'Series';
  const runtime = data.runtimeMinutes ? (mediaType === 'movie' ? `${data.runtimeMinutes} min` : `${data.runtimeMinutes} min per episode`) : null;
  const seasonLabel = data.seasons ? `${data.seasons} ${data.seasons === 1 ? 'season' : 'seasons'}` : null;
  const facts = [typeLabel, data.releaseDate ? formatReleaseDate(data.releaseDate) : null, runtime, seasonLabel].filter(Boolean);

  return (
    <div className={`${PAGE_CONTAINER} space-y-10`}>
      <a href={backLink} className={`${BUTTON_GHOST} -ml-3`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </a>

      <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/40">
        <Artwork src={backdrop} alt="" fallbackTitle={data.title} className="absolute inset-0 h-full w-full object-cover object-top opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/40" />
        <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,15rem)_1fr] md:items-end">
          <div className="mx-auto w-48 overflow-hidden rounded-xl ring-1 ring-white/15 md:mx-0 md:w-full">
            <div className="aspect-[2/3]">
              <Artwork src={poster} alt={data.title} fallbackTitle={data.title} className="h-full w-full" />
            </div>
          </div>
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{facts.join(' · ')}</p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">{data.title}</h1>
            {data.tagline && <p className="text-base italic text-slate-300">{data.tagline}</p>}
            <div className="flex flex-wrap items-center gap-3">
              {data.rating !== null && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1.5 text-sm font-semibold text-amber-300">
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  {data.rating.toFixed(1)} / 10
                </span>
              )}
              {data.genres.map((genre) => (
                <span key={genre} className={`${CHIP_BASE} border-white/15 bg-white/5 text-slate-200`}>
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-white">Overview</h2>
          <p className="text-base leading-relaxed text-slate-300">
            {data.overview || 'No description has been provided for this title yet.'}
          </p>
          {data.status && <p className="text-sm text-slate-500">Status: {data.status}</p>}
          {(() => {
            const tmdbExtras = data.videos.filter((video) => video.type !== 'Trailer' && ['Featurette', 'Clip', 'Behind the Scenes'].includes(video.type)).map((video) => ({
              id: `tmdb-${video.id}`,
              key: video.key,
              name: video.name,
              kind: video.type,
            }));
            const seen = new Set(tmdbExtras.map((video) => video.key));
            const kinoExtras = (kinoVideos ?? []).flatMap((video: KinoCheckVideo) => {
              const kind = video.categories.includes('Featurette') ? 'Featurette' : video.categories.includes('Clip') ? 'Clip' : '';
              if (!kind || seen.has(video.youtubeVideoId) || video.categories.includes('Trailer')) return [];
              seen.add(video.youtubeVideoId);
              return [{ id: `kino-${video.id}`, key: video.youtubeVideoId, name: video.title, kind }];
            });
            const extras = [...tmdbExtras, ...kinoExtras];
            return extras.length > 0 ? (
              <section className="space-y-4 border-t border-white/10 pt-6">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white">Featurettes and clips</h2>
                  <p className="mt-1 text-sm text-slate-400">Official promotional videos matched to this title.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {extras.map((video) => (
                    <article key={video.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink-850/70 p-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-sky-200">{video.kind}</p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{video.name}</p>
                      </div>
                      <button type="button" onClick={() => setActiveVideo({ url: `https://www.youtube.com/watch?v=${video.key}`, label: `${data.title} ${video.kind.toLowerCase()}`, heading: `${video.kind}: ${data.title}` })} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10">
                        <Play className="h-3.5 w-3.5 fill-current" /> Watch {video.kind.toLowerCase()}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ) : null;
          })()}
          {data.videos.some((video) => video.type === 'Trailer') && (
            <div className="pt-2">
              <button type="button" onClick={() => {
                const video = data.videos.find((candidate) => candidate.type === 'Trailer');
                if (video) setActiveVideo({ url: `https://www.youtube.com/watch?v=${video.key}`, label: `${data.title} trailer`, heading: `Trailer: ${data.title}` });
              }} className="inline-flex items-center gap-2 rounded-full border border-cinema-400/30 bg-cinema-500/10 px-4 py-2 text-sm font-semibold text-cinema-200 transition hover:bg-cinema-500/20">
                <Play className="h-4 w-4 fill-current" /> Watch trailer
              </button>
            </div>
          )}
        </section>

        <aside className="h-fit space-y-3 rounded-2xl border border-white/10 bg-ink-850/70 p-6">
          <p className="text-sm font-semibold text-white">Not available to watch on Cinema yet</p>
          <p className="text-sm leading-relaxed text-slate-400">
            This page shows catalogue information from TMDB. A trailer may be available above; full-title playback appears only when Cinema has an authorized media source.
          </p>
        </aside>
      </div>

      <TmdbAttribution />
      {activeVideo && <VideoDialog {...activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
