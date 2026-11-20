import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { buildRecommendations } from '@/lib/recommendations';

/**
 * Explore uses the same first-party taste signals and ranking engine as Home.
 * It keeps a broad cross-format mix so personalisation guides discovery rather
 * than locking viewers into a single category.
 */
export function PersonalizedExploreSection() {
  const { user } = useAuth();
  const { progress, watchlistIds, favouriteIds } = useLibrary();
  const { data: titles } = useAsyncData(fetchPublishedTitles, []);
  const { data: trackedPublishers } = useAsyncData(
    () => user ? fetchFollowedPublishers(user.id) : Promise.resolve([] as string[]),
    [user?.id],
  );

  const recommendations = useMemo(() => {
    if (!titles?.length) return [];
    return buildRecommendations(
      titles,
      progress,
      watchlistIds,
      favouriteIds,
      trackedPublishers ?? [],
      18,
    ).titles;
  }, [titles, progress, watchlistIds, favouriteIds, trackedPublishers]);

  const groups = useMemo(() => {
    const types = [
      { type: 'news', heading: 'News & Current Affairs To Explore' },
      { type: 'sport', heading: 'Sports & Live Coverage To Explore' },
      { type: 'live', heading: 'Live Television To Explore' },
      { type: 'movie', heading: 'Movies & Series To Explore' },
    ] as const;
    return types.map((group) => ({
      ...group,
      titles: recommendations.filter((title) => title.type === group.type),
    })).filter((group) => group.titles.length > 0);
  }, [recommendations]);

  if (!titles) return null;

  return (
    <section className="space-y-5" aria-labelledby="personalized-explore-heading">
      <div>
        <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-cinema-300">
          <Sparkles className="h-3.5 w-3.5" /> Shaped Around Your Cinema
        </p>
        <h2 id="personalized-explore-heading" className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Explore Around Your Interests
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          A shared mix informed by your viewing progress, saved titles, favourites and tracked publishers—while keeping other kinds of stories in reach.
        </p>
      </div>
      {groups.length > 0 ? groups.map((group) => (
        <TitleRow key={group.type} heading={group.heading} titles={group.titles} landscape />
      )) : (
        <div className="rounded-2xl border border-white/10 p-5">
          <h3 className="font-bold text-white">Your Discovery Mix Is Taking Shape</h3>
          <p className="mt-1 text-sm text-slate-400">Explore stories across Cinema and save favourites or track publishers to make these picks more relevant.</p>
        </div>
      )}
    </section>
  );
}
