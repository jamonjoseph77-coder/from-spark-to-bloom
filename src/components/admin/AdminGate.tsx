import { useState, type ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, PAGE_CONTAINER } from '@/components/ui/styles';
import { EmptyState, LoadingState } from '@/components/ui/StatusViews';
import { claimFirstAdmin } from '@/lib/library';

export function AdminGate({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, refreshAdmin } = useAuth();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (loading) return <div className={PAGE_CONTAINER}><LoadingState /></div>;

  if (!user) {
    return (
      <div className={PAGE_CONTAINER}>
        <EmptyState
          icon={<ShieldCheck className="h-7 w-7 text-cinema-300" />}
          title="Content manager"
          description="Sign in with an administrator account to manage titles."
          action={<a href="/sign-in" className={BUTTON_PRIMARY}>Sign in</a>}
        />
      </div>
    );
  }

  if (!isAdmin) {
    async function claim() {
      setBusy(true);
      setMessage(null);
      try {
        const claimed = await claimFirstAdmin();
        if (claimed) {
          await refreshAdmin();
          notify('You are now a Cinema administrator.');
        } else {
          setMessage('An administrator is already set up. Ask them to grant your account access.');
        }
      } catch {
        setMessage('We could not complete this. Check your connection and try again.');
      } finally {
        setBusy(false);
      }
    }

    return (
      <div className={PAGE_CONTAINER}>
        <div className={`${CARD} mx-auto max-w-xl space-y-5 text-center`}>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cinema-600/15 ring-1 ring-cinema-400/30">
            <ShieldCheck className="h-5 w-5 text-cinema-300" />
          </span>
          <h1 className="text-xl font-extrabold text-white">Content manager access</h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Only Cinema administrators can publish titles. If Cinema has no administrator yet, you can claim the first administrator role.
          </p>
          {message && <p role="status" className="rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-300">{message}</p>}
          <button type="button" onClick={() => void claim()} disabled={busy} className={BUTTON_PRIMARY}>
            {busy ? 'Checking...' : 'Claim administrator access'}
          </button>
          <a href="/my-cinema" className={`${BUTTON_SECONDARY} w-full`}>Back to My Cinema</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
