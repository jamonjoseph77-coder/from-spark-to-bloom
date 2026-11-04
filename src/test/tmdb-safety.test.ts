import { describe, expect, it } from "vitest";
import { sanitizeTmdbResponse } from "@/lib/tmdb-safety";

describe("sanitizeTmdbResponse", () => {
  it.each(["list", "search"])("removes adult-flagged entries from %s responses", (action) => {
    const input = JSON.stringify({
      page: 1,
      results: [
        { id: 1, title: "Safe title", adult: false },
        { id: 2, title: "Restricted title", adult: true },
        { id: 3, title: "Unflagged title" },
      ],
    });
    const result = sanitizeTmdbResponse(action, input);
    expect(result.restricted).toBe(false);
    expect(JSON.parse(result.json).results.map((item: { id: number }) => item.id)).toEqual([1, 3]);
  });

  it("rejects a directly requested adult-flagged detail record", () => {
    const result = sanitizeTmdbResponse("details", JSON.stringify({ id: 2, adult: true }));
    expect(result.restricted).toBe(true);
  });

  it("allows a safe detail record", () => {
    const input = JSON.stringify({ id: 1, adult: false });
    const result = sanitizeTmdbResponse("details", input);
    expect(result.restricted).toBe(false);
    expect(result.json).toBe(input);
  });

  it("leaves malformed upstream JSON unchanged for the caller's parser to reject", () => {
    const input = "{not-json";
    const result = sanitizeTmdbResponse("list", input);
    expect(result).toEqual({ json: input, restricted: false });
  });
});
