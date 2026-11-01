import { callTmdbServer } from '@/lib/tmdb.functions';

export type TmdbMediaType = 'movie' | 'tv';
export type TmdbListKind = 'popular' | 'trending';
export type TmdbErrorReason = 'not_configured' | 'unavailable';
export type TmdbImageSize = 'w185' | 'w342' | 'w500' | 'w780' | 'w1280';

export class TmdbError extends Error {
  readonly reason: TmdbErrorReason;

  constructor(reason: TmdbErrorReason, message: string) {
    super(message);
    this.name = 'TmdbError';
    this.reason = reason;
  }
}

export interface TmdbItem {
  id: number;
  mediaType: TmdbMediaType;
  title: string;
  overview: string;
  releaseDate: string | null;
  rating: number | null;
  posterPath: string | null;
  backdropPath: string | null;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbTrailer extends TmdbItem {
  videoKey: string;
  videoName: string;
}

export interface TmdbDetail extends TmdbItem {
  videos: TmdbVideo[];
  genres: string[];
  runtimeMinutes: number | null;
  seasons: number | null;
  episodes: number | null;
  tagline: string;
  status: string;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

type TmdbRecord = Record<string, unknown>;

const IMAGE_BASE = 'https://image.tmdb.org/t/p/';
const IMAGE_PATH = /^\/[A-Za-z0-9_.-]+\.(jpg|jpeg|png|webp)$/i;

export function tmdbHref(item: TmdbItem): string {
  return `/tmdb/${item.mediaType}/${item.id}`;
}

export function tmdbYear(item: TmdbItem): string {
  return item.releaseDate ? item.releaseDate.slice(0, 4) : '';
}

export function tmdbImageUrl(path: string | null, size: TmdbImageSize): string {
  return path && IMAGE_PATH.test(path) ? `${IMAGE_BASE}${size}${path}` : '';
}

function isRecord(value: unknown): value is TmdbRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function positiveNumber(value: unknown): number | null {
  const number = finiteNumber(value);
  return number !== null && number > 0 ? number : null;
}

async function callTmdb(body: Record<string, unknown>): Promise<unknown> {
  let result;
  try {
    result = await callTmdbServer({ data: body });
  } catch {
    throw new TmdbError('unavailable', 'TMDB request failed.');
  }
  if (!result.ok) throw new TmdbError(result.reason, result.message);
  return JSON.parse(result.json) as unknown;
}

function toItem(raw: unknown, mediaType: TmdbMediaType): TmdbItem | null {
  if (!isRecord(raw)) return null;
  const id = finiteNumber(raw.id);
  const title = text(mediaType === 'movie' ? raw.title : raw.name);
  if (id === null || !title) return null;
  return {
    id,
    mediaType,
    title,
    overview: text(raw.overview),
    releaseDate: text(mediaType === 'movie' ? raw.release_date : raw.first_air_date) || null,
    rating: positiveNumber(raw.vote_average),
    posterPath: text(raw.poster_path) || null,
    backdropPath: text(raw.backdrop_path) || null,
  };
}

function parseResults(data: unknown, mediaType: TmdbMediaType): TmdbItem[] {
  if (!isRecord(data) || !Array.isArray(data.results)) {
    throw new TmdbError('unavailable', 'Unexpected TMDB response.');
  }
  return data.results
    .map((raw) => toItem(raw, mediaType))
    .filter((item): item is TmdbItem => item !== null);
}

export async function fetchTmdbList(mediaType: TmdbMediaType, list: TmdbListKind, genreId = 0): Promise<TmdbItem[]> {
  const data = await callTmdb({ action: 'list', type: mediaType, list, genre: genreId });
  return parseResults(data, mediaType);
}

export async function searchTmdb(mediaType: TmdbMediaType, query: string): Promise<TmdbItem[]> {
  const data = await callTmdb({ action: 'search', type: mediaType, query });
  return parseResults(data, mediaType);
}

export async function fetchTmdbGenres(mediaType: TmdbMediaType): Promise<TmdbGenre[]> {
  const data = await callTmdb({ action: 'genres', type: mediaType });
  if (!isRecord(data) || !Array.isArray(data.genres)) {
    throw new TmdbError('unavailable', 'Unexpected TMDB response.');
  }
  return data.genres.flatMap((raw): TmdbGenre[] => {
    if (!isRecord(raw)) return [];
    const id = finiteNumber(raw.id);
    const name = text(raw.name);
    return id !== null && name ? [{ id, name }] : [];
  });
}

export async function fetchTmdbDetail(mediaType: TmdbMediaType, id: number): Promise<TmdbDetail> {
  const data = await callTmdb({ action: 'details', type: mediaType, id });
  const item = toItem(data, mediaType);
  if (!item || !isRecord(data)) throw new TmdbError('unavailable', 'Unexpected TMDB response.');
  const episodeRuntimes: unknown[] = Array.isArray(data.episode_run_time) ? data.episode_run_time : [];
  const videoResults = isRecord(data.videos) && Array.isArray(data.videos.results) ? data.videos.results : [];
  const videos = videoResults.flatMap((raw): TmdbVideo[] => {
    if (!isRecord(raw) || text(raw.site).toLowerCase() !== 'youtube') return [];
    const id = text(raw.id);
    const key = text(raw.key);
    const name = text(raw.name);
    const type = text(raw.type);
    if (!id || !key || !name || !['Trailer', 'Teaser', 'Clip'].includes(type)) return [];
    return [{ id, key, name, site: 'YouTube', type, official: raw.official === true }];
  }).sort((a, b) => Number(b.official) - Number(a.official));
  const genres = Array.isArray(data.genres)
    ? data.genres.map((genre) => (isRecord(genre) ? text(genre.name) : '')).filter(Boolean)
    : [];
  const isSeries = mediaType === 'tv';
  return {
    ...item,
    videos,
    genres,
    runtimeMinutes: isSeries ? positiveNumber(episodeRuntimes[0]) : positiveNumber(data.runtime),
    seasons: isSeries ? positiveNumber(data.number_of_seasons) : null,
    episodes: isSeries ? positiveNumber(data.number_of_episodes) : null,
    tagline: text(data.tagline),
    status: text(data.status),
  };
}


/**
 * Returns a small, bounded set of trailers for discovery. TMDB metadata is
 * used only to locate official YouTube promotional videos; it is not a
 * streaming source or proof of distribution rights.
 */
export async function fetchDiscoverTrailers(limitPerType = 3): Promise<TmdbTrailer[]> {
  const boundedLimit = Math.max(1, Math.min(4, Math.floor(limitPerType)));
  const mediaTypes: TmdbMediaType[] = ['movie', 'tv'];
  const lists = await Promise.all(mediaTypes.map((mediaType) => fetchTmdbList(mediaType, 'trending')));
  const candidates = mediaTypes.flatMap((mediaType, index) =>
    lists[index].slice(0, boundedLimit).map((item) => ({ ...item, mediaType })),
  );
  const details = await Promise.all(candidates.map(async (item) => {
    try {
      return { item, detail: await fetchTmdbDetail(item.mediaType, item.id) };
    } catch {
      return null;
    }
  }));
  return details.flatMap((entry): TmdbTrailer[] => {
    if (!entry) return [];
    const video = entry.detail.videos.find((candidate) => candidate.official && candidate.type === 'Trailer')
      ?? entry.detail.videos.find((candidate) => candidate.type === 'Trailer');
    if (!video) return [];
    return [{ ...entry.item, videoKey: video.key, videoName: video.name }];
  });
}
