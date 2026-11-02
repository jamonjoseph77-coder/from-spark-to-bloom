import { callKinoCheckServer } from "@/lib/kinocheck.functions";
import type { TmdbMediaType, TmdbItem } from "@/lib/tmdb";

export interface KinoCheckVideo {
  id: string;
  youtubeVideoId: string;
  title: string;
  categories: string[];
  thumbnail: string;
  published: string;
  language: string;
  views: number | null;
}

export interface KinoCheckTitleVideos {
  videos: KinoCheckVideo[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function safeVideoId(value: unknown): string {
  const id = asText(value);
  return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : "";
}

export async function fetchKinoCheckVideos(mediaType: TmdbMediaType, tmdbId: number): Promise<KinoCheckVideo[]> {
  let result;
  try {
    result = await callKinoCheckServer({ data: { type: mediaType, id: tmdbId } });
  } catch {
    return [];
  }
  if (!result.ok) return [];

  try {
    const payload: unknown = JSON.parse(result.json);
    if (!isRecord(payload) || !Array.isArray(payload.videos)) return [];
    const videos = payload.videos.flatMap((raw): KinoCheckVideo[] => {
      if (!isRecord(raw)) return [];
      const id = asText(raw.id);
      const youtubeVideoId = safeVideoId(raw.youtube_video_id);
      const title = asText(raw.title);
      const categories = Array.isArray(raw.categories)
        ? raw.categories.filter((value): value is string => typeof value === "string")
        : [];
      if (!id || !youtubeVideoId || !title || categories.length === 0) return [];
      const viewsValue = Number(raw.views);
      return [{
        id,
        youtubeVideoId,
        title,
        categories,
        thumbnail: asText(raw.youtube_thumbnail) || asText(raw.thumbnail),
        published: asText(raw.published),
        language: asText(raw.language),
        views: Number.isFinite(viewsValue) ? viewsValue : null,
      }];
    });
    return videos;
  } catch {
    return [];
  }
}

export interface KinoCheckDiscoverVideo extends KinoCheckVideo {
  mediaType: TmdbMediaType;
  tmdbId: number;
  titleName: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
}

export async function fetchDiscoverKinoCheckVideos(
  trending: TmdbItem[],
  perTitle = 3,
): Promise<KinoCheckDiscoverVideo[]> {
  const candidates = trending.slice(0, Math.max(1, Math.min(8, perTitle * 2)));
  const results = await Promise.all(candidates.map(async (item) => {
    const videos = await fetchKinoCheckVideos(item.mediaType, item.id);
    return videos
      .filter((video) => video.categories.some((category) => ["Featurette", "Clip"].includes(category)))
      .filter((video) => !video.categories.includes("Trailer"))
      .slice(0, 4)
      .map((video) => ({
        ...video,
        mediaType: item.mediaType,
        tmdbId: item.id,
        titleName: item.title,
        overview: item.overview,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
      }));
  }));
  const seen = new Set<string>();
  return results.flat().filter((video) => {
    if (seen.has(video.youtubeVideoId)) return false;
    seen.add(video.youtubeVideoId);
    return true;
  });
}
