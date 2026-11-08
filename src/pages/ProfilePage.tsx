import { useEffect, useState } from 'react';
import { UserRound, Users, Heart, Bookmark, ShieldCheck, MessageCircle, Film, Eye, EyeOff, ArrowUpRight, Sparkles } from 'lucide-react';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';
import { ProfileForm } from '@/components/social/ProfileForm';
import { SignedOutGate } from '@/components/social/SignedOutGate';
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/StatusViews';
import { PAGE_CONTAINER } from '@/components/ui/styles';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchProfile, fetchProfileByUsername } from '@/lib/profiles';
import { fetchLetterboxFeed } from '@/lib/letterbox';

function ProfileEditor({ userId }: { userId: string }) {
  const { data: profile, loading, error, reload } = useAsyncData(() => fetchProfile(userId), [userId]);
  if (loading && !profile) return <LoadingState />;
  if (error) return <ErrorState onRetry={reload} />;
  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_85%_8%,rgba(154,190,169,.13),transparent_38%),linear-gradient(135deg,#141b17,#0b100e_62%,#080b0a)] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="absolute -right-12 -top-16 -z-10 h-56 w-56 rounded-full bg-cinema-400/10 blur-3xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileAvatar name={profile?.display_name ?? 'C'} imageUrl={profile?.avatar_url} size="lg" />
          <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cinema-200">Your Cinema identity</p><h2 className="mt-1 truncate text-2xl font-black tracking-tight text-white">{profile?.display_name ?? 'Set up your profile'}</h2><p className="mt-1 text-sm text-slate-300">{profile ? `@${profile.username}` : 'Choose a name friends can recognise.'}</p>{profile?.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{profile.bio}</p>}</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-semibold text-slate-200">{profile?.is_discoverable ? <Eye className="h-3.5 w-3.5 text-cinema-200" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}{profile?.is_discoverable ? 'Discoverable' : 'Private In Search'}</span>
            {profile?.username && <a href={profile.is_discoverable ? `/profile?username=${encodeURIComponent(profile.username)}` : '/friends'} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:text-white">{profile.is_discoverable ? 'Preview Profile' : 'Find Friends'} <ArrowUpRight className="h-3.5 w-3.5" /></a>}
          </div>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Your Cinema shortcuts">
        <a href="/friends" className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-0.5 hover:border-cinema-300/30"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.045]"><Users className="h-5 w-5 text-cinema-200" /></span><span className="min-w-0"><span className="block text-sm font-bold text-white">Friends</span><span className="mt-0.5 block text-xs text-slate-500">Connect With Your Cinema Circle</span></span></a>
        <a href="/my-cinema" className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-0.5 hover:border-cinema-300/30"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.045]"><Bookmark className="h-5 w-5 text-cinema-200" /></span><span className="min-w-0"><span className="block text-sm font-bold text-white">My Cinema</span><span className="mt-0.5 block text-xs text-slate-500">Your Saved Stories And History</span></span></a>
        <a href="/watch-parties" className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-0.5 hover:border-cinema-300/30"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.045]"><Heart className="h-5 w-5 text-cinema-200" /></span><span className="min-w-0"><span className="block text-sm font-bold text-white">Watch Parties</span><span className="mt-0.5 block text-xs text-slate-500">Enjoy Stories Together</span></span></a>
      </section>
      <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cinema-200"><Sparkles className="h-3.5 w-3.5" /> Make It Yours</p><h3 className="mt-1 text-xl font-extrabold text-white">Profile Details</h3><p className="mt-1 max-w-2xl text-sm text-slate-400">Choose how people recognise you, write a short introduction and control what your Cinema circle can discover.</p></div><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[11px] font-semibold text-slate-400">Changes Are Private Until Saved</span></div><ProfileForm key={profile?.updated_at ?? 'new'} userId={userId} profile={profile} onSaved={reload} /></section>
      <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cinema-200" /><p><strong className="text-slate-200">Your privacy matters.</strong> Your profile visibility setting controls discovery in Cinema. Watching activity stays private unless you choose to share it with accepted friends. Your sign-in and account security remain managed separately.</p></div>
    </div>
  );
}

