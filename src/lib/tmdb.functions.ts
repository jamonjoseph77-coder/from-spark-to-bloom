import { createServerFn } from "@tanstack/react-start";

const TMDB_BASE = "https://api.themoviedb.org/3";
const MEDIA_TYPES = ["movie", "tv"];
const LIST_KINDS = ["popular", "trending"];

// Cache read-only discovery responses briefly to reduce repeat requests and speed up search.
const responseCache = new Map<string, { expiresAt: number; json: string }>();
const RESPONSE_CACHE_TTL_MS = 3 * 60 * 1000;
const MAX_CACHED_RESPONSES = 200;

type RequestBody = { action?: unknown; type?: unknown; list?: unknown; genre?: unknown; page?: unknown; query?: unknown; id?: unknown };
type Upstream = { path: string; params: Record<string, string> };

function sanitizeTmdbResponse(body: RequestBody, json: string): { json: string; restricted: boolean } {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { json, restricted: false };
    const record = parsed as Record<string, unknown>;
    if (body.action === "details") {
      return { json, restricted: record.adult === true };
    }
    if ((body.action === "list" || body.action === "search") && Array.isArray(record.results)) {
      const results = record.results.filter((item) =>
        !item || typeof item !== "object" || Array.isArray(item) || (item as Record<string, unknown>).adult !== true
      );
      return { json: JSON.stringify({ ...record, results }), restricted: false };
    }
    return { json, restricted: false };
  } catch {
    return { json, restricted: false };
  }
}

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
    const genre = body.genre === null || body.genre === undefined || body.genre === 0 ? 0 : asInteger(body.genre, 1, 100000);
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
    return { path: `/${type}/${id}`, params: { append_to_response: "videos" } };
  }
  if (body.action === "genres") {
    if (!type) return { error: "Unknown media type." };
    return { path: `/genre/${type}/list`, params: {} };
  }
  return { error: "Unknown request." };
}


export type TmdbCallResult =
  | { ok: true; json: string }
  | { ok: false; reason: "not_configured" | "unavailable" | "restricted"; message: string };

export const callTmdbServer = createServerFn({ method: "POST" })
  .validator((input: RequestBody) => input)
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
    const cacheKey = url.toString();
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      const safe = sanitizeTmdbResponse(body, cached.json);
      if (safe.restricted) return { ok: false, reason: "restricted", message: "This title is not available in Cinema." };
      return { ok: true, json: safe.json };
    }
    if (cached) responseCache.delete(cacheKey);

    const headers: Record<string, string> = { Accept: "application/json" };
    if (readToken) headers.Authorization = `Bearer ${readToken}`;
    else url.searchParams.set("api_key", apiKey as string);
    try {
      const upstream = await fetch(url, { headers, signal: AbortSignal.timeout(12_000) });
      if (!upstream.ok) return { ok: false, reason: "unavailable", message: `TMDB returned ${upstream.status}` };
      const json = await upstream.text();
      const safe = sanitizeTmdbResponse(body, json);
      responseCache.set(cacheKey, { json, expiresAt: Date.now() + RESPONSE_CACHE_TTL_MS });
      if (safe.restricted) return { ok: false, reason: "restricted", message: "This title is not available in Cinema." };
      if (responseCache.size > MAX_CACHED_RESPONSES) {
        const oldestKey = responseCache.keys().next().value;
        if (oldestKey) responseCache.delete(oldestKey);
      }
      return { ok: true, json: safe.json };
    } catch (error) {
      console.error("tmdb request failed", error);
      return { ok: false, reason: "unavailable", message: "TMDB request timed out or is temporarily unavailable." };
    }
  });
