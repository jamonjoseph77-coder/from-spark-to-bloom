import { describe, expect, it } from "vitest";
import { createAnalyticsConsentValue, readAnalyticsConsent } from "@/lib/analytics-consent";

const secret = "server-only-cinema-marketplace-analytics-secret-32-plus";
const cookie = (value: string) => `cinema_analytics_consent=${value}`;

describe("Cinema privacy-safe analytics consent", () => {
  it("recognises only a valid signed grant", async () => {
    const value = await createAnalyticsConsentValue(secret, 1_800_000_000_000);
    expect(await readAnalyticsConsent(cookie(value), secret, 1_800_000_001_000)).toBe("granted");
  });

  it("rejects tampered grants and grants signed by another secret", async () => {
    const value = await createAnalyticsConsentValue(secret, 1_800_000_000_000);
    const [payload, signature] = value.split(".");
    const tampered = payload.slice(0, -1) + (payload.endsWith("a") ? "b" : "a") + "." + signature;
    expect(await readAnalyticsConsent(cookie(tampered), secret, 1_800_000_001_000)).toBe("unknown");
    expect(await readAnalyticsConsent(cookie(value), "different-server-secret-with-at-least-32-characters", 1_800_000_001_000)).toBe("unknown");
  });

  it("rejects expired and malformed consent cookies", async () => {
    const expired = await createAnalyticsConsentValue(secret, 1_700_000_000_000);
    expect(await readAnalyticsConsent(cookie(expired), secret, 1_800_000_000_000)).toBe("unknown");
    expect(await readAnalyticsConsent(cookie("not-a-token"), secret)).toBe("unknown");
    expect(await readAnalyticsConsent(null, secret)).toBe("unknown");
  });

  it("honours a denial cookie without ever treating it as a grant", async () => {
    expect(await readAnalyticsConsent(cookie("denied"), "")).toBe("denied");
  });

  it("does not issue a grant with a missing or weak signing secret", async () => {
    await expect(createAnalyticsConsentValue("short")).rejects.toThrow("Analytics consent signing is not configured.");
  });
});
