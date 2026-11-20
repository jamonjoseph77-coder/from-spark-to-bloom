import { describe, expect, it } from "vitest";
import { createAdvertisingConsentValue, readAdvertisingConsent } from "@/lib/advertising-consent";
const secret = "cinema-advertising-consent-test-secret-long-enough";
const cookie = (value: string) => "cinema_advertising_consent=" + value;
describe("separate advertising consent", () => {
  it("recognises only a valid signed grant", async () => {
    const value = await createAdvertisingConsentValue(secret, 1_800_000_000_000);
    expect(await readAdvertisingConsent(cookie(value), secret, 1_800_000_001_000)).toBe("granted");
  });
  it("rejects tampered, expired and incorrectly signed grants", async () => {
    const value = await createAdvertisingConsentValue(secret, 1_800_000_000_000);
    const [payload, signature] = value.split(".");
    const tampered = payload.slice(0, -1) + (payload.endsWith("a") ? "b" : "a") + "." + signature;
    expect(await readAdvertisingConsent(cookie(tampered), secret, 1_800_000_001_000)).toBe("unknown");
    expect(await readAdvertisingConsent(cookie(value), "another-secret-with-at-least-32-characters", 1_800_000_001_000)).toBe("unknown");
    const expired = await createAdvertisingConsentValue(secret, 1_700_000_000_000);
    expect(await readAdvertisingConsent(cookie(expired), secret, 1_800_000_000_000)).toBe("unknown");
  });
  it("honours denial without a signing secret and defaults missing choice to unknown", async () => {
    expect(await readAdvertisingConsent(cookie("denied"), "")).toBe("denied");
    expect(await readAdvertisingConsent(null, secret)).toBe("unknown");
  });
  it("refuses to issue a grant without a strong secret", async () => {
    await expect(createAdvertisingConsentValue("weak")).rejects.toThrow("not configured");
  });
});
