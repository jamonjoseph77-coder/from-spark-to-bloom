import { createFileRoute } from "@tanstack/react-router";
import { normaliseMarketplaceViewerEvent } from "@/lib/marketplace-events";
import { readAnalyticsConsent } from "@/lib/analytics-consent";
import { resolveMarketplaceForwardingConfig } from "@/lib/marketplace-forwarding-config";

const MAX_BODY_BYTES = 8 * 1024;

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

export const Route = createFileRoute("/api/marketplace-events")({
  server: { handlers: {
    POST: async ({ request }) => {
      const config = resolveMarketplaceForwardingConfig(process.env);
      if (!config) return Response.json({ error: "event_forwarding_not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
      const origin = request.headers.get("origin") ?? "";
      if (!config.allowedOrigins.includes(origin)) {
        return Response.json({ error: "origin_not_allowed" }, { status: 403, headers: { "Cache-Control": "no-store" } });
      }
      if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
        return Response.json({ error: "application_json_required" }, { status: 415 });
      }
      const token = config.token;
      if (!token) {
        return Response.json({ error: "event_forwarding_not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
      }
      const consent = await readAnalyticsConsent(request.headers.get("cookie"), token);
      if (consent !== "granted") {
        return Response.json({ error: "measurement_consent_required" }, { status: 403, headers: { "Cache-Control": "no-store" } });
      }
      const raw = await readBoundedBody(request);
      if (raw === null) return Response.json({ error: "invalid_or_oversized_body" }, { status: 413 });
      let body: unknown;
      try { body = JSON.parse(raw); } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }
      const event = normaliseMarketplaceViewerEvent(body);
      if (!event) return Response.json({ error: "event_contract_invalid" }, { status: 400, headers: { "Cache-Control": "no-store" } });

      try {
        // Resolve the canonical published Cinema title before forwarding. No viewer identity is read or transmitted.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: title, error: titleError } = await supabaseAdmin
          .from("titles").select("id").eq("id", event.titleId).eq("is_published", true).maybeSingle();
        if (titleError || !title) return Response.json({ error: "published_title_not_found" }, { status: 404 });

        const upstream = await fetch(config.eventsUrl, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(5000),
        });
        const result = await upstream.json().catch(() => ({})) as { accepted?: boolean; duplicate?: boolean };
        if (!upstream.ok || result.accepted !== true) {
          return Response.json({ error: "marketplace_event_forward_failed" }, { status: 502, headers: { "Cache-Control": "no-store" } });
        }
        return Response.json({ accepted: true, duplicate: result.duplicate === true }, {
          status: 202, headers: { "Cache-Control": "no-store" },
        });
      } catch {
        return Response.json({ error: "marketplace_event_forward_failed" }, { status: 502, headers: { "Cache-Control": "no-store" } });
      }
    },
  } },
});
