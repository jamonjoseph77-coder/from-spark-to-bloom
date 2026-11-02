import { useEffect, useState, type FormEvent } from 'react';
import { PartyPopper, Plus, KeyRound, MessageSquareText, Radio, Users } from 'lucide-react';
import { CreatePartyDialog } from '@/components/social/CreatePartyDialog';
import { PartyCard } from '@/components/social/PartyCard';
import { SignedOutGate } from '@/components/social/SignedOutGate';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, CARD, INPUT, PAGE_CONTAINER, SECTION_HEADING } from '@/components/ui/styles';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { navigateTo } from '@/lib/router';
import {
  fetchMyPartyIds,
  fetchVisibleParties,
  joinPartyByInviteCode,
  joinPublicParty,
  subscribeToPartyChanges,
  type WatchPartyWithTitle,
} from '@/lib/watchParties';

interface PartyBoard {
  parties: WatchPartyWithTitle[];
  joinedIds: Set<string>;
}

async function loadPartyBoard(userId: string): Promise<PartyBoard> {
  const [parties, joined] = await Promise.all([fetchVisibleParties(), fetchMyPartyIds(userId)]);
  return { parties, joinedIds: new Set(joined) };
}

function WatchPartyBoard({ userId }: { userId: string }) {
  const { notify } = useToast();
  const board = useAsyncData(() => loadPartyBoard(userId), [userId]);
  useEffect(() => {
    const stopPartyUpdates = subscribeToPartyChanges(`cinema-party-board-${userId}`, 'watch_parties', null, board.reload);
    const stopMemberUpdates = subscribeToPartyChanges(`cinema-party-members-${userId}`, 'watch_party_members', `user_id=eq.${userId}`, board.reload);
    return () => { stopPartyUpdates(); stopMemberUpdates(); };
  }, [board.reload, userId]);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);

  if (!board.data) return board.error ? <ErrorState onRetry={board.reload} /> : <LoadingState />;

  const { parties, joinedIds } = board.data;
  const mine = parties.filter((party) => joinedIds.has(party.id));
  const sortedMine = [...mine].sort((a, b) => Number(a.status === 'ended') - Number(b.status === 'ended'));
  const open = parties.filter((party) => !joinedIds.has(party.id) && party.visibility === 'public' && party.status !== 'ended');

  async function handleJoin(party: WatchPartyWithTitle) {
    setJoiningId(party.id);
    try {
      await joinPublicParty(party.id, userId);
      navigateTo(`/watch-parties/${party.id}`);
    } catch {
      notify('We could not join that party. It may have ended.', 'error');
      setJoiningId(null);
    }
  }

  async function handleJoinCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = inviteCode.trim();
    if (code.length < 4) return notify('Enter the invite code you were sent.', 'error');
    setJoiningCode(true);
    try {
      const partyId = await joinPartyByInviteCode(code);
      navigateTo(`/watch-parties/${partyId}`);
    } catch (error) {
      const message = error instanceof Error && error.message.includes('invite code')
        ? 'No watch party matches that invite code.'
        : 'We could not join with that code. Check it and try again.';
      notify(message, 'error');
    } finally {
      setJoiningCode(false);
    }
  }

  return (
    <div className="space-y-14">
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-end">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h2 className={SECTION_HEADING}>Your parties</h2>
            <p className="text-sm text-slate-400">Rooms you host or have joined.</p>
          </div>
          <button type="button" onClick={() => setCreating(true)} className={BUTTON_PRIMARY}>
            <Plus className="h-4 w-4" /> Create party
          </button>
        </div>
        <form onSubmit={handleJoinCode} className={`${CARD} flex flex-col gap-3 p-5`}>
          <label htmlFor="invite-code" className="text-sm font-semibold text-white">
            Have an invite code?
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="invite-code"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                maxLength={12}
                autoComplete="off"
                placeholder="ENTER CODE"
                className={`${INPUT} pl-11 tracking-[0.2em]`}
              />
            </div>
            <button type="submit" disabled={joiningCode} className={BUTTON_PRIMARY}>
              {joiningCode ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>

      <section className="space-y-6">
        {sortedMine.length === 0 ? (
          <EmptyState
            icon={<PartyPopper className="h-7 w-7 text-cinema-300" />}
            title="No watch parties yet"
            description="Create a party for a film or series, or join a public room below."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {sortedMine.map((party) => (
              <PartyCard key={party.id} party={party} joined joining={false} onJoin={handleJoin} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className={SECTION_HEADING}>Public parties</h2>
          <p className="text-sm text-slate-400">Open rooms you can join right now.</p>
        </div>
        {open.length === 0 ? (
          <p className="text-sm text-slate-500">No public parties are open at the moment.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {open.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                joined={false}
                joining={joiningId === party.id}
                onJoin={handleJoin}
              />
            ))}
          </div>
        )}
      </section>

      {creating && (
        <CreatePartyDialog
          userId={userId}
          onClose={() => setCreating(false)}
          onCreated={(partyId) => navigateTo(`/watch-parties/${partyId}`)}
        />
      )}
    </div>
  );
}

export function WatchPartiesPage() {
  const { user, loading } = useAuth();

  return (
    <div className={`${PAGE_CONTAINER} space-y-10`}>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/15 bg-gradient-to-br from-cinema-700/30 via-ink-900 to-indigo-950 p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cinema-200"><Radio className="h-4 w-4" /> Cinema live rooms</p>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-black tracking-tight text-white sm:text-5xl"><PartyPopper className="h-8 w-8 text-cinema-200" /> Watch Parties</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Bring friends and communities into one viewing room. Host a private screening or discover a public watch event, with live room chat and quick reactions.</p>
        <div className="mt-5 flex flex-wrap gap-2"><a href="/friends" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15"><Users className="h-4 w-4" /> Invite friends</a><a href="/letterbox" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15"><MessageSquareText className="h-4 w-4" /> Discuss in Letterbox</a></div>
      </header>

      {loading && <LoadingState />}
      {!loading && !user && (
        <SignedOutGate
          icon={<PartyPopper className="h-7 w-7 text-cinema-300" />}
          title="Sign in to watch together"
          description="Create or join a watch party to chat with the people in the room."
        />
      )}
      {!loading && user && <WatchPartyBoard userId={user.id} />}
    </div>
  );
}
