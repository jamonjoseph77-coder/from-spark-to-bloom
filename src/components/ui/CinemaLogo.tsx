export function CinemaLogo({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  if (compact) {
    return <img src="/cinema-icon.png" alt="Cinema" className={`h-10 w-10 shrink-0 drop-shadow-[0_6px_14px_rgba(140,165,195,0.28)] ${className}`} />;
  }

  return (
    <span className="flex flex-col items-start gap-1.5">
      <img src="/cinema-wordmark.png" alt="Cinema" className="h-11 w-auto drop-shadow-[0_4px_12px_rgba(140,165,195,0.25)]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cinema-300/80">
        Experience the world of stories
      </span>
    </span>
  );
}
