import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createRealtimeChannel } from '@/lib/realtime';
import { navigateTo } from '@/lib/router';
import type { Tables } from '@/integrations/supabase/types';

type NotificationItem = Tables<'notifications'>;

function safeHref(value: string): string {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/friends';
}

export function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const unreadCount = items.filter((item) => !item.read_at).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: loadError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40);
      if (loadError) throw loadError;
      setItems((data ?? []) as NotificationItem[]);
      setError(null);
    } catch (cause) {
      console.warn('Cinema notifications could not be loaded.', cause);
      setError('Notifications could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
    const channel = createRealtimeChannel(`cinema-notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const incoming = payload.new as NotificationItem;
          setItems((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)].slice(0, 40));
          setError(null);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void load();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError('Live updates are reconnecting. You can still refresh your notifications.');
        }
      });

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, [load, userId]);

  async function markRead(item: NotificationItem): Promise<void> {
    if (item.read_at) return;
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', item.id)
      .eq('user_id', userId);
    if (updateError) {
      setActionError('Could not mark this update as read. Try again.');
      return;
    }
    setActionError(null);
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: readAt } : entry));
  }

  async function markAllRead() {
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('user_id', userId)
      .is('read_at', null);
    if (updateError) {
      setActionError('Could not update all notifications. Please try again.');
      return;
    }
    setActionError(null);
    setItems((current) => current.map((item) => item.read_at ? item : { ...item, read_at: readAt }));
  }

  async function openNotification(item: NotificationItem) {
    await markRead(item);
    setOpen(false);
    navigateTo(safeHref(item.href));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((current) => !current); setActionError(null); }}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="cinema-notification-trigger relative grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-200 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-200"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-ink-950 bg-cinema-400 px-1 text-[9px] font-black leading-none text-ink-950">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <section role="dialog" aria-label="Notifications" className="cinema-notification-panel absolute right-0 top-12 z-[70] w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="text-sm font-extrabold text-white">Notifications</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">{unreadCount ? `${unreadCount} Unread` : 'You Are All Caught Up'}</p>
            </div>
            {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-cinema-200 transition hover:bg-white/5 hover:text-white"><CheckCheck className="h-3.5 w-3.5" /> Mark All Read</button>}
          </header>
          {actionError && <p role="alert" className="border-b border-rose-200/10 bg-rose-400/[.07] px-4 py-2 text-xs text-rose-100">{actionError}</p>}
          <div className="max-h-[min(65vh,26rem)] overflow-y-auto">
            {loading && <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading Notifications</div>}
            {!loading && error && <div className="space-y-3 px-4 py-7 text-center"><p className="text-sm text-slate-300">{error}</p><button type="button" onClick={() => void load()} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-cinema-200 hover:bg-white/5">Try Again</button></div>}
            {!loading && !error && items.length === 0 && <p className="px-5 py-9 text-center text-sm text-slate-400">Your Cinema Updates Will Appear Here.</p>}
            {!loading && !error && items.map((item) => (
              <button key={item.id} type="button" onClick={() => void openNotification(item)} className={`flex w-full items-start gap-3 border-b border-white/[.06] px-4 py-3 text-left transition hover:bg-white/[.045] ${item.read_at ? '' : 'bg-cinema-500/[.055]'}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read_at ? 'bg-transparent' : 'bg-cinema-300'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white">{item.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{item.body}</span>
                  <span className="mt-1.5 block text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString()}</span>
                </span>
              </button>
            ))}
          </div>
          <footer className="border-t border-white/10 px-4 py-2 text-right"><button type="button" onClick={() => void load()} className="text-[11px] font-semibold text-slate-400 hover:text-white">Refresh Updates</button></footer>
        </section>
      )}
    </div>
  );
}
