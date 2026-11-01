import { UserRound, Users, Heart, Bookmark, ShieldCheck } from 'lucide-react';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';
import { ProfileForm } from '@/components/social/ProfileForm';
import { SignedOutGate } from '@/components/social/SignedOutGate';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { PAGE_CONTAINER } from '@/components/ui/styles';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchProfile } from '@/lib/profiles';

function ProfileEditor({ userId }: { userId: string }) {
  const { data: profile, loading, error, reload } = useAsyncData(() => fetchProfile(userId), [userId]);
  if (loading && !profile) return <LoadingState />;
  if (error) return <ErrorState onRetry={reload} />;
  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cinema-900/70 via-ink-900 to-ink-950 p-6 sm:p-8">
        <div className="absolute -right-12 -top-16 -z-10 h-56 w-56 rounded-full bg-cinema-400/10 blur-3xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileAvatar name={profile?.display_name ?? 'C'} size="lg" />
          <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cinema-200">Your Cinema identity</p><h2 className="mt-1 truncate text-2xl font-black tracking-tight text-white">{profile?.display_name ?? 'Set up your profile'}</h2><p className="mt-1 text-sm text-slate-300">{profile ? `@${profile.username}` : 'Choose a name friends can recognise.'}</p>{profile?.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{profile.bio}</p>}</div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">{profile?.is_discoverable ? 'Discoverable' : 'Private in search'}</span>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        <a href="/friends" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/70 p-4 transition hover:border-cinema-400/30"><Users className="h-5 w-5 text-cinema-300" /><span className="text-sm font-semibold text-white">Friends</span></a>
        <a href="/my-cinema" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/70 p-4 transition hover:border-cinema-400/30"><Bookmark className="h-5 w-5 text-cinema-300" /><span className="text-sm font-semibold text-white">My Cinema</span></a>
        <a href="/watch-parties" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/70 p-4 transition hover:border-cinema-400/30"><Heart className="h-5 w-5 text-cinema-300" /><span className="text-sm font-semibold text-white">Watch together</span></a>
      </div>
      <section className="space-y-4"><div><h3 className="text-lg font-extrabold text-white">Profile details</h3><p className="mt-1 text-sm text-slate-400">Manage how people recognise you and control whether your profile appears in friend search.</p></div><ProfileForm key={profile?.updated_at ?? 'new'} userId={userId} profile={profile} onSaved={reload} /></section>
      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cinema-300" />Your profile visibility setting controls discovery in Cinema. Your account and private information remain managed through your sign-in settings.</p>
    </div>
  );
}

export function ProfilePage() {
  const { user, loading } = useAuth();
  return (
    <div className={`${PAGE_CONTAINER} space-y-8`}>
      <header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cinema-300">Your Cinema</p><h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"><UserRound className="h-7 w-7 text-cinema-300" /> Your profile</h1><p className="max-w-2xl text-sm text-slate-400">Your identity in Cinema. Set up your profile, connect with friends and manage how people find you.</p></header>
      {loading && <LoadingState />}
      {!loading && !user && <SignedOutGate icon={<UserRound className="h-7 w-7 text-cinema-300" />} title="Sign in to set up your profile" description="Your profile is how friends find you and how watch party guests see your name." />}
      {!loading && user && <ProfileEditor userId={user.id} />}
    </div>
  );
}
