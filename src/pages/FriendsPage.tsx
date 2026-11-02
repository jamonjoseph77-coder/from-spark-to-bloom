import { UserPlus, Users, Compass, PartyPopper, ShieldCheck, UserRound, Sparkles } from 'lucide-react';
import { FriendsHub } from '@/components/social/FriendsHub';
import { LetterboxPage } from '@/pages/LetterboxPage';
import { SignedOutGate } from '@/components/social/SignedOutGate';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, PAGE_CONTAINER } from '@/components/ui/styles';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchProfile } from '@/lib/profiles';

function FriendsGate({ userId }: { userId: string }) {
  const profile = useAsyncData(() => fetchProfile(userId), [userId]);
  if (profile.loading) return <LoadingState />;
  if (profile.error) return <ErrorState onRetry={profile.reload} />;
  if (!profile.data) {
    return (
      <EmptyState
        icon={<UserPlus className="h-7 w-7 text-cinema-300" />}
        title="Create your Cinema profile"
        description="Choose a username and profile name so friends can recognise you and connect around the entertainment they love."
        action={<a href="/profile" className={BUTTON_PRIMARY}>Set up profile</a>}
      />
    );
  }
  return <FriendsHub userId={userId} />;
}

export function FriendsPage() {
  const { user, loading } = useAuth();
  return (
    <div className={`${PAGE_CONTAINER} space-y-9 pb-12`}>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cinema-500/20 via-ink-900 to-ink-950 p-6 shadow-2xl shadow-black/20 sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-cinema-400/15 blur-3xl" />
        <div className="relative">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cinema-200"><Users className="h-4 w-4" /> Your people on Cinema</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">The best stories find their way between friends.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Build your circle around the movies, series, sports and stories you love. Find people, share recommendations and make plans to experience something together.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="/discover" className={`${BUTTON_SECONDARY} rounded-full`}><Compass className="h-4 w-4" /> Explore stories</a>
            <a href="/watch-parties" className={`${BUTTON_PRIMARY} rounded-full`}><PartyPopper className="h-4 w-4" /> Watch together</a>
            <a href="/profile" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"><UserRound className="h-4 w-4" /> Your profile</a>
          </div>
        </div>
        <div className="relative mt-7 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-ink-950/45 p-4"><Users className="h-5 w-5 text-cinema-200" /><p className="mt-3 text-sm font-bold text-white">Your circle</p><p className="mt-1 text-xs leading-5 text-slate-400">Find and connect with people by username.</p></div>
          <div className="rounded-2xl bg-ink-950/45 p-4"><Sparkles className="h-5 w-5 text-cinema-200" /><p className="mt-3 text-sm font-bold text-white">Shared discoveries</p><p className="mt-1 text-xs leading-5 text-slate-400">Pass along titles and recommendations worth seeing.</p></div>
          <div className="rounded-2xl bg-ink-950/45 p-4"><PartyPopper className="h-5 w-5 text-cinema-200" /><p className="mt-3 text-sm font-bold text-white">Watch together</p><p className="mt-1 text-xs leading-5 text-slate-400">Bring your circle into a shared watch party.</p></div>
        </div>
      </header>
      <div className="flex items-start gap-2 rounded-2xl border border-white/8 bg-ink-900/55 p-4 text-xs leading-5 text-slate-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cinema-300" />
        <p>Cinema connections are built around entertainment. You control your profile visibility, and you can manage friend requests and remove connections. This space is for discovery and shared viewing—not private messaging.</p>
      </div>
      {loading && <LoadingState />}
      {!loading && !user && <SignedOutGate icon={<Users className="h-7 w-7 text-cinema-300" />} title="Sign in to build your circle" description="Create your Cinema profile, find people by username and connect around stories you enjoy." />}
      {!loading && user && <>
        <FriendsGate userId={user.id} />
        <section className="space-y-4 border-t border-white/10 pt-8">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">Your voice</p><h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">Share a Letterbox message</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">Post a thought, review or recommendation about a movie, series or other entertainment. Your message lives alongside your friends experience.</p></div>
          <LetterboxPage embedded />
        </section>
      </>}
    </div>
  );
}
