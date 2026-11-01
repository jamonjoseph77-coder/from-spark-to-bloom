import { createServerFn } from "@tanstack/react-start";

const TMDB_BASE = "https://api.themoviedb.org/3";
const MEDIA_TYPES = ["movie", "tv"];
const LIST_KINDS = ["popular", "trending"];

type RequestBody = { action?: unknown; type?: unknown; list?: unknown; genre?: unknown; page?: unknown; query?: unknown; id?: unknown };
type Upstream = { path: string; params: Record<string, string> };

function asInteger(value: unknown, min: number, max: number, fallback?: number): number | null {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

function asMediaType(value: unknown): string | null {
  return typeof value === "string" && MEDIA_TYPES.includes(value) ? value : null;
}

function buildRequest(body: RequestBody): Upstream | { error: string } {
  const type = asMediaType(body.type);
  const page = asInteger(body.page, 1, 500, 1);
  if (body.action === "list") {
    if (!type) return { error: "Unknown media type." };
    if (page === null) return { error: "Page must be between 1 and 500." };
    const genre = asInteger(body.genre, 1, 100000, 0);
    if (genre === null) return { error: "Genre is not valid." };
    if (genre > 0) {
      return { path: `/discover/${type}`, params: { with_genres: String(genre), sort_by: "popularity.desc", include_adult: "false", page: String(page) } };
    }
    if (typeof body.list !== "string" || !LIST_KINDS.includes(body.list)) return { error: "List must be popular or trending." };
    if (body.list === "trending") return { path: `/trending/${type}/week`, params: { page: String(page) } };
    return { path: `/${type}/popular`, params: { page: String(page) } };
  }
  if (body.action === "search") {
    if (!type) return { error: "Unknown media type." };
    if (page === null) return { error: "Page must be between 1 and 500." };
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 1 || query.length > 120) return { error: "Search text must be 1 to 120 characters." };
    return { path: `/search/${type}`, params: { query, include_adult: "false", page: String(page) } };
  }
  if (body.action === "details") {
    if (!type) return { error: "Unknown media type." };
    const id = asInteger(body.id, 1, 2147483647);
    if (id === null) return { error: "Title id is not valid." };
    return { path: `/${type}/${id}`, params: {} };
  }
  if (body.action === "genres") {
    if (!type) return { error: "Unknown media type." };
    return { path: `/genre/${type}/list`, params: {} };
  }
  return { error: "Unknown request." };
}


export type TmdbCallResult =
  | { ok: true; json: string }
  | { ok: false; reason: "not_configured" | "unavailable"; message: string };

export const callTmdbServer = createServerFn({ method: "POST" })
  .inputValidator((input: RequestBody) => input)
  .handler(async ({ data: body }): Promise<TmdbCallResult> => {
    const readToken = process.env.TMDB_READ_ACCESS_TOKEN;
    const apiKey = process.env.TMDB_API_KEY;
    if (!readToken && !apiKey) {
      return { ok: false, reason: "not_configured", message: "TMDB is not configured." };
    }
    const built = buildRequest(body);
    if ("error" in built) return { ok: false, reason: "unavailable", message: built.error };
    const url = new URL(`${TMDB_BASE}${built.path}`);
    Object.entries(built.params).forEach(([key, value]) => url.searchParams.set(key, value));
    const headers: Record<string, string> = { Accept: "application/json" };
    if (readToken) headers.Authorization = `Bearer ${readToken}`;
    else url.searchParams.set("api_key", apiKey as string);
    try {
      const upstream = await fetch(url, { headers });
      if (!upstream.ok) return { ok: false, reason: "unavailable", message: `TMDB returned ${upstream.status}` };
      return { ok: true, json: await upstream.text() };
    } catch (error) {
      console.error("tmdb request failed", error);
      return { ok: false, reason: "unavailable", message: "TMDB request failed." };
    }
  });
