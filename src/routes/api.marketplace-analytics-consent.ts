import { createFileRoute } from "@tanstack/react-router";
import { createAnalyticsConsentValue, readAnalyticsConsent } from "@/lib/analytics-consent";

const COOKIE_NAME = "cinema_analytics_consent";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
const MAX_BODY_BYTES = 1024;

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    await reader.cancel().catch(() => {});
    return null;
  }
}

function cookieHeader(request: Request, value: string, maxAge = COOKIE_MAX_AGE): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

export const Route = createFileRoute("/api/marketplace-analytics-consent")({
  server: { handlers: {
    GET: async ({ request }) => {
      const secret = process.env.CINEMA_MARKETPLACE_ANALYTICS_TOKEN ?? "";
      const state = await readAnalyticsConsent(request.headers.get("cookie"), secret);
      return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
    },
    POST: async ({ request }) => {
      const origin = request.headers.get("origin") ?? "";
      let requestOrigin = "";
      try { requestOrigin = new URL(request.url).origin; } catch { /* reject malformed request URL */ }
      if (!origin || !requestOrigin || origin !== requestOrigin) {
        return Response.json({ error: "origin_not_allowed" }, { status: 403, headers: { "Cache-Control": "no-store" } });
      }
      if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
        return Response.json({ error: "application_json_required" }, { status: 415 });
      }
      const raw = await readBoundedBody(request);
      if (raw === null) return Response.json({ error: "invalid_or_oversized_body" }, { status: 413 });
      let body: unknown;
      try { body = JSON.parse(raw); } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return Response.json({ error: "invalid_consent_choice" }, { status: 400 });
      }
      const state = (body as Record<string, unknown>).state;
      if (state === "denied") {
        return Response.json({ saved: true, state: "denied" }, {
          headers: { "Cache-Control": "no-store", "Set-Cookie": cookieHeader(request, "denied") },
        });
      }
      if (state === "unknown") {
        return Response.json({ saved: true, state: "unknown" }, {
          headers: { "Cache-Control": "no-store", "Set-Cookie": cookieHeader(request, "", 0) },
        });
      }
      if (state !== "granted") return Response.json({ error: "invalid_consent_choice" }, { status: 400 });
      const secret = process.env.CINEMA_MARKETPLACE_ANALYTICS_TOKEN ?? "";
      if (secret.length < 32 || secret.length > 512) {
        return Response.json({ error: "consent_signing_not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
      }
      const signedValue = await createAnalyticsConsentValue(secret);
      return Response.json({ saved: true, state: "granted" }, {
        headers: { "Cache-Control": "no-store", "Set-Cookie": cookieHeader(request, signedValue) },
      });
    },
  } },
});
