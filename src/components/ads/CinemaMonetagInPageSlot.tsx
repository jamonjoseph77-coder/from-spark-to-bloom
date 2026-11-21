import { useEffect, useState } from "react";

/**
 * Monetag In-Page Push zones are isolated in separate sandboxed, fixed-size
 * iframes. Both remain disabled unless the production build explicitly opts in.
 * Provider scripts never run in Cinema's top-level document.
 */
const MONETAG_ZONES = [
  { id: "12315745", label: "Cinema sponsored placement 1" },
  { id: "12315947", label: "Cinema sponsored placement 2" },
] as const;

function buildZoneDocument(zoneId: string) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;padding:0;width:100%;min-height:120px;overflow:hidden;background:transparent}</style>
</head>
<body>
<script>(function(s){s.dataset.zone='${zoneId}',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
</body></html>`;
}

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

  return (
    <div className="my-4 flex w-full flex-col gap-4" data-cinema-monetag-slots>
      {MONETAG_ZONES.map((zone) => (
        <aside
          key={zone.id}
          className="w-full overflow-hidden"
          aria-label="Sponsored advertisement"
          data-cinema-monetag-slot={zone.id}
        >
          <iframe
            title={zone.label}
            srcDoc={buildZoneDocument(zone.id)}
            loading="lazy"
            referrerPolicy="strict-origin"
            sandbox="allow-scripts allow-popups"
            width="100%"
            height="120"
            scrolling="no"
            className="block w-full border-0"
          />
        </aside>
      ))}
    </div>
  );
}
