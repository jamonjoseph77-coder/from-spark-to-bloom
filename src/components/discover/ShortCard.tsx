import { BadgeCheck, Play, Clock3, Eye, ArrowUpRight } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import type { DiscoverClip } from '@/lib/clips';

interface ShortCardProps {
  clip: DiscoverClip;
  onOpen: (clip: DiscoverClip) => void;
}

export function ShortCard({ clip, onOpen }: ShortCardProps) {
  return (
    <article className="group cinema-short-card w-[min(66vw,236px)] shrink-0 snap-start sm:w-[220px]">
      <button
        type="button"
        onClick={() => onOpen(clip)}
        aria-label={`Watch short: ${clip.headline}`}
        className="cinema-short-card__poster aspect-[3/4] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030407]"
      >
        <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]" />
        <span className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/5 to-black/95" aria-hidden="true" />
        <span className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-white backdrop-blur-xl">
            <Play className="h-3 w-3 fill-current" /> {clip.kind === 'short' ? 'Cinema Short' : 'Video Clip'}
          </span>
          {clip.duration_seconds ? <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/65 px-2 py-1.5 text-[10px] font-bold text-white backdrop-blur-xl"><Clock3 className="h-3 w-3" /> {clip.duration_seconds}s</span> : null}
        </span>
        <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <span className="min-w-0 flex-1 text-left">
            <span className="line-clamp-2 block text-[15px] font-extrabold leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.95)]">{clip.headline}</span>
            <span className="mt-2 flex items-center gap-1.5 truncate text-[11px] font-semibold text-slate-200 drop-shadow">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#00e5ff]" /> {clip.publisher_name || 'Cinema Publisher'}
            </span>
            <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-300"><Eye className="h-3 w-3" /> {(clip.views_count ?? 0).toLocaleString()} Views</span>
          </span>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/35 bg-[#087cff] text-white shadow-[0_8px_24px_rgba(8,124,255,.35)] transition duration-300 group-hover:scale-110 group-hover:bg-[#168cff]">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </span>
      </button>
      <button type="button" onClick={() => onOpen(clip)} className="cinema-short-card__watch" aria-label={`Watch short: ${clip.headline}`}>
        <Play className="h-3.5 w-3.5 fill-current" /> Watch Now <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
