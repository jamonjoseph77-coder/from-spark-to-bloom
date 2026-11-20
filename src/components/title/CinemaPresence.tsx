import { useEffect, useRef } from 'react';

const PRESENCE_SCRIPT_URL = 'https://cinema-presence-marketplace.lovable.app/cinema-presence.js';

/**
 * The single launch placement: a compact, disclosed Presence association
 * beneath a published title's primary information. The server remains the
 * authority for title rights, territory, campaign and payment eligibility.
 */
export function CinemaPresence({ titleId }: { titleId: string }) {
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!titleId || !slotRef.current) return;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cinema-presence-loader="true"]',
    );
    if (existing) return;

    const script = document.createElement('script');
    script.src = PRESENCE_SCRIPT_URL;
    script.async = true;
    script.dataset.cinemaPresenceLoader = 'true';
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    document.head.appendChild(script);

    return () => {
      slotRef.current?.replaceChildren();
    };
  }, [titleId]);

  return (
    <div
      ref={slotRef}
      data-cinema-presence
      data-title-id={titleId}
      data-placement="title_badge"
      data-territory="GHA"
      className="mt-5 w-full max-w-xl"
      aria-label="Cinema Presence title partner"
    />
  );
}
