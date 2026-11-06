import { ArrowUpRight, Eye, Play } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import type { DiscoverClip } from '@/lib/clips';

interface ShortCardProps {
  clip: DiscoverClip;
  onOpen: (clip: DiscoverClip) => void;
}

export function ShortCard({ clip, onOpen }: ShortCardProps) {
  return (
    <article className="group cinema-short-card cinema-short-card--vertical w-[min(42vw,156px)] shrink-0 snap-start sm:w-[164px]">
      <button
        type="button"
        onClick={() => onOpen(clip)}
        aria-label={`Play Cinema Short: ${clip.headline}`}
        className="cinema-short-card__poster cinema-short-card__poster--vertical relative block aspect-[9/16] w-full overflow-hidden rounded-[1.1rem] border-0 bg-[#090d14] text-left shadow-none transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/80" aria-hidden="true" />
        <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <span className="min-w-0 flex-1 text-left">
            <span className="line-clamp-2 block text-[13px] font-bold leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.95)]">{clip.headline}</span>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-white/80"><Eye className="h-3 w-3" /> {(clip.views_count ?? 0).toLocaleString()} Views</span>
          </span>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-md transition group-hover:scale-105">
            <Play className="h-3.5 w-3.5 fill-current" />
          </span>
        </span>
      </button>
      <div className="mt-2 flex min-w-0 items-center justify-between gap-2"><p className="min-w-0 truncate px-0.5 text-[11px] font-semibold text-slate-300">{clip.publisher_name || 'Cinema'}</p>{clip.title && <a href={'/title/' + clip.title.id} onClick={(event) => event.stopPropagation()} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/20 bg-white/[.045] px-2 py-1 text-[10px] font-bold text-white/90 transition hover:border-white/45 hover:bg-white/10">Watch Now <ArrowUpRight className="h-3 w-3" /></a>}</div>
    </article>
  );
}
