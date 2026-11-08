import { ArrowUpRight, Play } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { formatClock } from '@/lib/format';
import { resumeHref, type ResumeItem } from '@/lib/catalogue';
import { SECTION_HEADING } from '@/components/ui/styles';

export function ContinueWatchingRow({ items }: { items: ResumeItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">Pick Up Where You Left Off</p><h2 className={SECTION_HEADING}>Continue Watching</h2></div><span className="text-[11px] font-semibold text-slate-500">{items.length} In Progress</span></div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const ratio =
            item.progress.duration_seconds > 0
              ? Math.min(1, item.progress.position_seconds / item.progress.duration_seconds)
              : 0;
          return (
            <a
              key={item.progress.content_id}
              href={resumeHref(item)}
              className="group w-[min(82vw,22rem)] flex-none snap-start rounded-[1.35rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-ink-950 sm:w-80"
            >
              <div className="relative aspect-video overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#090d0b] shadow-[0_14px_34px_rgba(0,0,0,.24)] transition duration-300 group-hover:-translate-y-1 group-hover:border-white/25 group-hover:shadow-[0_20px_44px_rgba(0,0,0,.34)]">
                <Artwork
                  src={item.title.backdrop_url || item.title.poster_url}
                  alt=""
                  fallbackTitle={item.title.title}
                  className="h-full w-full transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-ink-950/30 transition group-hover:bg-ink-950/50">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-white/45 bg-black/45 text-white shadow-lg backdrop-blur-md transition group-hover:scale-110 group-hover:bg-black/65">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20" role="progressbar" aria-label={`Viewing progress for ${item.title.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
                  <div className="h-full rounded-full bg-gradient-to-r from-slate-100 to-emerald-100" style={{ width: `${Math.round(ratio * 100)}%` }} />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-start justify-between gap-3"><p className="min-w-0 truncate text-sm font-bold text-slate-100">{item.title.title}</p><ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" /></div>
                <p className="text-xs text-slate-400">
                  {formatClock(item.progress.position_seconds)} watched · {Math.round(ratio * 100)}% complete
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
