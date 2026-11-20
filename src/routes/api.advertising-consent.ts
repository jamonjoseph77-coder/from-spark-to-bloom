import { createFileRoute } from "@tanstack/react-router";
import { createAdvertisingConsentValue, readAdvertisingConsent } from "@/lib/advertising-consent";

const COOKIE = "cinema_advertising_consent";
const MAX_AGE = 180 * 24 * 60 * 60;
const MAX_BODY_BYTES = 1024;

function cookieHeader(request: Request, value: string, maxAge = MAX_AGE) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return COOKIE + "=" + value + "; Path=/; Max-Age=" + maxAge + "; HttpOnly; SameSite=Lax" + secure;
}

async function readBoundedBody(request: Request): Promise<{ ok: true; text: string } | { ok: false; status: 400 | 413; error: string }> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)) {
    return { ok: false, status: 413, error: "request_too_large" };
  }
  if (!request.body) return { ok: false, status: 400, error: "request_body_required" };

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
        return { ok: false, status: 413, error: "request_too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: "invalid_request_body" };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, status: 400, error: "invalid_request_encoding" };
  }
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
      const contentType = (request.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
      if (contentType !== "application/json")
        return Response.json({ error: "application_json_required" }, { status: 415, headers: { "Cache-Control": "no-store" } });

      const bounded = await readBoundedBody(request);
      if (!bounded.ok) return Response.json({ error: bounded.error }, { status: bounded.status, headers: { "Cache-Control": "no-store" } });

      let body: unknown;
      try { body = JSON.parse(bounded.text); } catch {
        return Response.json({ error: "invalid_json" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      }
      const state = body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).state : undefined;
      if (state === "denied" || state === "unknown") {
        return Response.json({ saved: true, state }, {
          headers: { "Cache-Control": "no-store", "Set-Cookie": cookieHeader(request, state === "denied" ? "denied" : "", 0) },
        });
      }
      if (state !== "granted")
        return Response.json({ error: "invalid_consent_choice" }, { status: 400, headers: { "Cache-Control": "no-store" } });
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
