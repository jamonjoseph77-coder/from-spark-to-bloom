import type { Title, WatchProgress } from '@/lib/types';

export interface RecommendationResult {
  titles: Title[];
  reason: string;
}

function genres(value: string): string[] {
  return value.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean);
}

export function buildRecommendations(
  titles: Title[],
  progress: WatchProgress[],
  watchlistIds: ReadonlySet<string>,
  favouriteIds: ReadonlySet<string>,
  followedPublishers: string[],
  limit = 12,
): RecommendationResult {
  if (!titles.length) return { titles: [], reason: 'New stories from across Cinema.' };

  const byId = new Map(titles.map((title) => [title.id, title]));
  const genreWeights = new Map<string, number>();
  const publisherWeights = new Map<string, number>();
  const typeWeights = new Map<string, number>();
  const recentlyWatched = new Set<string>();

  [...progress].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).forEach((entry, index) => {
    const source = byId.get(entry.title_id);
    if (!source) return;
    const weight = entry.completed ? 2 : Math.max(1, 4 - index * 0.25);
    recentlyWatched.add(source.id);
    genres(source.genre).forEach((genre) => genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + weight));
    publisherWeights.set(source.publisher.toLowerCase(), (publisherWeights.get(source.publisher.toLowerCase()) ?? 0) + weight * 0.8);
    typeWeights.set(source.type, (typeWeights.get(source.type) ?? 0) + weight * 0.45);
  });

  [...watchlistIds, ...favouriteIds].forEach((id) => {
    const source = byId.get(id);
    if (!source) return;
    const weight = favouriteIds.has(id) ? 4 : 2.5;
    genres(source.genre).forEach((genre) => genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + weight));
    publisherWeights.set(source.publisher.toLowerCase(), (publisherWeights.get(source.publisher.toLowerCase()) ?? 0) + weight);
    typeWeights.set(source.type, (typeWeights.get(source.type) ?? 0) + weight * 0.5);
  });

  const followed = new Set(followedPublishers.map((name) => name.trim().toLowerCase()));
  const ranked = titles
    .filter((title) => !recentlyWatched.has(title.id))
    .map((title) => {
      const genreScore = genres(title.genre).reduce((sum, genre) => sum + (genreWeights.get(genre) ?? 0), 0);
      const publisherScore = (publisherWeights.get(title.publisher.toLowerCase()) ?? 0) * 1.25;
      const followedScore = followed.has(title.publisher.toLowerCase()) ? 8 : 0;
      const typeScore = typeWeights.get(title.type) ?? 0;
      const featuredScore = title.is_featured ? 1.5 : 0;
      const ageInDays = Math.max(0, (Date.now() - new Date(title.created_at).getTime()) / 86400000);
      const freshnessScore = Math.max(0, 1 - ageInDays / 365);
      const score = genreScore + publisherScore + followedScore + typeScore + featuredScore + freshnessScore;
      return { title, score };
    })
    .sort((a, b) => b.score - a.score || b.title.created_at.localeCompare(a.title.created_at));

  const selected = ranked.slice(0, limit).map((entry) => entry.title);
  const hasSignals = genreWeights.size > 0 || publisherWeights.size > 0 || followed.size > 0;
  return {
    titles: selected,
    reason: hasSignals
      ? 'Picked from the genres, studios and stories you have saved or watched.'
      : 'A balanced mix of featured and recently added stories to help you discover Cinema.',
  };
}
