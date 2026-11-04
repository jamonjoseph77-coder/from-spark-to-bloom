import { useState } from 'react';
import { BellPlus, BellRing } from 'lucide-react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchFollowedPublishers, followPublisher, unfollowPublisher } from '@/lib/publisherFollows';

export function KeepUpButton({ publisherName }: { publisherName: string }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const follows = useAsyncData(
    () => user ? fetchFollowedPublishers(user.id) : Promise.resolve([] as string[]),
    [user?.id],
  );
  const [busy, setBusy] = useState(false);
  const isFollowing = follows.data?.includes(publisherName) ?? false;

  async function toggle() {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (isFollowing) await unfollowPublisher(user.id, publisherName);
      else await followPublisher(user.id, publisherName);
      await follows.reload();
    } catch {
      notify('We could not update your Track list. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!publisherName.trim()) return null;
  if (!user) return <a href="/sign-in" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.05] px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"><BellPlus className="h-4 w-4" /> Follow</a>;

  return (
    <button type="button" onClick={() => void toggle()} disabled={busy || follows.loading} aria-pressed={isFollowing} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.05] px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-cinema-300/35 hover:bg-cinema-300/[.08] disabled:opacity-60">
      {isFollowing ? <BellRing className="h-4 w-4 text-cinema-200" /> : <BellPlus className="h-4 w-4" />}
      {isFollowing ? 'Tracking' : 'Track'}
    </button>
  );
}
