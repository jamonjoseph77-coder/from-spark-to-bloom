import { describe, expect, it } from "vitest";
import { normaliseMarketplaceViewerEvent } from "@/lib/marketplace-events";

const now = Date.parse("2026-11-20T12:00:00.000Z");
const valid = {
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  eventType: "playback_start",
  titleId: "123e4567-e89b-42d3-a456-426614174000",
  occurredAt: "2026-11-20T11:59:00.000Z",
  territory: "gh",
  deviceClass: "mobile",
  appVersion: "1.0.0",
  consentState: "granted",
  schemaVersion: 1,
  userId: "must-not-be-forwarded",
  email: "must-not-be-forwarded@example.test",
};

describe("Cinema → Marketplace event contract", () => {
  it("normalises consented events and drops all unapproved identity fields", () => {
    const event = normaliseMarketplaceViewerEvent(valid, now);
    expect(event?.territory).toBe("GH");
    expect(event).not.toHaveProperty("userId");
    expect(event).not.toHaveProperty("email");
    expect(event?.source).toBe("cinema_web");
  });
  it("rejects events without explicit consent or canonical UUIDs", () => {
    expect(normaliseMarketplaceViewerEvent({ ...valid, consentState: "unknown" }, now)).toBeNull();
    expect(normaliseMarketplaceViewerEvent({ ...valid, titleId: "tmdb:123" }, now)).toBeNull();
  });
  it("requires campaign and placement identifiers for placement events", () => {
    expect(normaliseMarketplaceViewerEvent({ ...valid, eventType: "pause_frame_render" }, now)).toBeNull();
    expect(normaliseMarketplaceViewerEvent({ ...valid, eventType: "pause_frame_render", campaignId: "campaign_1", placementId: "pause_frame" }, now)).not.toBeNull();
  });
  it("rejects unsupported event types and out-of-window timestamps", () => {
    expect(normaliseMarketplaceViewerEvent({ ...valid, eventType: "invented" }, now)).toBeNull();
    expect(normaliseMarketplaceViewerEvent({ ...valid, occurredAt: "2026-11-01T00:00:00.000Z" }, now)).toBeNull();
  });
});
