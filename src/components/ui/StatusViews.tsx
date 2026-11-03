import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BUTTON_PRIMARY } from '@/components/ui/styles';

export function LoadingState({ label = 'Getting your stories ready' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[28vh] flex-col items-center justify-center gap-3 px-4 py-8 text-center text-slate-400">
      <span className="relative grid h-16 w-16 place-items-center rounded-full border border-sky-200/20 bg-ink-900 shadow-[0_12px_40px_rgba(22,103,210,.18)]">
        <span className="absolute -inset-2 rounded-full border border-sky-300/15 animate-pulse" />
        <img src="/cinema-icon.png" alt="" className="relative h-12 w-12 rounded-full object-cover" />
      </span>
      <span className="text-sm font-bold text-slate-100">{label}</span>
      <span className="max-w-xs text-xs leading-5 text-slate-500">Getting your Cinema experience ready.</span>
      <span className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-white/[.08]">
        <span className="block h-full w-2/5 animate-[cinema-loading_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-cinema-500 via-sky-200 to-cinema-400" />
      </span>
      <style>{`@keyframes cinema-loading { 0% { transform: translateX(-130%); } 100% { transform: translateX(280%); } }`}</style>
    </div>
  );
}

export function ErrorState({ onRetry, description }: { onRetry?: () => void; description?: string }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-7 w-7 text-amber-400" />}
      title="We couldn't load this right now"
      description={description || "Check your connection and try again. If the problem continues, please try again in a few minutes."}
      action={onRetry && <button type="button" onClick={onRetry} className={BUTTON_PRIMARY}>Try Again</button>}
    />
  );
}

interface EmptyStateProps { icon: ReactNode; title: string; description: string; action?: ReactNode }

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-ink-900/60 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cinema-600/15 ring-1 ring-cinema-400/30">{icon}</span>
      <h2 className="text-lg font-extrabold text-white">{title}</h2>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
