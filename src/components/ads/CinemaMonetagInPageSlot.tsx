import { useEffect, useState } from "react";

/**
 * Monetag zone 12315745 is isolated in a sandboxed, fixed-size iframe.
 * It is disabled unless the production build explicitly opts in.
 * The provider script never runs in Cinema's top-level document.
 */
export function CinemaMonetagInPageSlot() {
  const [consentGranted, setConsentGranted] = useState(false);
  const enabled = import.meta.env.VITE_CINEMA_MONETAG_INPAGE_SLOT_ENABLED === "true";

  useEffect(() => {
    const syncConsent = () => {
      setConsentGranted(
        document.documentElement.dataset.cinemaAdvertisingConsent === "granted",
      );
    };
    syncConsent();
    window.addEventListener("cinema:advertising-consent-changed", syncConsent);
    return () => window.removeEventListener("cinema:advertising-consent-changed", syncConsent);
  }, []);

  if (!enabled || !consentGranted) return null;

  const srcDoc = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;padding:0;width:100%;min-height:120px;overflow:hidden;background:transparent}</style>
</head>
<body>
<script>(function(s){s.dataset.zone='12315745',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
</body></html>`;

  return (
    <aside
      className="my-4 w-full overflow-hidden"
      aria-label="Sponsored advertisement"
      data-cinema-monetag-slot
    >
      <iframe
        title="Sponsored advertisement"
        srcDoc={srcDoc}
        loading="lazy"
        referrerPolicy="strict-origin"
        sandbox="allow-scripts allow-popups"
        width="100%"
        height="120"
        scrolling="no"
        className="block w-full border-0"
      />
    </aside>
  );
}
