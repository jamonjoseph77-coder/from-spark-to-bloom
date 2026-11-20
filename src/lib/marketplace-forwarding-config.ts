export type MarketplaceForwardingConfig = {
  token: string;
  eventsUrl: string;
  allowedOrigins: string[];
};

export function resolveMarketplaceForwardingConfig(
  env: Record<string, string | undefined>,
): MarketplaceForwardingConfig | null {
  const token = env.CINEMA_MARKETPLACE_ANALYTICS_TOKEN ?? "";
  const rawEventsUrl = env.CINEMA_MARKETPLACE_EVENTS_URL ?? "";
  const rawOrigins = (env.CINEMA_MARKETPLACE_ALLOWED_ORIGINS ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  if (token.length < 32 || token.length > 512 || !rawEventsUrl || !rawOrigins.length) return null;
  let eventsUrl: URL;
  try {
    eventsUrl = new URL(rawEventsUrl);
    if (eventsUrl.protocol !== "https:" || eventsUrl.username || eventsUrl.password
      || eventsUrl.search || eventsUrl.hash || eventsUrl.pathname !== "/api/marketplace/events") return null;
  } catch { return null; }
  const allowedOrigins = rawOrigins.filter((origin) => {
    try {
      const parsed = new URL(origin);
      return parsed.protocol === "https:" && parsed.origin === origin
        && !parsed.username && !parsed.password && !origin.includes("*");
    } catch { return false; }
  });
  if (allowedOrigins.length !== rawOrigins.length || new Set(allowedOrigins).size !== allowedOrigins.length) return null;
  return { token, eventsUrl: eventsUrl.toString(), allowedOrigins };
}
