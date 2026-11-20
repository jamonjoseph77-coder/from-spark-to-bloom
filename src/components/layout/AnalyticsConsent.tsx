import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import type { AnalyticsConsentState } from "@/lib/analytics-consent";

export function AnalyticsConsent() {
  const [state, setState] = useState<AnalyticsConsentState>("unknown");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/marketplace-analytics-consent", {
      credentials: "same-origin", cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) throw new Error("Could not read privacy preferences.");
      const result = await response.json() as { state?: AnalyticsConsentState };
      if (active && ["granted", "denied", "unknown"].includes(String(result.state))) {
        setState(result.state as AnalyticsConsentState);
      }
    }).catch(() => {
      if (active) setState("unknown");
    }).finally(() => {
      if (active) setLoading(false);
    });
    const openPreferences = () => setOpen(true);
    window.addEventListener("cinema:open-privacy-choices", openPreferences);
    return () => {
      active = false;
      window.removeEventListener("cinema:open-privacy-choices", openPreferences);
    };
  }, []);

  async function saveChoice(next: "granted" | "denied") {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/marketplace-analytics-consent", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: next }),
      });
      const result = await response.json().catch(() => ({})) as { state?: AnalyticsConsentState; error?: string };
      if (!response.ok) {
        throw new Error(result.error === "consent_signing_not_configured"
          ? "Optional measurement is not configured yet. You can still reject it."
          : "Your privacy choice could not be saved. Please try again.");
      }
      setState(next);
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your privacy choice could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || (state !== "unknown" && !open)) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-xl lg:bottom-5">
      <section role="dialog" aria-labelledby="cinema-analytics-consent-title" aria-modal="false"
        className="rounded-2xl border border-white/15 bg-[#080d13]/[.98] p-4 text-white shadow-2xl backdrop-blur-2xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 id="cinema-analytics-consent-title" className="text-sm font-semibold">Privacy Choices</h2>
              {state !== "unknown" && (
                <button type="button" onClick={() => setOpen(false)} aria-label="Close privacy choices"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Cinema can use optional, privacy-safe measurement to understand title performance and sponsored placements.
              If you allow it, only consented events, a title ID, coarse country and device class, and signed placement proof
              are sent to the Marketplace. Your name, email, account ID, precise location and individual viewing history are not sent.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              Your choice is stored in a secure, HttpOnly cookie and can be changed at any time from Privacy Choices.
              Optional measurement stays off unless you explicitly allow it.
            </p>
            {error && <p role="alert" className="mt-3 text-xs text-amber-200">{error}</p>}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => void saveChoice("denied")}
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50">
                {saving ? "Saving…" : "Reject Optional Analytics"}
              </button>
              <button type="button" disabled={saving} onClick={() => void saveChoice("granted")}
                className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-semibold text-[#06111c] transition hover:bg-cyan-200 disabled:opacity-50">
                {saving ? "Saving…" : "Allow Optional Analytics"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
