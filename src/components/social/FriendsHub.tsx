import { useEffect, useState } from 'react';
import { Activity, Users } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { chipClass } from '@/components/ui/styles';
import { FindPeople } from '@/components/social/FindPeople';
import { FriendRequests, FriendsList } from '@/components/social/FriendsList';
import { CircleActivity } from '@/components/social/CircleActivity';
import { useAsyncData } from '@/hooks/useAsyncData';
import { loadFriendsSnapshot } from '@/lib/friends';
import { supabase } from '@/lib/supabase';

type Tab = 'activity' | 'friends' | 'requests' | 'find';

const TABS: { key: Tab; label: string }[] = [
  { key: 'activity', label: 'Activity' },
  { key: 'friends', label: 'Friends' },
  { key: 'requests', label: 'Requests' },
  { key: 'find', label: 'Find people' },
];

export function FriendsHub({ userId }: { userId: string }) {
  const { data: snapshot, error, reload } = useAsyncData(() => loadFriendsSnapshot(userId), [userId]);
  const [tab, setTab] = useState<Tab>('activity');

  useEffect(() => {
    const channel = supabase.channel(`cinema-friends-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${userId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` }, reload)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [reload, userId]);

  if (!snapshot) return error ? <ErrorState onRetry={reload} /> : <LoadingState />;

  const requestCount = snapshot.incoming.length;
  const friendIds = snapshot.friends.map((friend) => friend.otherUserId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Activity className="h-4 w-4 text-cinema-300" />
          <span>Your entertainment circle</span>
          <span className="text-slate-600">·</span>
          <span>{snapshot.friends.length} {snapshot.friends.length === 1 ? 'friend' : 'friends'}</span>
        </div>
        <a href="/letterbox" className="inline-flex items-center gap-2 text-xs font-bold text-cinema-200 transition hover:text-white">
          <Users className="h-4 w-4" /> Community conversations
        </a>
      </div>
      <div role="tablist" aria-label="Friends sections" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`${chipClass(tab === item.key)} inline-flex shrink-0 items-center gap-2`}
          >
            {item.label}
            {item.key === 'friends' && <span className="text-xs opacity-70">{snapshot.friends.length}</span>}
            {item.key === 'requests' && requestCount > 0 && (
              <span className="rounded-full bg-cinema-400 px-1.5 text-xs font-bold text-ink-950">{requestCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'activity' && <CircleActivity friendIds={friendIds} />}
      {tab === 'friends' && <FriendsList friends={snapshot.friends} onChanged={reload} />}
      {tab === 'requests' && (
        <FriendRequests incoming={snapshot.incoming} outgoing={snapshot.outgoing} onChanged={reload} />
      )}
      {tab === 'find' && <FindPeople userId={userId} relations={snapshot.relations} onChanged={reload} />}
    </div>
  );
}
