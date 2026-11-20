import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import type { AdvertisingConsentState } from "@/lib/advertising-consent";
export function AdvertisingConsent() {
  const [state, setState] = useState<AdvertisingConsentState>("unknown");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch("/api/advertising-consent", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not read advertising preferences.");
        const result = await response.json() as { state?: AdvertisingConsentState };
        if (active && ["granted", "denied", "unknown"].includes(String(result.state))) {
          const next = result.state as AdvertisingConsentState;
          document.documentElement.dataset.cinemaAdvertisingConsent = next;
          window.dispatchEvent(new CustomEvent("cinema:advertising-consent-changed", { detail: { state: next } }));
          setState(next);
        }
      }).catch(() => { if (active) setState("unknown"); })
      .finally(() => { if (active) setLoading(false); });
    const openPreferences = () => setOpen(true);
    window.addEventListener("cinema:open-advertising-choices", openPreferences);
    return () => {
      active = false;
      window.removeEventListener("cinema:open-advertising-choices", openPreferences);
    };
  }, []);
  async function saveChoice(next: "granted" | "denied") {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/advertising-consent", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: next }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error === "consent_signing_not_configured"
        ? "Advertising preferences are not configured yet. You can still reject optional advertising."
        : "Your advertising choice could not be saved. Please try again.");
      document.documentElement.dataset.cinemaAdvertisingConsent = next;
      window.dispatchEvent(new CustomEvent("cinema:advertising-consent-changed", { detail: { state: next } }));
      setState(next); setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your choice could not be saved.");
    } finally { setSaving(false); }
  }
  if (loading || (state !== "unknown" && !open)) return null;
  return (
    <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[71] mx-auto max-w-xl lg:bottom-5">
      <section role="dialog" aria-labelledby="cinema-advertising-consent-title" aria-modal="false"
        className="rounded-2xl border border-white/15 bg-[#080d13]/[.98] p-4 text-white shadow-2xl backdrop-blur-2xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><ShieldCheck className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 id="cinema-advertising-consent-title" className="text-sm font-semibold">Advertising Choices</h2>
              {state !== "unknown" && <button type="button" onClick={() => setOpen(false)} aria-label="Close advertising choices" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">Cinema may show clearly labelled, non-intrusive sponsored placements. Your choice here is separate from analytics. Allowing advertising does not enable personalised tracking, conversion pixels, or advertising for restricted products. Cinema must still check age-appropriateness, placement approval and provider policy before any ad is shown.</p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">You can change this choice later in Privacy Choices. If you do not allow optional advertising, the external advertising slot stays off.</p>
            {error && <p role="alert" className="mt-3 text-xs text-amber-200">{error}</p>}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => void saveChoice("denied")} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50">{saving ? "Saving…" : "Reject Optional Ads"}</button>
              <button type="button" disabled={saving} onClick={() => void saveChoice("granted")} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-semibold text-[#06111c] hover:bg-cyan-200 disabled:opacity-50">{saving ? "Saving…" : "Allow Optional Ads"}</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
