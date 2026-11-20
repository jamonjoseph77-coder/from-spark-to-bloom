const CONSENT_COOKIE_NAME = "cinema_analytics_consent";
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export type AnalyticsConsentState = "granted" | "denied" | "unknown";

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function readCookie(cookieHeader: string | null, name: string): string {
  if (!cookieHeader) return "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return "";
}

/** Create a signed, HttpOnly-cookie value. The signing secret never leaves the server. */
export async function createAnalyticsConsentValue(secret: string, now = Date.now()): Promise<string> {
  if (typeof secret !== "string" || secret.length < 32 || secret.length > 512) {
    throw new Error("Analytics consent signing is not configured.");
  }
  const payload = {
    version: 1,
    state: "granted",
    issuedAt: now,
    expiresAt: now + CONSENT_TTL_MS,
  };
  const encoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return encoded + "." + base64UrlEncode(new Uint8Array(signature));
}

/** Denial is safe without a signature; only a valid signed grant can enable event forwarding. */
export async function readAnalyticsConsent(
  cookieHeader: string | null,
  secret: string,
  now = Date.now(),
): Promise<AnalyticsConsentState> {
  const value = readCookie(cookieHeader, CONSENT_COOKIE_NAME);
  if (value === "denied") return "denied";
  if (!value || typeof secret !== "string" || secret.length < 32 || secret.length > 512) return "unknown";
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return "unknown";
  try {
    const decodedSignature = base64UrlDecode(parts[1]);
    const signatureBuffer = new ArrayBuffer(decodedSignature.byteLength);
    new Uint8Array(signatureBuffer).set(decodedSignature);
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
    );
    if (!await crypto.subtle.verify("HMAC", key, signatureBuffer, new TextEncoder().encode(parts[0]))) return "unknown";
    const payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(base64UrlDecode(parts[0]))) as Record<string, unknown>;
    const issuedAt = payload.issuedAt;
    const expiresAt = payload.expiresAt;
    if (payload.version !== 1 || payload.state !== "granted"
      || typeof issuedAt !== "number" || !Number.isSafeInteger(issuedAt)
      || typeof expiresAt !== "number" || !Number.isSafeInteger(expiresAt)
      || issuedAt > now + 5 * 60 * 1000 || expiresAt <= now
      || expiresAt <= issuedAt || expiresAt - issuedAt > CONSENT_TTL_MS) return "unknown";
    return "granted";
  } catch {
    return "unknown";
  }
}
