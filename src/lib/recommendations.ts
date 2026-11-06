import type { Title, WatchProgress } from '@/lib/types';

export interface RecommendationResult {
  titles: Title[];
  reason: string;
}

export type PersonalizedSection = 'movies' | 'shorts' | 'news' | 'documentaries' | 'animation' | 'family' | 'reality' | 'sports' | 'live-tv';

interface TasteProfile {
  genre: Map<string, number>;
  publisher: Map<string, number>;
  type: Map<string, number>;
  watched: Set<string>;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function genres(value: string): string[] {
  return value.split(',').map(normalize).filter(Boolean);
}

function add(map: Map<string, number>, key: string, weight: number): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + weight);
}

function maxValue(map: Map<string, number>): number {
  return Math.max(1, ...map.values());
}

function createTasteProfile(
  titles: Title[],
  progress: WatchProgress[],
  watchlistIds: ReadonlySet<string>,
  favouriteIds: ReadonlySet<string>,
): TasteProfile {
  const byId = new Map(titles.map((title) => [title.id, title]));
  const profile: TasteProfile = {
    genre: new Map(),
    publisher: new Map(),
    type: new Map(),
    watched: new Set(),
  };

  const now = Date.now();
  [...progress]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .forEach((entry) => {
      const source = byId.get(entry.title_id);
      if (!source) return;
      profile.watched.add(source.id);

      const ageDays = Math.max(0, (now - new Date(entry.updated_at).getTime()) / 86_400_000);
      const recency = Math.exp(-ageDays / 45);
      const completion = entry.completed ? 0.85 : 1;
      const progressRatio = entry.duration_seconds > 0
        ? Math.min(1, Math.max(0, entry.position_seconds / entry.duration_seconds))
        : 0.5;
      const engagement = 0.55 + progressRatio * 0.45;
      const weight = 3.5 * recency * completion * engagement;

      genres(source.genre).forEach((genre) => add(profile.genre, genre, weight));
      add(profile.publisher, normalize(source.publisher), weight * 0.7);
      add(profile.type, source.type, weight * 0.55);
    });

  [...watchlistIds].forEach((id) => {
    const source = byId.get(id);
    if (!source) return;
    genres(source.genre).forEach((genre) => add(profile.genre, genre, 2.2));
    add(profile.publisher, normalize(source.publisher), 1.8);
    add(profile.type, source.type, 1.1);
  });

  [...favouriteIds].forEach((id) => {
    const source = byId.get(id);
    if (!source) return;
    genres(source.genre).forEach((genre) => add(profile.genre, genre, 4));
    add(profile.publisher, normalize(source.publisher), 3.2);
    add(profile.type, source.type, 2);
  });

  return profile;
}

function primaryGenre(title: Title): string {
  return genres(title.genre)[0] ?? 'other';
}

function freshness(title: Title, now: number): number {
  const timestamp = new Date(title.created_at).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  const ageDays = Math.max(0, (now - timestamp) / 86_400_000);
  return Math.exp(-ageDays / 180);
}

function scoreTitle(
  title: Title,
  profile: TasteProfile,
  followed: ReadonlySet<string>,
  now: number,
): number {
  const genreMax = maxValue(profile.genre);
  const publisherMax = maxValue(profile.publisher);
  const typeMax = maxValue(profile.type);

  const genreAffinity = genres(title.genre).reduce(
    (sum, genre) => sum + (profile.genre.get(genre) ?? 0) / genreMax,
    0,
  ) / Math.max(1, genres(title.genre).length);
  const publisher = normalize(title.publisher);
  const publisherAffinity = (profile.publisher.get(publisher) ?? 0) / publisherMax;
  const typeAffinity = (profile.type.get(title.type) ?? 0) / typeMax;
  const followedPublisher = followed.has(publisher) ? 1 : 0;
  const knownType = profile.type.has(title.type);
  const knownGenre = genres(title.genre).some((genre) => profile.genre.has(genre));
  const exploration = (knownType ? 0 : 1.2) + (knownGenre ? 0 : 0.8);
  const featured = title.is_featured ? 1 : 0;

  return (
    genreAffinity * 8 +
    publisherAffinity * 4 +
    typeAffinity * 2.5 +
    followedPublisher * 5 +
    freshness(title, now) * 1.4 +
    featured * 0.8 +
    exploration
  );
}

/**
 * Ranks published Cinema titles using first-party viewing, saved-title and
 * publisher-follow signals. Selection adds genre/publisher diversity so one
 * popular studio or genre cannot dominate the entire recommendation shelf.
 */
