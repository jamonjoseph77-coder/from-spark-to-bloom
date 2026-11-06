import type { ReactNode } from 'react';
import { TmdbCard } from '@/components/tmdb/TmdbCard';
import { TmdbErrorState } from '@/components/tmdb/TmdbErrorState';
import { LoadingState } from '@/components/ui/StatusViews';
import { SECTION_HEADING } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchTmdbList, type TmdbListKind, type TmdbMediaType } from '@/lib/tmdb';
import { fetchPublishedTitles } from '@/lib/library';

interface TmdbRowProps { heading: string; description?: string; mediaType: TmdbMediaType; list: TmdbListKind; genreId?: number; action?: ReactNode }

export function TmdbRow({ heading, description, mediaType, list, genreId = 0, action }: TmdbRowProps) {
  const { data: items, error, reload } = useAsyncData(() => fetchTmdbList(mediaType, list, genreId), [mediaType, list, genreId]);
  const { data: localTitles } = useAsyncData(fetchPublishedTitles, []);
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div><h2 className={`${SECTION_HEADING} flex items-center gap-3`}><span className="h-6 w-1 shrink-0 rounded-full bg-cinema-400" aria-hidden="true" />{heading}</h2>{description && <p className="mt-1 text-sm text-slate-400">{description}</p>}</div>
        {action}
      </div>
      {!items && !error && <LoadingState label="Finding stories" />}
      {!items && error && <TmdbErrorState error={error} onRetry={reload} />}
      {items && items.length === 0 && <p className="rounded-2xl border border-white/10 bg-ink-850/60 p-6 text-center text-sm text-slate-400">Nothing to show here just yet.</p>}
      {items && items.length > 0 && <div className="w-full min-w-0 max-w-full overflow-hidden"><div role="region" aria-label={`${heading} titles`} tabIndex={0} className="flex w-full min-w-0 max-w-full snap-x snap-mandatory touch-pan-x gap-4 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.map((item) => <div key={`${item.mediaType}-${item.id}`} className="w-36 flex-none snap-start sm:w-44 lg:w-48"><TmdbCard item={item} localTitles={localTitles ?? []} /></div>)}</div>}
    </section>
  );
}
