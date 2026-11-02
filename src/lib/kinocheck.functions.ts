import { createServerFn } from "@tanstack/react-start";

const BASE_URL = "https://api.kinocheck.com";
const MEDIA_TYPES = ["movie", "tv"] as const;

type RequestBody = { type?: unknown; id?: unknown };
type KinoCheckResult =
  | { ok: true; json: string }
  | { ok: false; message: string };

function validateRequest(body: RequestBody): { path: string; id: number } | { error: string } {
  if (typeof body.type !== "string" || !MEDIA_TYPES.includes(body.type as (typeof MEDIA_TYPES)[number])) {
    return { error: "Unknown media type." };
  }
  if (typeof body.id !== "number" || !Number.isInteger(body.id) || body.id < 1 || body.id > 2147483647) {
    return { error: "TMDB title id is not valid." };
  }
  return { path: body.type === "movie" ? "/movies" : "/shows", id: body.id };
}

/** Fetch official promotional assets matched to a TMDB title ID. */
export const callKinoCheckServer = createServerFn({ method: "POST" })
  .validator((input: RequestBody) => input)
  .handler(async ({ data: body }): Promise<KinoCheckResult> => {
    const request = validateRequest(body);
    if ("error" in request) return { ok: false, message: request.error };

    const url = new URL(request.path, BASE_URL);
    url.searchParams.set("tmdb_id", String(request.id));
    url.searchParams.set("language", "en");
    url.searchParams.set("limit", "50");

    const headers: Record<string, string> = { Accept: "application/json" };
    const apiKey = process.env.KINOCHECK_API_KEY;
    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
      headers["X-Api-Host"] = "api.kinocheck.com";
    }

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) return { ok: false, message: `KinoCheck returned ${response.status}.` };
      return { ok: true, json: await response.text() };
    } catch (error) {
      console.error("KinoCheck request failed", error);
      return { ok: false, message: "KinoCheck request failed." };
    }
  });
