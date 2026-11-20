import { createFileRoute } from "@tanstack/react-router";
import { createAdvertisingConsentValue, readAdvertisingConsent } from "@/lib/advertising-consent";
const COOKIE = "cinema_advertising_consent";
const MAX_AGE = 180 * 24 * 60 * 60;
function cookieHeader(request: Request, value: string, maxAge = MAX_AGE) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return COOKIE + "=" + value + "; Path=/; Max-Age=" + maxAge + "; HttpOnly; SameSite=Lax" + secure;
}
export const Route = createFileRoute("/api/advertising-consent")({
  server: { handlers: {
    GET: async ({ request }) => {
      const secret = process.env.CINEMA_ADVERTISING_CONSENT_TOKEN ?? "";
      const state = await readAdvertisingConsent(request.headers.get("cookie"), secret);
      return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
    },
    POST: async ({ request }) => {
      const requestOrigin = new URL(request.url).origin;
      if ((request.headers.get("origin") ?? "") !== requestOrigin)
        return Response.json({ error: "origin_not_allowed" }, { status: 403, headers: { "Cache-Control": "no-store" } });
      if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/json"))
        return Response.json({ error: "application_json_required" }, { status: 415 });
      const raw = await request.text();
      if (raw.length > 1024) return Response.json({ error: "request_too_large" }, { status: 413 });
      let body: unknown;
      try { body = JSON.parse(raw); } catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
      const state = body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).state : undefined;
      if (state === "denied" || state === "unknown") {
        return Response.json({ saved: true, state }, {
          headers: { "Cache-Control": "no-store", "Set-Cookie": cookieHeader(request, state === "denied" ? "denied" : "", 0) },
        });
      }
      if (state !== "granted") return Response.json({ error: "invalid_consent_choice" }, { status: 400 });
      const secret = process.env.CINEMA_ADVERTISING_CONSENT_TOKEN ?? "";
      if (secret.length < 32 || secret.length > 512)
        return Response.json({ error: "consent_signing_not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
      const signed = await createAdvertisingConsentValue(secret);
      return Response.json({ saved: true, state: "granted" }, {
        headers: { "Cache-Control": "no-store", "Set-Cookie": cookieHeader(request, signed) },
      });
    },
  } },
});
