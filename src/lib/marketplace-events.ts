export const MARKETPLACE_EVENT_TYPES = [
  "title_page_view_eligible", "playback_start", "playback_complete",
  "intro_slate_start", "intro_slate_complete", "passive_overlay_render",
  "pause_frame_render", "companion_open", "outbound_click",
  "short_view_start", "short_view_complete", "short_share", "short_save",
  "playback_exit", "campaign_delivery_error",
] as const;

export type MarketplaceEvent = {
  eventId: string;
  eventType: typeof MARKETPLACE_EVENT_TYPES[number];
  titleId: string;
  occurredAt: string;
  source: "cinema_web";
  territory: string;
  deviceClass: "mobile" | "desktop" | "tablet" | "tv" | "unknown";
  appVersion: string;
  consentState: "granted";
  schemaVersion: 1;
  campaignId?: string;
  placementId?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLACEMENT_EVENTS = new Set(["intro_slate_start", "intro_slate_complete", "passive_overlay_render", "pause_frame_render", "companion_open", "outbound_click"]);

export function normaliseMarketplaceViewerEvent(input: unknown, now = Date.now()): MarketplaceEvent | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const row = input as Record<string, unknown>;
  const eventId = typeof row.eventId === "string" ? row.eventId : "";
  const titleId = typeof row.titleId === "string" ? row.titleId : "";
  const eventType = row.eventType;
  const occurredAt = typeof row.occurredAt === "string" ? row.occurredAt : "";
  const territory = typeof row.territory === "string" ? row.territory.toUpperCase() : "";
  const deviceClass = row.deviceClass;
  const appVersion = typeof row.appVersion === "string" ? row.appVersion : "";
  const campaignId = typeof row.campaignId === "string" ? row.campaignId : "";
  const placementId = typeof row.placementId === "string" ? row.placementId : "";
  if (!UUID.test(eventId) || !UUID.test(titleId)
    || !MARKETPLACE_EVENT_TYPES.includes(eventType as MarketplaceEvent["eventType"])
    || !Number.isFinite(Date.parse(occurredAt))
    || Date.parse(occurredAt) < now - 7 * 86_400_000
    || Date.parse(occurredAt) > now + 5 * 60_000
    || !/^[A-Z]{2}$/.test(territory)
    || !["mobile", "desktop", "tablet", "tv", "unknown"].includes(String(deviceClass))
    || !/^[A-Za-z0-9._+-]{1,40}$/.test(appVersion)
    || row.consentState !== "granted" || row.schemaVersion !== 1) return null;
  if (PLACEMENT_EVENTS.has(eventType as string)
    && (!/^[A-Za-z0-9:_-]{1,160}$/.test(campaignId) || !/^[A-Za-z0-9:_-]{1,100}$/.test(placementId))) return null;
  if (campaignId && !/^[A-Za-z0-9:_-]{1,160}$/.test(campaignId)) return null;
  if (placementId && !/^[A-Za-z0-9:_-]{1,100}$/.test(placementId)) return null;
  return {
    eventId, eventType: eventType as MarketplaceEvent["eventType"], titleId,
    occurredAt: new Date(Date.parse(occurredAt)).toISOString(),
    source: "cinema_web", territory, deviceClass: deviceClass as MarketplaceEvent["deviceClass"],
    appVersion, consentState: "granted", schemaVersion: 1,
    ...(campaignId ? { campaignId } : {}), ...(placementId ? { placementId } : {}),
  };
}
