const COOKIE_NAME = "cinema_advertising_consent";
const TTL_MS = 180 * 24 * 60 * 60 * 1000;
export type AdvertisingConsentState = "granted" | "denied" | "unknown";
function encode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
function cookieValue(header: string | null): string {
  if (!header) return "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index >= 0 && part.slice(0, index).trim() === COOKIE_NAME) return part.slice(index + 1).trim();
  }
  return "";
}
export async function createAdvertisingConsentValue(secret: string, now = Date.now()): Promise<string> {
  if (secret.length < 32 || secret.length > 512) throw new Error("Advertising consent signing is not configured.");
  const payload = { version: 1, state: "granted", issuedAt: now, expiresAt: now + TTL_MS };
  const encoded = encode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return encoded + "." + encode(new Uint8Array(signature));
}
export async function readAdvertisingConsent(cookieHeader: string | null, secret: string, now = Date.now()): Promise<AdvertisingConsentState> {
  const value = cookieValue(cookieHeader);
  if (value === "denied") return "denied";
  if (!value || secret.length < 32 || secret.length > 512) return "unknown";
  const parts = value.split(".");
  if (parts.length !== 2) return "unknown";
  try {
    const signature = decode(parts[1]);
    const signatureBuffer = new ArrayBuffer(signature.byteLength);
    new Uint8Array(signatureBuffer).set(signature);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, signatureBuffer, new TextEncoder().encode(parts[0]))) return "unknown";
    const payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decode(parts[0]))) as Record<string, unknown>;
    const issuedAt = payload.issuedAt;
    const expiresAt = payload.expiresAt;
    if (payload.version !== 1 || payload.state !== "granted" || !Number.isSafeInteger(issuedAt)
      || !Number.isSafeInteger(expiresAt) || typeof issuedAt !== "number" || typeof expiresAt !== "number"
      || issuedAt > now + 300000 || expiresAt <= now || expiresAt <= issuedAt || expiresAt - issuedAt > TTL_MS) return "unknown";
    return "granted";
  } catch { return "unknown"; }
}
