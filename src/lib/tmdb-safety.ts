export type TmdbSanitizeResult = { json: string; restricted: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Enforces the API's adult flag at the server boundary.
 * List/search responses are filtered; direct detail requests are rejected.
 */
export function sanitizeTmdbResponse(
  action: string | undefined,
  json: string,
): TmdbSanitizeResult {
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
