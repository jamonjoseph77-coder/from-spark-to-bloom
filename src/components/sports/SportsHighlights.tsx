import { useMemo, useState } from 'react';
import { ArrowUpRight, Play, Trophy } from 'lucide-react';
import { VideoDialog } from '@/components/player/VideoDialog';
import { Artwork } from '@/components/ui/Artwork';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchPublishedClips, type DiscoverClip } from '@/lib/clips';

function isSportsHighlight(clip: DiscoverClip): boolean {
  if (!clip.title || clip.title.type !== 'sport') return false;
  return ['clip', 'featured', 'behind_the_scenes', 'interview', 'making_of'].includes(clip.kind);
}

export function SportsHighlights() {
  const [active, setActive] = useState<DiscoverClip | null>(null);
  const { data, error, reload } = useAsyncData(fetchPublishedClips, []);
  const highlights = useMemo(
    () => (data ?? []).filter(isSportsHighlight).slice(0, 12),
    [data],
  );

  if (!data && !error) return <section className="rounded-[1.75rem] border border-white/10 bg-white/[.025] p-4 sm:p-6"><LoadingState label="Finding Sports Highlights" /></section>;
  if (error) return <section className="rounded-[1.75rem] border border-white/10 bg-white/[.025] p-4 sm:p-6"><ErrorState onRetry={reload} description="Sports highlights could not load right now. The rest of Sports On Cinema remains available." /></section>;
  if (!highlights.length) return null;

  return (
    <section className="relative isolate overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,.055),rgba(255,255,255,.012)_55%,rgba(181,148,91,.045))] p-3 shadow-[0_24px_70px_rgba(0,0,0,.24)] sm:p-5" aria-label="Sports video highlights">
      <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-72 w-72 rounded-full bg-amber-100/[.045] blur-3xl" />
      <div className="mb-4 flex items-center justify-between gap-3 px-1 sm:mb-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/[.07] text-amber-100 shadow-inner"><Trophy className="h-5 w-5" /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-100/80">Cinema Sports Selection</p><h3 className="mt-0.5 text-base font-extrabold text-white sm:text-lg">Featured Moments</h3></div>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold tracking-wide text-slate-300">{highlights.length} {highlights.length === 1 ? 'VIDEO' : 'VIDEOS'}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {highlights.map((clip, index) => (
          <article key={clip.id} className="group min-w-0">
            <button type="button" onClick={() => setActive(clip)} aria-label={`Play sports highlight: ${clip.headline}`} className="relative block aspect-[16/10] w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#090d12] text-left shadow-[0_14px_34px_rgba(0,0,0,.28)] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_20px_44px_rgba(0,0,0,.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full transition duration-700 group-hover:scale-[1.045]" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#050708]/95 via-[#050708]/12 to-black/10" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-white/95 backdrop-blur-md"><Trophy className="h-3 w-3 text-amber-100" /> Featured</span>
              <span className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full border border-white/55 bg-white/[.13] text-white shadow-[0_8px_30px_rgba(0,0,0,.35)] backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-white/25"><Play className="ml-0.5 h-5 w-5 fill-current" /></span></span>
              <span className="absolute bottom-0 left-0 right-0 p-4">
                <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[.16em] text-amber-100/85">Moment {String(index + 1).padStart(2, '0')}</span>
                <span className="block line-clamp-2 text-sm font-extrabold leading-snug text-white drop-shadow-lg sm:text-[15px]">{clip.headline}</span>
                <span className="mt-1.5 block truncate text-[11px] font-medium text-slate-300">{clip.publisher_name || clip.title?.title || 'Cinema Sports'}</span>
              </span>
            </button>
            {clip.title && <a href={`/title/${clip.title.id}`} className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate px-1 text-[11px] font-semibold text-slate-300 transition hover:text-white">Explore {clip.title.title} <ArrowUpRight className="h-3 w-3 shrink-0" /></a>}
          </article>
        ))}
      </div>
    </section>
  );
}
