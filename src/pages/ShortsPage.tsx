import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronDown, Clapperboard, Heart, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { Artwork } from '@/components/ui/Artwork';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { fetchPublishedShorts, isPlayableShort, rankPublishedShorts, type DiscoverClip } from '@/lib/clips';
import { isDirectVideoUrl, toEmbedUrl } from '@/lib/media';

function ShortFeedItem({ clip, active, onDetails }: { clip: DiscoverClip; active: boolean; onDetails: (clip: DiscoverClip) => void }) {
  const embed = !isDirectVideoUrl(clip.video_url) && active
    ? toEmbedUrl(clip.video_url, { autoplay: true, muted: true })
    : null;
  return (
    <article data-short-feed-item className="cinema-short-feed-item relative isolate mx-auto h-full min-h-[34rem] w-full max-w-[29rem] snap-start overflow-hidden rounded-[1.5rem] border border-sky-200/15 bg-[#030508] shadow-[0_24px_70px_rgba(0,0,0,.48)]">
      <div className="absolute inset-0 bg-[#030508]">
        {active && isDirectVideoUrl(clip.video_url) ? (
          <VideoPlayer src={clip.video_url} title={clip.headline} poster={clip.poster_url || undefined} layout="portrait" autoPlay muted showControls showMuteToggle />
        ) : active && embed ? (
          <iframe src={embed} title={clip.headline} className="h-full w-full bg-black" loading="eager" allow="autoplay; accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover opacity-80" />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end gap-3 p-5 pb-7">
        <div className="min-w-0 flex-1">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sky-200/20 bg-[#06152a]/70 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-sky-100 backdrop-blur"><Sparkles className="h-3 w-3" /> Cinema Shorts</p>
          <h2 className="line-clamp-3 text-xl font-black leading-tight text-white drop-shadow-lg">{clip.headline}</h2>
          <p className="mt-2 text-xs font-bold text-sky-100">{clip.publisher_name || 'Cinema Creator'}</p>
          {clip.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-200/85">{clip.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {clip.title && <a href={`/title/${clip.title.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_28px_rgba(8,124,255,.3)] transition hover:bg-[#168cff]">Watch Now <ArrowUpRight className="h-3.5 w-3.5" /></a>}
            <button type="button" onClick={() => onDetails(clip)} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-xl transition hover:border-sky-200/50 hover:bg-sky-300/10"><Heart className="h-3.5 w-3.5" /><MessageCircle className="h-3.5 w-3.5" /> Details & Reactions</button>
          </div>
        </div>
        <div className="mb-1 flex shrink-0 flex-col items-center gap-2">
          <button type="button" onClick={() => onDetails(clip)} aria-label={`Open reactions for ${clip.headline}`} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-xl transition hover:border-sky-200/60 hover:bg-sky-300/15"><Heart className="h-5 w-5" /></button>
          <span className="text-[10px] font-bold tabular-nums text-white/80">{(clip.views_count ?? 0).toLocaleString()}</span>
        </div>
      </div>
      {!active && <button type="button" onClick={() => document.querySelector('[data-short-feed-item][data-short-index="' + (Number((document.activeElement as HTMLElement | null)?.dataset?.shortIndex ?? -1) + 1) + '"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="absolute inset-0 z-10 cursor-pointer" aria-label={`Scroll To Next Short After ${clip.headline}`} />}
    </article>
  );
}

export function ShortsPage() {
  const { user } = useAuth();
  const feedRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDetails, setActiveDetails] = useState<DiscoverClip | null>(null);
  const { data: clips, error, loading, reload } = useAsyncData(fetchPublishedShorts, []);
  const { data: followedPublishers } = useAsyncData(
    () => user ? fetchFollowedPublishers(user.id) : Promise.resolve([]),
    [user?.id],
  );
  const shorts = useMemo(
    () => rankPublishedShorts((clips ?? []).filter(isPlayableShort), followedPublishers ?? [], 60),
    [clips, followedPublishers],
  );

  useEffect(() => {
    const root = feedRef.current;
    if (!root || !shorts.length) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.62) {
          const index = Number((entry.target as HTMLElement).dataset.shortIndex);
          if (Number.isInteger(index)) setActiveIndex(index);
        }
      }
    }, { root, threshold: [0.35, 0.62, 0.82], rootMargin: '-4% 0px -4% 0px' });
    root.querySelectorAll<HTMLElement>('[data-short-index]').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [shorts]);

  return (
    <main className="cinema-shorts-page mx-auto w-full max-w-[92rem] px-3 pb-5 sm:px-6 lg:px-10">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <a href="/" aria-label="Back To Cinema Home" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[.035] text-white transition hover:border-sky-200/50 hover:bg-sky-300/10"><ArrowLeft className="h-4 w-4" /></a>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-sky-200">A Vertical Video Destination</p><h1 className="text-2xl font-black tracking-tight text-white">Shorts</h1></div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-sky-200/15 bg-sky-300/[.06] px-3 py-2 text-[10px] font-bold text-sky-100"><Sparkles className="h-3.5 w-3.5" /> Fresh · Followed · Diverse</div>
      </header>
      {loading && !clips && <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[.025] p-6"><LoadingState label="Loading Cinema Shorts" /></div>}
      {error && !clips && <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[.025] p-6"><ErrorState onRetry={reload} description="Cinema Shorts Could Not Load. Try Again In A Moment." /></div>}
      {clips && shorts.length === 0 && <section className="cinema-category-live-hero relative mx-auto grid min-h-[32rem] max-w-2xl place-items-center overflow-hidden rounded-[1.7rem] border border-sky-200/20 p-8 text-center"><div className="relative z-10 max-w-md"><Clapperboard className="mx-auto h-10 w-10 text-sky-200" /><h2 className="mt-4 text-2xl font-black text-white">The Shorts Feed Is Getting Ready</h2><p className="mt-2 text-sm leading-6 text-slate-300">Approved, playable creator and publisher Shorts will appear here. No broken placeholders or unrelated long-form videos.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-bold text-white"><RefreshCw className="h-3.5 w-3.5" /> Refresh Feed</button><a href="/creator/shorts" className="rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white">Submit A Short</a></div></div></section>}
      {shorts.length > 0 && (
        <div ref={feedRef} className="cinema-shorts-feed mx-auto max-w-[34rem]" aria-label="Scroll Cinema Shorts vertically">
          {shorts.map((clip, index) => (
            <div key={clip.id} data-short-index={index} className="cinema-shorts-feed__slot">
              <ShortFeedItem clip={clip} active={index === activeIndex} onDetails={setActiveDetails} />
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500"><ChevronDown className="h-3.5 w-3.5" /> Keep Scrolling For More</div>
        </div>
      )}
      {activeDetails && <ShortViewer clip={activeDetails} onClose={() => setActiveDetails(null)} />}
    </main>
  );
}
