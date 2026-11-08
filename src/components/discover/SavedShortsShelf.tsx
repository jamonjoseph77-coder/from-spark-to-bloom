import { useEffect, useState } from 'react';
import { BookmarkCheck, Play } from 'lucide-react';
import { ShortCard } from '@/components/discover/ShortCard';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchSavedDiscoverClips, type DiscoverClip } from '@/lib/clips';

export function SavedShortsShelf({ userId }: { userId: string }) {
  const { data: clips, error, loading, reload } = useAsyncData(() => fetchSavedDiscoverClips(userId), [userId]);
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [reload]);

  return (
    <section id="my-saved-shorts" className="scroll-mt-24 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cinema-300">Your Explore Collection</p>
          <h2 className="text-xl font-extrabold text-white sm:text-2xl">Saved Shorts</h2>
          <p className="mt-1 text-sm text-slate-400">Short-form videos you have saved from Explore and Cinema Shorts.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#a8cbb6]/25 bg-[#a8cbb6]/10 px-3 py-2 text-xs font-semibold text-[#d2e4d8]">
          <BookmarkCheck className="h-4 w-4" /> {clips?.length ?? 0} Saved
        </span>
      </div>
      {loading && !clips && <LoadingState label="Loading your saved Shorts" />}
      {error && <ErrorState onRetry={reload} description="Your saved Shorts could not be loaded right now." />}
      {!loading && !error && clips?.length === 0 && (
        <div className="rounded-3xl border border-[#91b7a2]/20 bg-[radial-gradient(ellipse_at_90%_0%,rgba(116,164,137,.14),transparent_44%),linear-gradient(125deg,#202a24,#151d19_58%,#121815)] p-5 shadow-[0_16px_48px_rgba(0,0,0,.16)]">
          <EmptyState icon={<Play className="h-7 w-7 text-[#b9d2c2]" />} title="Your Saved Shorts Will Appear Here" description="Save a short-form video from Explore or the Shorts player to keep it in My Cinema." />
        </div>
      )}
      {clips && clips.length > 0 && (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {clips.map((clip) => (
            <div key={clip.id} className="w-[min(42vw,168px)] shrink-0 space-y-2">
              <ShortCard clip={clip} onOpen={setActiveShort} />
              {clip.title && (
                <a
                  href={`/title/${clip.title.id}`}
                  className="block rounded-xl border border-[#91b7a2]/20 bg-[#1b2922]/75 px-3 py-2.5 text-[11px] font-bold leading-4 text-[#c8e0d1] transition hover:border-[#91b7a2]/45 hover:bg-[#23372c]"
                >
                  <span className="block text-[9px] font-extrabold uppercase tracking-[.14em] text-[#91b7a2]">Related Full Title</span>
                  <span className="mt-1 block line-clamp-2">{clip.title.title}</span>
                  <span className="mt-1 block text-white/75">View Title →</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {activeShort && <ShortViewer clip={activeShort} onClose={() => { setActiveShort(null); reload(); }} />}
    </section>
  );
}
