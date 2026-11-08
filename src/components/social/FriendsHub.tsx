import { useEffect, useState } from 'react';
import { Compass, MessageCircle, Share2, UserPlus, Users } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { chipClass } from '@/components/ui/styles';
import { FindPeople } from '@/components/social/FindPeople';
import { FriendRequests, FriendsList } from '@/components/social/FriendsList';
import { CircleActivity } from '@/components/social/CircleActivity';
import { SharedWithYou } from '@/components/social/SharedWithYou';
import { useAsyncData } from '@/hooks/useAsyncData';
import { loadFriendsSnapshot } from '@/lib/friends';
import { supabase } from '@/lib/supabase';
import { createRealtimeChannel } from '@/lib/realtime';

type Tab = 'circle' | 'friends' | 'requests' | 'find' | 'shared';

const TABS: { key: Tab; label: string }[] = [
  { key: 'circle', label: 'From Your Circle' },
  { key: 'friends', label: 'Friends' },
  { key: 'requests', label: 'Requests' },
  { key: 'find', label: 'Find People' },
  { key: 'shared', label: 'Shared With You' },
];

export function FriendsHub({ userId }: { userId: string }) {
  const { data: snapshot, error, reload } = useAsyncData(() => loadFriendsSnapshot(userId), [userId]);
  const [tab, setTab] = useState<Tab>('circle');

  useEffect(() => {
    const channel = createRealtimeChannel(`cinema-friends-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${userId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` }, reload)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [reload, userId]);

  if (!snapshot) return error ? <ErrorState onRetry={reload} /> : <LoadingState />;

  const requestCount = snapshot.incoming.length;
  const friendIds = snapshot.friends.map((friend) => friend.otherUserId);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.6rem] border border-[#91b7a2]/20 bg-[radial-gradient(ellipse_at_90%_0%,rgba(116,164,137,.16),transparent_42%),linear-gradient(125deg,#202a24,#151d19_58%,#121815)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a8cbb6]">Your Cinema Circle</p>
            <p className="mt-1 text-lg font-extrabold text-white">{snapshot.friends.length} {snapshot.friends.length === 1 ? 'Connection' : 'Connections'}</p>
            <p className="mt-1 text-xs text-slate-300">People, recommendations and stories you choose to share.</p>
          </div>
          <a href="/letterbox" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.07] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-white/[.12]">
            <MessageCircle className="h-4 w-4 text-[#a8cbb6]" /> Conversations
          </a>
        </div>
      </div>
      <div role="tablist" aria-label="Friends sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#151d19] p-2 pb-2 shadow-lg shadow-black/10">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${tab === item.key ? 'border-[#a8cbb6]/45 bg-[#a8cbb6]/15 text-white shadow-[0_6px_20px_rgba(80,130,100,.12)]' : 'border-transparent bg-white/[.025] text-slate-300 hover:border-white/10 hover:bg-white/[.07] hover:text-white'}`}
          >
            {item.key === 'circle' && <MessageCircle className="h-4 w-4" />}
            {item.key === 'friends' && <Users className="h-4 w-4" />}
            {item.key === 'requests' && <UserPlus className="h-4 w-4" />}
            {item.key === 'find' && <Compass className="h-4 w-4" />}
            {item.key === 'shared' && <Share2 className="h-4 w-4" />}
            {item.label}
            {item.key === 'friends' && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{snapshot.friends.length}</span>}
            {item.key === 'requests' && requestCount > 0 && (
              <span className="rounded-full bg-[#a8cbb6] px-1.5 py-0.5 text-[10px] font-extrabold text-[#18211b]">{requestCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'circle' && <CircleActivity friendIds={friendIds} />}
      {tab === 'friends' && <FriendsList friends={snapshot.friends} onChanged={reload} />}
      {tab === 'requests' && (
        <FriendRequests incoming={snapshot.incoming} outgoing={snapshot.outgoing} onChanged={reload} />
      )}
      {tab === 'find' && <FindPeople userId={userId} relations={snapshot.relations} onChanged={reload} />}
      {tab === 'shared' && <SharedWithYou />}
    </div>
  );
}
