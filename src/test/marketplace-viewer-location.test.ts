import { describe, expect, it } from "vitest";
import { resolveTrustedViewerCountry } from "@/lib/marketplace-viewer-location";

describe("resolveTrustedViewerCountry", () => {
  it("uses edge-derived country rather than browser-supplied values", () => {
    const request = new Request("https://cinema.example/api/marketplace-events", {
      headers: { "cf-ipcountry": "NG" },
    }) as Request & { cf?: { country?: string } };
    request.cf = { country: "GH" };
    expect(resolveTrustedViewerCountry(request)).toBe("GH");
  });

  it("uses ZZ when trusted edge country metadata is unavailable", () => {
    const request = new Request("https://cinema.example/api/marketplace-events", {
      headers: { "cf-ipcountry": "GH" },
    });
    expect(resolveTrustedViewerCountry(request)).toBe("ZZ");
  });

  it("uses ZZ for invalid edge country values", () => {
    const request = new Request("https://cinema.example") as Request & { cf?: { country?: string } };
    request.cf = { country: "GHA" };
    expect(resolveTrustedViewerCountry(request)).toBe("ZZ");
  });
});
