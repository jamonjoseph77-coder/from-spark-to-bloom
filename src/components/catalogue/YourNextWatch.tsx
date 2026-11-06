import { useMemo } from 'react';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useLibrary } from '@/hooks/useLibrary';
import { fetchPublishedTitles } from '@/lib/library';
import { buildRecommendations } from '@/lib/recommendations';
import type { TitleType } from '@/lib/types';
import type { TmdbMediaType } from '@/lib/tmdb';

interface YourNextWatchProps {
  titleTypes: TitleType[];
  categoryLabel: string;
  genreTerms?: string[];
  fallbackMediaType?: TmdbMediaType;
  fallbackGenreId?: number;
  heading?: string;
}

export function YourNextWatch({ titleTypes, categoryLabel, genreTerms, fallbackMediaType, fallbackGenreId, heading = 'Your Next Watch' }: YourNextWatchProps) {
  const { progress, watchlistIds, favouriteIds } = useLibrary();
  const { data: titles } = useAsyncData(fetchPublishedTitles, []);
  const picks = useMemo(() => {
    if (!titles) return [];
    const recommended = buildRecommendations(titles, progress, watchlistIds, favouriteIds, []).titles;
    return recommended.filter((title) => {
      if (!titleTypes.includes(title.type)) return false;
      if (!genreTerms?.length) return true;
      const searchable = `${title.genre} ${title.title} ${title.synopsis}`.toLocaleLowerCase();
      return genreTerms.some((term) => searchable.includes(term.toLocaleLowerCase()));
    }).slice(0, 12);
  }, [titles, progress, watchlistIds, favouriteIds, titleTypes, genreTerms]);

  return (
    <section className="space-y-4">
      {picks.length > 0 ? (
        <TitleRow heading={heading} description={`A personal shortlist from the ${categoryLabel.toLocaleLowerCase()} available in Cinema, shaped by your viewing and saved titles.`} titles={picks} landscape />
      ) : fallbackMediaType ? (
        <TmdbRow heading={heading} description={`A fresh ${categoryLabel.toLocaleLowerCase()} discovery to help you choose what to explore next.`} mediaType={fallbackMediaType} list="trending" genreId={fallbackGenreId} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">{heading}</p><h2 className="mt-2 text-xl font-extrabold text-white">Your {categoryLabel} Picks Will Grow With You</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">As you watch, save favourites and add stories to My Cinema, this space can surface more relevant {categoryLabel.toLocaleLowerCase()} from Cinema’s published catalogue.</p></div>
      )}
    </section>
  );
}
