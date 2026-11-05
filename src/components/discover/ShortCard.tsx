import { Clock3, Eye, Play } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import type { DiscoverClip } from '@/lib/clips';

interface ShortCardProps {
  clip: DiscoverClip;
  onOpen: (clip: DiscoverClip) => void;
}

export function ShortCard({ clip, onOpen }: ShortCardProps) {
  return (
    <article className="group cinema-short-card cinema-short-card--vertical w-[min(34vw,124px)] shrink-0 snap-start sm:w-[132px]">
      <button
        type="button"
        onClick={() => onOpen(clip)}
        aria-label={`Play Cinema Short: ${clip.headline}`}
        className="cinema-short-card__poster cinema-short-card__poster--vertical relative block aspect-[9/16] w-full overflow-hidden rounded-[1rem] border border-white/10 bg-[#090d14] text-left shadow-[0_8px_24px_rgba(0,0,0,.2)] transition duration-300 hover:border-white/20 hover:shadow-[0_12px_30px_rgba(0,0,0,.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55a8ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030407]"
      >
        <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/85" aria-hidden="true" />
        {clip.duration_seconds ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-1 text-[9px] font-semibold text-white/90 backdrop-blur-md">
            <Clock3 className="h-2.5 w-2.5" /> {clip.duration_seconds}s
          </span>
        ) : null}
        <span className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-1.5">
          <span className="min-w-0 flex-1 text-left">
            <span className="line-clamp-2 block text-[12px] font-bold leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.95)]">{clip.headline}</span>
            <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-medium text-white/70"><Eye className="h-2.5 w-2.5" /> {(clip.views_count ?? 0).toLocaleString()}</span>
          </span>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/20 bg-black/35 text-white/90 shadow-lg backdrop-blur-md transition group-hover:scale-105 group-hover:bg-black/55">
            <Play className="h-3 w-3 fill-current" />
          </span>
        </span>
      </button>
      <p className="mt-2 line-clamp-1 px-0.5 text-[11px] font-semibold text-slate-300">{clip.publisher_name || 'Cinema'}</p>
    </article>
  );
}
