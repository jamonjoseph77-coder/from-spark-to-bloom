import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { BUTTON_PRIMARY } from '@/components/ui/styles';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-slate-400">
      <span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-cinema-300/20 bg-cinema-500/[0.08] shadow-[0_0_40px_rgba(37,99,235,.12)]">
        <span className="absolute inset-0 animate-ping rounded-2xl border border-cinema-300/20" />
        <Loader2 className="h-7 w-7 animate-spin text-cinema-300" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium">{label}...</span>
      <span className="h-1 w-32 overflow-hidden rounded-full bg-white/10"><span className="block h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-cinema-500 to-sky-300" /></span>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-7 w-7 text-amber-400" />}
      title="We could not load this right now"
      description="Check your connection and try again. If the problem continues, come back in a few minutes."
      action={
        onRetry && (
          <button type="button" onClick={onRetry} className={BUTTON_PRIMARY}>
            Try again
          </button>
        )
      }
    />
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-ink-900/60 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cinema-600/15 ring-1 ring-cinema-400/30">
        {icon}
      </span>
      <h2 className="text-lg font-extrabold text-white">{title}</h2>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
