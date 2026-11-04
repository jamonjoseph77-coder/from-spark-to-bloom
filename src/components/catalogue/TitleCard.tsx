import { Play } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { isUpcoming, titleHref, titleMeta } from '@/lib/catalogue';
import type { Title } from '@/lib/types';
import { TITLE_TYPE_LABELS } from '@/lib/types';

interface TitleCardProps {
  title: Title;
  progress?: number;
  landscape?: boolean;
}

export function TitleCard({ title, progress, landscape = false }: TitleCardProps) {
  const upcoming = isUpcoming(title);
  const badge = upcoming ? 'Coming soon' : title.type === 'live' ? 'Live' : null;

  return (
    <a href={titleHref(title)} className="group block w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300 focus-visible:ring-offset-4 focus-visible:ring-offset-ink-950" aria-label={`${title.title}, ${titleMeta(title)}`}>
      <div className={`relative ${landscape ? 'aspect-video' : 'aspect-[2/3]'} overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60 group-hover:ring-cinema-300/60 group-focus-visible:ring-cinema-300`}>
        <Artwork src={landscape ? title.backdrop_url || title.poster_url : title.poster_url} alt="" fallbackTitle={title.title} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-ink-950/85 via-ink-950/35 to-transparent opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-cinema-500/90 text-white shadow-xl shadow-cinema-950/40 backdrop-blur-sm"><Play className="h-5 w-5 fill-current" /></span>
          <span className="text-[10px] font-bold uppercase tracking-[.18em] text-white">Explore title</span>
        </div>
        {badge && <span className="absolute left-2 top-2 rounded-full border border-white/15 bg-ink-950/75 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg backdrop-blur">{badge}</span>}
        {progress !== undefined && <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20" role="progressbar" aria-label={`Viewing progress for ${title.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><div className="h-full rounded-r-full bg-cinema-300 shadow-[0_0_12px_rgba(56,189,248,.7)]" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} /></div>}
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <p className="truncate text-sm font-bold text-slate-100">{title.title}</p>
        <p className="truncate text-xs font-medium text-slate-400">{TITLE_TYPE_LABELS[title.type]}{title.release_year ? ` · ${title.release_year}` : ''}</p>
      </div>
    </a>
  );
}
