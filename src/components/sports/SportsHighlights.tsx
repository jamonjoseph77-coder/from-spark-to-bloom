import { useMemo, useState } from 'react';
import { Play, Trophy } from 'lucide-react';
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

  if (!data && !error) return <section className="space-y-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">From The Field</p><h2 className="mt-1 text-xl font-extrabold text-white">Sports Video Highlights</h2></div><LoadingState label="Finding Sports Highlights" /></section>;
  if (error) return <section className="space-y-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">From The Field</p><h2 className="mt-1 text-xl font-extrabold text-white">Sports Video Highlights</h2></div><ErrorState onRetry={reload} description="Sports highlights could not load right now. The rest of Sports On Cinema remains available." /></section>;
  if (!highlights.length) return null;

  return (
    <section className="space-y-4" aria-label="Sports video highlights">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">From The Field</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Sports Video Highlights</h2><p className="mt-1 text-sm text-slate-400">Official clips and features connected to sports titles published in Cinema.</p></div>
        <span className="rounded-full border border-sky-200/15 bg-sky-200/[.06] px-3 py-1.5 text-[10px] font-bold text-sky-100">{highlights.length} Videos</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {highlights.map((clip) => (
          <article key={clip.id} className="group min-w-0">
            <button type="button" onClick={() => setActive(clip)} aria-label={`Play sports highlight: ${clip.headline}`} className="relative block aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#080c13] text-left shadow-[0_12px_34px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-0.5 hover:border-sky-200/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
              <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full transition duration-500 group-hover:scale-[1.035]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur"><Trophy className="h-3 w-3 text-sky-200" /> Official Feature</span>
              <span className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full border border-white/45 bg-black/45 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-sky-600/85"><Play className="h-5 w-5 fill-current" /></span></span>
              <span className="absolute bottom-3 left-3 right-3"><span className="block line-clamp-2 text-sm font-extrabold leading-snug text-white drop-shadow-lg">{clip.headline}</span><span className="mt-1 block truncate text-[11px] font-semibold text-slate-200">{clip.publisher_name || clip.title?.title || 'Cinema Sports Publisher'}</span></span>
            </button>
            {clip.title && <a href={`/title/${clip.title.id}`} className="mt-2 inline-block max-w-full truncate text-xs font-semibold text-sky-200 hover:text-white">Related: {clip.title.title}</a>}
          </article>
        ))}
      </div>
      {active && <VideoDialog url={active.video_url} label={active.headline} heading="Sports Highlight" onClose={() => setActive(null)} />}
    </section>
  );
}
