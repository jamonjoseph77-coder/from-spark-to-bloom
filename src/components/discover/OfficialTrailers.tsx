import { useMemo, useState } from 'react';
import { Film, Play, Share2, MessageCircle } from 'lucide-react';
import { VideoDialog } from '@/components/player/VideoDialog';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { fetchDiscoverTrailers, tmdbImageUrl, type TmdbTrailer } from '@/lib/tmdb';

type Filter = 'all' | 'movie' | 'tv';

export function OfficialTrailers() {
  const [filter, setFilter] = useState<Filter>('all');
  const [active, setActive] = useState<TmdbTrailer | null>(null);
  const [sharingId, setSharingId] = useState<number | null>(null);
  const { notify } = useToast();

  async function shareTrailer(item: TmdbTrailer) {
    const url = `https://www.youtube.com/watch?v=${item.videoKey}`;
    try {
      setSharingId(item.id);
      if (navigator.share) await navigator.share({ title: `${item.title} Official Trailer`, text: `Watch ${item.title} on Cinema.`, url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); notify('Trailer Link Copied. Share It With Your Friends.'); }
      else notify('Sharing Is Not Available On This Browser.', 'error');
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') notify('Could Not Share This Trailer. Please Try Again.', 'error');
    } finally { setSharingId(null); }
  }
  const { data: trailers, error, reload } = useAsyncData(() => fetchDiscoverTrailers(6), []);

  const visible = useMemo(
    () => (trailers ?? []).filter((item) => filter === 'all' || item.mediaType === filter),
    [trailers, filter],
  );

  return (
    <section className="space-y-5" aria-label="Official Trailers">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter official trailers">
        {([{ id: 'all', label: 'All Previews' }, { id: 'movie', label: 'Movies' }, { id: 'tv', label: 'Series' }] as const).map((option) => (
          <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${filter === option.id ? 'border-cinema-300/50 bg-cinema-400/15 text-white' : 'border-white/10 bg-white/[.03] text-slate-400 hover:bg-white/[.08] hover:text-white'}`}>
            {option.label}
          </button>
        ))}
      </div>
      {!trailers && !error && <LoadingState label="Finding Official Trailers" />}
      {!trailers && error && <ErrorState onRetry={reload} />}
      {trailers && visible.length === 0 && <EmptyState icon={<Film className="h-7 w-7 text-cinema-300" />} title="No Official Trailers Available Yet" description="Official Trailers Will Appear Here When Verified Studio And Publisher Previews Are Available." />}
      {visible.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <article key={`${item.mediaType}-${item.id}`} className="group min-w-0">
              <button type="button" onClick={() => setActive(item)} aria-label={`Play official trailer for ${item.title}`} className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-ink-900 text-left ring-1 ring-white/10 transition hover:ring-cinema-300/50">
                <Artwork src={tmdbImageUrl(item.backdropPath, 'w780') || tmdbImageUrl(item.posterPath, 'w500')} alt="" fallbackTitle={item.title} className="h-full w-full transition duration-500 group-hover:scale-[1.04]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">Official Trailer</span>
                <span className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-cinema-500/70"><Play className="h-5 w-5 fill-current" /></span></span>
              </button>
              <div className="mt-3 flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cinema-300/15 bg-cinema-300/10 text-cinema-200"><Film className="h-4 w-4" /></span>
                <div className="min-w-0"><h3 className="truncate text-sm font-bold text-white">{item.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{item.videoName}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.mediaType === 'movie' ? 'Movie' : 'Series'}{item.releaseDate ? ` · ${item.releaseDate.slice(0, 4)}` : ''}</p></div>
              </div>
              <div className="cinema-trailer-actions">
                <button type="button" onClick={() => void shareTrailer(item)} disabled={sharingId === item.id} className="cinema-trailer-action disabled:opacity-50" aria-label={`Share ${item.title} trailer with friends`}>
                  <Share2 className="h-3.5 w-3.5" /> Share With Friends
                </button>
                <button type="button" onClick={() => setActive(item)} className="cinema-trailer-action" aria-label={`Open ${item.title} trailer conversation`}>
                  <MessageCircle className="h-3.5 w-3.5" /> Watch & Discuss
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {active && <VideoDialog url={`https://www.youtube.com/watch?v=${active.videoKey}`} label={`${active.title} official trailer`} heading={active.videoName} onClose={() => setActive(null)} />}
    </section>
  );
}
