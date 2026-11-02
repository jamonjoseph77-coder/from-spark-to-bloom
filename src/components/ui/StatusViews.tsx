import type { ReactNode } from 'react';
import { AlertTriangle, Clapperboard, Sparkles } from 'lucide-react';
import { BUTTON_PRIMARY } from '@/components/ui/styles';

export function LoadingState({ label = 'Getting your stories ready' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[28vh] flex-col items-center justify-center gap-3 px-4 py-8 text-center text-slate-400">
      <span className="relative grid h-16 w-16 place-items-center rounded-[1.35rem] border border-sky-200/20 bg-[radial-gradient(circle_at_30%_20%,rgba(125,190,255,.24),rgba(21,55,99,.18)_52%,rgba(5,12,25,.9))] shadow-[inset_0_1px_12px_rgba(255,255,255,.08),0_10px_36px_rgba(22,103,210,.16)]">
        <span className="absolute -inset-1 rounded-[1.55rem] border border-sky-300/10 animate-pulse" />
        <Clapperboard className="h-7 w-7 text-sky-200 drop-shadow-[0_0_10px_rgba(96,165,250,.6)]" aria-hidden="true" />
        <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-cyan-200" aria-hidden="true" />
      </span>
      <span className="text-sm font-bold text-slate-100">{label}</span>
      <span className="max-w-xs text-xs leading-5 text-slate-500">A little moment while we get everything ready for you.</span>
      <span className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-white/[.08]">
        <span className="block h-full w-2/5 animate-[loading-sweep_1.7s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-cinema-500 via-sky-200 to-cinema-400" />
      </span>
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
