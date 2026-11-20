import { describe, expect, it } from "vitest";
import { resolveMarketplaceForwardingConfig } from "@/lib/marketplace-forwarding-config";

const valid = {
  CINEMA_MARKETPLACE_ANALYTICS_TOKEN: "a-server-only-secret-that-is-at-least-32-characters-long",
  CINEMA_MARKETPLACE_EVENTS_URL: "https://marketplace.example/api/marketplace/events",
  CINEMA_MARKETPLACE_ALLOWED_ORIGINS: "https://cinema.example",
};

describe("Marketplace forwarding configuration", () => {
  it("accepts a strong server token, exact HTTPS endpoint and exact origins", () => {
    expect(resolveMarketplaceForwardingConfig(valid)).toEqual({
      token: valid.CINEMA_MARKETPLACE_ANALYTICS_TOKEN,
      eventsUrl: valid.CINEMA_MARKETPLACE_EVENTS_URL,
      allowedOrigins: ["https://cinema.example"],
    });
  });
  it("fails closed when secrets or endpoint configuration are missing", () => {
    expect(resolveMarketplaceForwardingConfig({ ...valid, CINEMA_MARKETPLACE_ANALYTICS_TOKEN: "short" })).toBeNull();
    expect(resolveMarketplaceForwardingConfig({ ...valid, CINEMA_MARKETPLACE_EVENTS_URL: "" })).toBeNull();
    expect(resolveMarketplaceForwardingConfig({ ...valid, CINEMA_MARKETPLACE_ALLOWED_ORIGINS: "" })).toBeNull();
  });
  it("rejects insecure, wildcard, credentialed or non-event endpoints", () => {
    expect(resolveMarketplaceForwardingConfig({ ...valid, CINEMA_MARKETPLACE_EVENTS_URL: "http://marketplace.example/api/marketplace/events" })).toBeNull();
    expect(resolveMarketplaceForwardingConfig({ ...valid, CINEMA_MARKETPLACE_EVENTS_URL: "https://marketplace.example/" })).toBeNull();
    expect(resolveMarketplaceForwardingConfig({ ...valid, CINEMA_MARKETPLACE_ALLOWED_ORIGINS: "https://*.example" })).toBeNull();
    expect(resolveMarketplaceForwardingConfig({ ...valid, CINEMA_MARKETPLACE_ALLOWED_ORIGINS: "https://user:pass@cinema.example" })).toBeNull();
  });
});
