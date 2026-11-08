import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BUTTON_PRIMARY } from '@/components/ui/styles';

export function LoadingState({ label = 'Getting Your Stories Ready', compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-3 px-4 text-center text-slate-400 ${compact ? 'min-h-[12rem] py-6' : 'min-h-[28vh] py-10'}`}>
      <span className="cinema-loading-mark relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border border-white/15 bg-[#090d0b] shadow-[0_0_34px_rgba(0,0,0,.3)]">
        <span className="absolute -inset-2 rounded-full border border-white/10 motion-safe:animate-[spin_5s_linear_infinite] motion-reduce:animate-none" />
        <span className="absolute -inset-1 rounded-full border border-cinema-200/20 motion-safe:animate-pulse motion-reduce:animate-none" />
        <img src="/cinema-icon.png" alt="" className="relative h-12 w-12 rounded-full object-cover drop-shadow-[0_0_14px_rgba(220,230,224,.18)]" />
      </span>
      <span className="text-sm font-bold text-slate-100">{label}</span>
      <span className="max-w-xs text-xs leading-5 text-slate-500">{compact ? 'One moment. This part of Cinema is getting ready.' : 'We’re bringing your Cinema experience together.'}</span>
      <span className="cinema-loading-track mt-1 h-1 w-36 overflow-hidden rounded-full bg-white/[.08]" aria-hidden="true">
        <span className="block h-full w-2/5 cinema-loading-progress animate-[cinema-loading_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#aebbb2] via-[#e0e7e1] to-[#829188] motion-reduce:animate-none" />
      </span>
    </div>
  );
}

export function ErrorState({ onRetry, description }: { onRetry?: () => void; description?: string }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-7 w-7 text-amber-400" />}
      title="We Couldn't Load This Right Now"
      description={description || 'Check your connection and try again. If the problem continues, please try again in a few minutes.'}
      action={onRetry && <button type="button" onClick={onRetry} className={BUTTON_PRIMARY}>Try Again</button>}
    />
  );
}

interface EmptyStateProps { icon: ReactNode; title: string; description: string; action?: ReactNode }

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="cinema-empty-board mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-white/15 bg-ink-900/60 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cinema-600/15 ring-1 ring-cinema-400/30">{icon}</span>
      <h2 className="text-lg font-extrabold text-white">{title}</h2>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
