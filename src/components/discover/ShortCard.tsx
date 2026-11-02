import { BadgeCheck, Play } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import type { DiscoverClip } from '@/lib/clips';

interface ShortCardProps {
  clip: DiscoverClip;
  onOpen: (clip: DiscoverClip) => void;
}

export function ShortCard({ clip, onOpen }: ShortCardProps) {
  return (
    <article className="group w-[min(43vw,208px)] shrink-0 snap-start sm:w-52">
      <button
        type="button"
        onClick={() => onOpen(clip)}
        aria-label={`Watch Short: ${clip.headline}`}
        className="relative block aspect-[9/16] w-full overflow-hidden rounded-[1.35rem] bg-ink-800 text-left shadow-lg shadow-black/25 ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cinema-950/40 hover:ring-cinema-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300"
      >
        <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full transition duration-700 group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/90" aria-hidden="true" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-md"><Play className="h-3 w-3 fill-current" /> Short</span>
        <span className="absolute inset-x-3 bottom-3 space-y-2">
          <span className="line-clamp-2 block text-[13px] font-extrabold leading-snug text-white drop-shadow">{clip.headline}</span>
          <span className="flex items-center gap-1.5 truncate text-[11px] font-medium text-slate-200"><BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-300" /> {clip.publisher_name || 'Cinema Publisher'}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-ink-950 shadow-lg transition group-hover:bg-sky-100"><Play className="h-3 w-3 fill-current" /> Watch Short</span>
        </span>
      </button>
    </article>
  );
}