export function buildRecommendations(
  titles: Title[],
  progress: WatchProgress[],
  watchlistIds: ReadonlySet<string>,
  favouriteIds: ReadonlySet<string>,
  followedPublishers: string[],
  limit = 12,
): RecommendationResult {
  if (!titles.length || limit <= 0) {
    return { titles: [], reason: 'New stories from across Cinema.' };
  }

  const profile = createTasteProfile(titles, progress, watchlistIds, favouriteIds);
  const followed = new Set(followedPublishers.map(normalize).filter(Boolean));
  const now = Date.now();
  const ranked = titles
    .filter((title) => title.is_published && !profile.watched.has(title.id))
    .map((title) => ({ title, score: scoreTitle(title, profile, followed, now) }))
    .sort((a, b) => b.score - a.score || b.title.created_at.localeCompare(a.title.created_at));

  const selected: Title[] = [];
  const publisherCounts = new Map<string, number>();
  const genreCounts = new Map<string, number>();
  const remaining = [...ranked];

  while (selected.length < limit && remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    remaining.forEach((entry, index) => {
      const publisher = normalize(entry.title.publisher);
      const genre = primaryGenre(entry.title);
      const publisherCount = publisherCounts.get(publisher) ?? 0;
      const genreCount = genreCounts.get(genre) ?? 0;
      const diversityBonus = (publisherCount === 0 ? 1.25 : 0) + (genreCount === 0 ? 1.1 : 0);
      const repetitionPenalty = Math.max(0, publisherCount - 1) * 2 + Math.max(0, genreCount - 2) * 1.2;
      const adjusted = entry.score + diversityBonus - repetitionPenalty;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIndex = index;
      }
    });

    const [chosen] = remaining.splice(bestIndex, 1);
    selected.push(chosen.title);
    const publisher = normalize(chosen.title.publisher);
    const genre = primaryGenre(chosen.title);
    publisherCounts.set(publisher, (publisherCounts.get(publisher) ?? 0) + 1);
    genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
  }

  const hasSignals = profile.genre.size > 0 || profile.publisher.size > 0 || followed.size > 0;
  return {
    titles: selected,
    reason: hasSignals
      ? 'Chosen from your viewing, saved stories, favourite genres and followed publishers—with room for new discoveries.'
      : 'A balanced mix of fresh, featured and varied stories to help you discover Cinema.',
  };
}

/**
 * Suggests a personalized order for Home destinations. It only reorders
 * existing sections; it never hides or removes a Cinema destination.
 */
export function buildPersonalizedSectionOrder(
  titles: Title[],
  progress: WatchProgress[],
  watchlistIds: ReadonlySet<string>,
  favouriteIds: ReadonlySet<string>,
  followedPublishers: string[],
): PersonalizedSection[] {
  const defaults: PersonalizedSection[] = [
    'movies', 'shorts', 'news', 'documentaries', 'animation',
    'family', 'reality', 'sports', 'live-tv',
  ];
  if (!titles.length) return defaults;

  const profile = createTasteProfile(titles, progress, watchlistIds, favouriteIds);
  const followed = new Set(followedPublishers.map(normalize).filter(Boolean));
  const scores = new Map<PersonalizedSection, number>(defaults.map((section) => [section, 0]));

  const sectionFor = (title: Title): PersonalizedSection[] => {
    const result: PersonalizedSection[] = [];
    if (title.type === 'movie' || title.type === 'series') result.push('movies');
    if (title.type === 'news') result.push('news');
    if (title.type === 'sport') result.push('sports');
    if (title.type === 'live') result.push('live-tv');
    const titleGenres = genres(title.genre);
    if (titleGenres.some((genre) => genre.includes('documentary'))) result.push('documentaries');
    if (titleGenres.some((genre) => genre.includes('animation') || genre === 'anime')) result.push('animation');
    if (titleGenres.some((genre) => genre.includes('family') || genre.includes('kids'))) result.push('family');
    if (titleGenres.some((genre) => genre.includes('reality'))) result.push('reality');
    return result;
  };

  titles.forEach((title) => {
    const publisherWeight = (profile.publisher.get(normalize(title.publisher)) ?? 0) > 0
      || followed.has(normalize(title.publisher)) ? 1.5 : 0;
    const affinity = genres(title.genre).reduce((sum, genre) => sum + (profile.genre.get(genre) ?? 0), 0);
    const typeAffinity = profile.type.get(title.type) ?? 0;
    const signal = affinity + typeAffinity + publisherWeight;
    if (signal <= 0) return;
    sectionFor(title).forEach((section) => scores.set(section, (scores.get(section) ?? 0) + signal));
  });

  return defaults
    .map((section, index) => ({ section, index, score: scores.get(section) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ section }) => section);
}
