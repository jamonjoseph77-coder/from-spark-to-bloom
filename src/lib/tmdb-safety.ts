export type TmdbSanitizeResult = { json: string; restricted: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Enforces TMDB's adult flag at the server boundary. */
export function sanitizeTmdbResponse(action: unknown, json: string): TmdbSanitizeResult {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) return { json, restricted: false };

    if (action === "details") {
      return { json, restricted: parsed.adult === true };
    }

    if ((action === "list" || action === "search") && Array.isArray(parsed.results)) {
      const results = parsed.results.filter((item) => !isRecord(item) || item.adult !== true);
      return { json: JSON.stringify({ ...parsed, results }), restricted: false };
    }

    return { json, restricted: false };
  } catch {
    return { json, restricted: false };
  }
}
