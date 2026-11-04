import { useState } from 'react';
import { BookmarkCheck, Play } from 'lucide-react';
import { ShortCard } from '@/components/discover/ShortCard';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchSavedDiscoverClips, type DiscoverClip } from '@/lib/clips';

export function SavedShortsShelf({ userId }: { userId: string }) {
  const { data: clips, error, loading, reload } = useAsyncData(() => fetchSavedDiscoverClips(userId), [userId]);
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);

  return (
    <section id="my-saved-shorts" className="scroll-mt-24 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cinema-300">Your Explore Collection</p>
          <h2 className="text-xl font-extrabold text-white sm:text-2xl">Saved Shorts</h2>
          <p className="mt-1 text-sm text-slate-400">Short-form videos you have saved from Explore and Cinema Shorts.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100">
          <BookmarkCheck className="h-4 w-4" /> {clips?.length ?? 0} Saved
        </span>
      </div>
      {loading && !clips && <LoadingState label="Loading your saved Shorts" />}
      {error && <ErrorState onRetry={reload} description="Your saved Shorts could not be loaded right now." />}
      {!loading && !error && clips?.length === 0 && (
        <div className="rounded-3xl border border-blue-300/25 bg-[linear-gradient(120deg,#102e58,#0b1c35_58%,#080d17)] p-5 shadow-[0_16px_48px_rgba(20,90,200,.14)]">
          <EmptyState icon={<Play className="h-7 w-7 text-blue-200" />} title="Your Saved Shorts Will Appear Here" description="Save a short-form video from Explore or the Shorts player to keep it in My Cinema." />
        </div>
      )}
      {clips && clips.length > 0 && (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {clips.map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActiveShort} />)}
        </div>
      )}
      {activeShort && <ShortViewer clip={activeShort} onClose={() => { setActiveShort(null); reload(); }} />}
    </section>
  );
}