function PublicFriendProfile({ username }: { username: string }) {
  const { data, error, reload, loading } = useAsyncData(async () => {
    const profile = await fetchProfileByUsername(username);
    if (!profile) return null;
    const posts = await fetchLetterboxFeed(20, profile.user_id);
    return { profile, posts };
  }, [username]);

  if (loading && !data) return <LoadingState label="Opening profile" />;
  if (error) return <ErrorState onRetry={reload} />;
  if (!data || !data.profile) return <EmptyState icon={<UserRound className="h-7 w-7 text-cinema-300" />} title="Profile unavailable" description="This profile may be private, unavailable or no longer active." action={<a href="/friends" className="text-sm font-bold text-cinema-200 hover:text-white">Back to Friends</a>} />;

  const { profile, posts } = data;
  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-sky-300/[.12] via-ink-900 to-ink-950 p-6 sm:p-9">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileAvatar name={profile.display_name} imageUrl={profile.avatar_url} size="lg" />
          <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.18em] text-sky-200">Cinema profile</p><h2 className="mt-2 truncate text-3xl font-black text-white">{profile.display_name}</h2><p className="mt-1 text-sm text-slate-300">@{profile.username}</p>{profile.bio && <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{profile.bio}</p>}</div>
          <a href="/friends" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"><Users className="h-4 w-4" /> Friends</a>
        </div>
      </section>
      <section className="space-y-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">Their Cinema circle</p><h3 className="text-xl font-extrabold text-white">Shared thoughts and recommendations</h3><p className="mt-1 text-sm text-slate-400">Public entertainment conversations from this profile.</p></div>
        {posts.length ? <div className="grid gap-4 lg:grid-cols-2">{posts.map((post) => <article key={post.id} className="rounded-2xl border border-white/10 bg-ink-900/75 p-5"><div className="flex items-center gap-2 text-xs text-slate-500"><MessageCircle className="h-4 w-4 text-cinema-300" /> {new Date(post.created_at).toLocaleDateString()} <span className="ml-auto inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post.reactionCount}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{post.body}</p>{post.title && <a href={`/title/${post.title.id}`} className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3 transition hover:border-sky-200/25"><Film className="h-5 w-5 text-sky-200" /><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-sky-200">Discussing</span><span className="block truncate text-sm font-bold text-white">{post.title.title}</span></span></a>}</article>)}</div> : <EmptyState icon={<MessageCircle className="h-7 w-7 text-cinema-300" />} title="No public messages yet" description="When this member shares an entertainment recommendation or discussion, it will appear here." />}
      </section>
    </div>
  );
}

export function ProfilePage() {
  const { user, loading } = useAuth();
  const [publicUsername, setPublicUsername] = useState<string | null>(null);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('username');
    setPublicUsername(value?.trim() || null);
  }, []);

  if (publicUsername) return <div className={`${PAGE_CONTAINER} space-y-8 pb-12`}><header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cinema-300">Friends & discovery</p><h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"><UserRound className="h-7 w-7 text-cinema-300" /> Profile</h1></header><PublicFriendProfile username={publicUsername} /></div>;

  return (
    <div className={`${PAGE_CONTAINER} space-y-8`}>
      <header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cinema-300">Your Cinema</p><h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"><UserRound className="h-7 w-7 text-cinema-300" /> Your profile</h1><p className="max-w-2xl text-sm text-slate-400">Add your photo, choose how your name appears, and decide who can find your profile.</p></header>
      {loading && <LoadingState />}
      {!loading && !user && <SignedOutGate icon={<UserRound className="h-7 w-7 text-cinema-300" />} title="Sign in to set up your profile" description="Your profile is how friends find you and how watch party guests see your name." />}
      {!loading && user && <ProfileEditor userId={user.id} />}
    </div>
  );
}
