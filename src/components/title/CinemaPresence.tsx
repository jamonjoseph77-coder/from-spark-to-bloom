import { useEffect, useRef } from 'react';

const PRESENCE_SCRIPT_URL = 'https://cinema-presence-marketplace.lovable.app/cinema-presence.js?v=20261120-consent-gated';
type Placement = 'title_badge' | 'poster_ribbon' | 'trailer_header' | 'showtime_card' | 'explore_native' | 'opening_slate' | 'pause_frame' | 'ambient_lobby' | 'companion_offer' | 'closing_slate' | 'home_shelf' | 'category_feature' | 'premiere_feature';

export function CinemaPresence({
  titleId, collectionId, placement = 'title_badge', territory = 'GHA', className,
}: {
  titleId?: string; collectionId?: string; placement?: Placement; territory?: string; className?: string;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const targetKey = titleId || collectionId || '';

  useEffect(() => {
    if (!targetKey || !slotRef.current) return;
    let cancelled = false;
    let retryTimer: number | undefined;

    const loadScript = (attempt: number) => {
      if (cancelled) return;
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-cinema-presence-loader="true"]',
      );
      if (existing && existing.dataset.cinemaPresenceFailed !== 'true') return;
      existing?.remove();

      const script = document.createElement('script');
      script.src = PRESENCE_SCRIPT_URL;
      script.async = true;
      script.dataset.cinemaPresenceLoader = 'true';
      script.referrerPolicy = 'strict-origin-when-cross-origin';
      script.onerror = () => {
        script.dataset.cinemaPresenceFailed = 'true';
        script.remove();
        if (!cancelled && attempt === 0) {
          retryTimer = window.setTimeout(() => loadScript(1), 1200);
        }
      };
      document.head.appendChild(script);
    };

    loadScript(0);
    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      slotRef.current?.replaceChildren();
    };
  }, [targetKey]);

  if (!targetKey) return null;
  return (
    <div
      ref={slotRef}
      data-cinema-presence
      data-title-id={titleId || undefined}
      data-collection-id={collectionId || undefined}
      data-placement={placement}
      data-territory={territory}
      className={className || "mt-5 w-full max-w-xl"}
      aria-label="Cinema Presence partner"
    />
  );
}
