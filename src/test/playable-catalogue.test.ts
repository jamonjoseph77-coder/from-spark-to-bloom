import { describe, expect, it } from "vitest";
import { filterPlayableCatalogueTitles } from "@/lib/playable-catalogue";

const titles = [
  { id: "movie-playable", type: "movie", playback_url: "https://video.example/movie.mp4" },
  { id: "movie-missing", type: "movie", playback_url: null },
  { id: "series-playable", type: "series", playback_url: null },
  { id: "series-empty", type: "series", playback_url: null },
  { id: "live-playable", type: "live", playback_url: "https://video.example/live.m3u8" },
];
const playable = (value?: string | null) => Boolean(value?.startsWith("https://video.example/"));

describe("playable Cinema catalogue filtering", () => {
  it("includes playable non-series titles and series with at least one playable episode", () => {
    expect(filterPlayableCatalogueTitles(titles, [
      { title_id: "series-playable", episodes: [{ playback_url: "https://video.example/episode.mp4" }] },
      { title_id: "series-empty", episodes: [{ playback_url: null }, { playback_url: "https://invalid.example/embed" }] },
    ], playable).map((title) => title.id)).toEqual(["movie-playable", "series-playable", "live-playable"]);
  });
  it("does not expose titles without a supported playback source", () => {
    expect(filterPlayableCatalogueTitles(titles, [], playable).map((title) => title.id))
      .toEqual(["movie-playable", "live-playable"]);
  });
});
