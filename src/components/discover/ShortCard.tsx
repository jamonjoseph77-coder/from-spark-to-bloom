import { BadgeCheck, Play, Clock3, Eye, ArrowUpRight } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import type { DiscoverClip } from '@/lib/clips';

interface ShortCardProps {
  clip: DiscoverClip;
  onOpen: (clip: DiscoverClip) => void;
}

export function ShortCard({ clip, onOpen }: ShortCardProps) {
  return (
    <article className="group cinema-short-card w-[min(62vw,232px)] shrink-0 snap-start sm:w-[232px]">
      <button
        type="button"
        onClick={() => onOpen(clip)}
        aria-label={`Watch short: ${clip.headline}`}
        className="cinema-short-card__poster aspect-[9/16] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b]"
      >
        <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]" />
        <span className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent via-45% to-black/95" aria-hidden="true" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-white backdrop-blur-xl">
          <Play className="h-3 w-3 fill-current" /> {clip.kind === 'short' ? 'Cinema Short' : 'Video Clip'}
        </span>
        {clip.duration_seconds && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/65 px-2 py-1.5 text-[10px] font-bold text-white backdrop-blur-xl">
            <Clock3 className="h-3 w-3" /> {clip.duration_seconds}s
          </span>
        )}
        <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/65 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-xl">
            <Eye className="h-3 w-3" /> {(clip.views_count ?? 0).toLocaleString()} Views
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/30 bg-black/60 text-white shadow-lg backdrop-blur-xl transition group-hover:scale-105 group-hover:bg-[#087cff]">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </span>
        <span className="pointer-events-none absolute inset-x-3 bottom-16">
          <span className="line-clamp-2 block text-left text-[13px] font-extrabold leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.95)]">{clip.headline}</span>
          <span className="mt-1.5 flex items-center gap-1.5 truncate text-left text-[10px] font-semibold text-slate-100 drop-shadow">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-200" /> {clip.publisher_name || 'Cinema Publisher'}
          </span>
        </span>
      </button>
      <button type="button" onClick={() => onOpen(clip)} className="cinema-short-card__watch" aria-label={`Watch short: ${clip.headline}`}>
        <Play className="h-3.5 w-3.5 fill-current" /> Watch Short <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
