import type { Title } from '@/lib/types';
import { tmdbHref, type TmdbItem } from '@/lib/tmdb';

function normaliseTitle(value: string): string {
  return value.normalize('NFKD').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Link external catalogue metadata to an existing Cinema title only when the
 * identity is unambiguous: same media type, exact normalized title, and (when
 * available) the same release year. Ambiguous remakes stay separate.
 */
export function findCanonicalCinemaTitle(item: TmdbItem, titles: Title[]): Title | null {
  const expectedType = item.mediaType === 'movie' ? 'movie' : 'series';
  const normalized = normaliseTitle(item.title);
  if (!normalized) return null;
  const year = item.releaseDate ? Number(item.releaseDate.slice(0, 4)) : null;
  const matches = titles.filter((title) => {
    if (title.type !== expectedType || normaliseTitle(title.title) !== normalized) return false;
    const localYear = title.release_year ?? (title.release_date ? Number(title.release_date.slice(0, 4)) : null);
    return year === null ? true : localYear === year;
  });
  if (matches.length !== 1) return null;
  const match = matches[0];
  if (year !== null && match.release_year !== null && match.release_year !== year) return null;
  return match;
}

export function canonicalCinemaHref(item: TmdbItem, titles: Title[] = []): string {
  const match = findCanonicalCinemaTitle(item, titles);
  return match ? `/title/${match.id}` : tmdbHref(item);
}
