import { UserPlus, Users, MessageSquareText, PartyPopper, Sparkles } from 'lucide-react';
import { FriendsHub } from '@/components/social/FriendsHub';
import { SignedOutGate } from '@/components/social/SignedOutGate';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, PAGE_CONTAINER, SECTION_HEADING } from '@/components/ui/styles';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchProfile } from '@/lib/profiles';
function FriendsGate({ userId }: { userId: string }) {
 const profile = useAsyncData(() => fetchProfile(userId), [userId]);
 if (profile.loading) return <LoadingState />;
 if (profile.error) return <ErrorState onRetry={profile.reload} />;
 if (!profile.data) return <EmptyState icon={<UserPlus className="h-7 w-7 text-cinema-300" />} title="Create your profile first" description="Choose a username so friends can find you. You can change your details at any time." action={<a href="/profile" className={BUTTON_PRIMARY}>Create profile</a>} />;
 return <FriendsHub userId={userId} />;
}
export function FriendsPage() {
 const { user, loading } = useAuth();
 return (
  <div className={`${PAGE_CONTAINER} space-y-9`}>
   <header className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cinema-700/30 via-ink-900 to-indigo-950 p-6 sm:p-8">
    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cinema-200"><Users className="h-4 w-4" /> Your people on Cinema</p>
    <h1 className={`${SECTION_HEADING} mt-3 text-3xl sm:text-4xl`}>Friends make stories better.</h1>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Find your people, share what you love, see their entertainment recommendations and make plans to watch together.</p>
    <div className="mt-5 flex flex-wrap gap-2"><a href="/letterbox" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15"><MessageSquareText className="h-4 w-4" /> Letterbox conversations</a><a href="/watch-parties" className="inline-flex items-center gap-2 rounded-full bg-cinema-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-cinema-400"><PartyPopper className="h-4 w-4" /> Watch together</a></div>
   </header>
   <div className="flex items-center gap-2 text-xs text-slate-500"><Sparkles className="h-4 w-4 text-cinema-300" /> Entertainment-first connections. Your privacy and comfort come first.</div>
   {loading && <LoadingState />}
   {!loading && !user && <SignedOutGate icon={<Users className="h-7 w-7 text-cinema-300" />} title="Sign in to see friends" description="Add friends by username and see the people you connect with on Cinema." />}
   {!loading && user && <FriendsGate userId={user.id} />}
  </div>
 );
}
