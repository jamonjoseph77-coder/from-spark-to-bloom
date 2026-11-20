import { isDirectVideoUrl, toEmbedUrl } from "@/lib/media";

export type PlayableCatalogueSeason = {
  title_id: string;
  episodes?: { playback_url: string | null }[] | null;
};

export function isPlayableMediaSource(value: string | null | undefined): boolean {
  const source = value?.trim() ?? "";
  return Boolean(source) && (isDirectVideoUrl(source) || Boolean(toEmbedUrl(source)));
}

export function filterPlayableCatalogueTitles<T extends { id: string; type: string; playback_url: string | null }>(
  titles: T[],
  seasons: PlayableCatalogueSeason[],
  isPlayable: (source: string | null | undefined) => boolean = isPlayableMediaSource,
): T[] {
  const playableSeriesIds = new Set(
    seasons.filter((season) => season.episodes?.some((episode) => isPlayable(episode.playback_url)))
      .map((season) => season.title_id),
  );
  return titles.filter((title) => title.type === "series"
    ? playableSeriesIds.has(title.id)
    : isPlayable(title.playback_url));
}
