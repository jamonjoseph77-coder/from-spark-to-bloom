import { useMemo } from "react";

const MARKETPLACE_ORIGIN = "https://cinema-presence-marketplace.lovable.app";

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
  const src = useMemo(
    () => `${MARKETPLACE_ORIGIN}/api/ads/external-banner-frame?slot=marketplace_banner`,
    [],
  );

  if (!consentGranted || !placementApproved) return null;

  return (
    <aside
      className={className ?? "my-4 w-full overflow-hidden"}
      aria-label="Sponsored advertisement"
      data-cinema-external-banner
    >
      <iframe
        title="Sponsored advertisement"
        src={src}
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
