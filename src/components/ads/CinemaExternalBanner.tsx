import { useEffect, useMemo, useState } from "react";

const MARKETPLACE_ORIGIN = import.meta.env.VITE_CINEMA_PRESENCE_MARKETPLACE_ORIGIN ?? "";

function getMarketplaceBannerUrl() {
  try {
    const parsed = new URL(MARKETPLACE_ORIGIN);
    if (parsed.protocol !== "https:" || parsed.origin !== MARKETPLACE_ORIGIN
      || parsed.username || parsed.password) return null;
    return `${parsed.origin}/api/ads/external-banner-frame?slot=marketplace_banner`;
  } catch {
    return null;
  }
}

/**
 * Renders the approved external banner in a sandboxed, isolated frame.
 * The caller must pass both gates only after the viewer's consent and the
 * authorised publisher's age/creative/privacy approvals have been verified.
 */
export function CinemaExternalBanner({
  consentGranted,
  placementApproved,
  className,
}: {
  consentGranted: boolean;
  placementApproved: boolean;
  className?: string;
}) {
  const src = useMemo(() => getMarketplaceBannerUrl(), []);

  if (!src || !consentGranted || !placementApproved) return null;

  return (
    <aside
      className={className ?? "my-4 w-full max-w-[300px] mx-auto overflow-hidden"}
      aria-label="Sponsored advertisement"
      data-cinema-external-banner
    >
      <iframe
        title="Sponsored advertisement"
        src={src}
        loading="lazy"
        referrerPolicy="strict-origin"
        sandbox="allow-scripts allow-popups"
        width="300"
        height="250"
        scrolling="no"
        className="mx-auto block w-full max-w-[300px] border-0"
      />
    </aside>
  );
}

/**
 * Home-page wrapper: optional ads remain off unless the published build has an
 * explicit placement approval flag and the visitor has granted advertising
 * consent. The Marketplace endpoint independently enforces publisher, policy,
 * creative, privacy, territory and placement approvals before loading a banner.
 */
export function CinemaExternalBannerSlot() {
  const [consentGranted, setConsentGranted] = useState(false);
  const placementApproved = import.meta.env.VITE_CINEMA_ADSTERRA_HOME_SLOT_APPROVED === "true";

  useEffect(() => {
    const syncConsent = () => {
      setConsentGranted(document.documentElement.dataset.cinemaAdvertisingConsent === "granted");
    };
    syncConsent();
    window.addEventListener("cinema:advertising-consent-changed", syncConsent);
    return () => window.removeEventListener("cinema:advertising-consent-changed", syncConsent);
  }, []);

  return (
    <CinemaExternalBanner
      consentGranted={consentGranted}
      placementApproved={placementApproved}
    />
  );
}
