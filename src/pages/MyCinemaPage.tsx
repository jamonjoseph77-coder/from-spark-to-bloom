import { useMemo, useState } from 'react';
import { ArrowRight, BookmarkCheck, Clock3, Heart, LogOut, ShieldCheck, Users, PartyPopper, MessageSquareText, Settings2, Building2, History, Compass, Radio, Film, Download, Info } from 'lucide-react';
import { ContinueWatchingRow } from '@/components/catalogue/ContinueWatchingRow';
import { TitleGrid } from '@/components/catalogue/TitleGrid';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, PAGE_CONTAINER, SECTION_HEADING } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { resumeItems } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { downloadPermittedClip, fetchDownloadableClips } from '@/lib/clips';
import { SavedShortsShelf } from '@/components/discover/SavedShortsShelf';
import { useToast } from '@/hooks/useToast';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';
import { fetchProfile } from '@/lib/profiles';

export function MyCinemaPage() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { notify } = useToast();
  const { data: profile } = useAsyncData(() => user ? fetchProfile(user.id) : Promise.resolve(null), [user?.id]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data: downloadableClips, error: downloadsError, reload: reloadDownloads } = useAsyncData(fetchDownloadableClips, []);
  const { watchlistIds, favouriteIds, progress, ready } = useLibrary();
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
  const { data: followedPublishers = [] } = useAsyncData(
    () => user ? fetchFollowedPublishers(user.id).catch((cause) => { console.warn('Followed publishers unavailable', cause); return []; }) : Promise.resolve([]),
    [user?.id],
  );

  const view = useMemo(() => {
    if (!titles) return null;
    return {
      resume: resumeItems(progress, titles),
      recent: [...new Map([...progress].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map((entry) => [entry.title_id, titles.find((title) => title.id === entry.title_id)]).filter((entry): entry is [string, NonNullable<typeof entry[1]>] => Boolean(entry[1]))).values()].slice(0, 12),
      watchlist: titles.filter((title) => watchlistIds.has(title.id)),
      favourites: titles.filter((title) => favouriteIds.has(title.id)),
    };
  }, [titles, progress, watchlistIds, favouriteIds]);

  if (authLoading) return <div className={PAGE_CONTAINER}><LoadingState /></div>;

  if (!user) {
    return (
      <div className={PAGE_CONTAINER}>
        <EmptyState
          icon={<CinemaLogo compact />}
          title="Your personal cinema"
          description="Sign in to bring your watchlist, favourites and viewing journey together in one private space."
          action={<div className="flex flex-wrap justify-center gap-3"><a href="/sign-in" className={BUTTON_PRIMARY}>Sign in</a><a href="/sign-up" className={BUTTON_SECONDARY}>Create account</a></div>}
        />
      </div>
    );
  }

  return (
    <div className={`${PAGE_CONTAINER} cinema-my-cinema space-y-12 pb-12`}>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_85%_10%,rgba(205,218,210,.07),transparent_38%),linear-gradient(135deg,#121715,#090c0b_68%,#080a09)] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="absolute -right-10 -top-16 -z-10 h-64 w-64 rounded-full bg-white/[.035] blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-3"><span className="grid h-16 w-16 place-items-center rounded-[1.35rem] border border-white/15 bg-ink-950/70 shadow-xl shadow-black/30 ring-1 ring-cinema-300/20"><CinemaLogo compact /></span><a href="/profile" aria-label="View and edit your profile picture" title="View And Edit Your Profile"><ProfileAvatar name={profile?.display_name || profile?.username || user.email || "Cinema"} imageUrl={profile?.avatar_url} size="lg" /></a></div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cinema-200">Your personal entertainment space</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">My Cinema</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Your viewing journey, saved stories and favourites—kept together, ready whenever you are.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/friends" className={BUTTON_SECONDARY}><Users className="h-4 w-4" /> Friends</a>
            <a href="/watch-parties" className={BUTTON_SECONDARY}><PartyPopper className="h-4 w-4" /> Watch parties</a>
          </div>
        </div>
        {view && <div className="relative mt-7 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 sm:max-w-xl sm:gap-3">
          <div className="rounded-2xl bg-ink-950/45 p-3 sm:p-4"><div className="flex items-center gap-2 text-cinema-200"><Clock3 className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-wider sm:text-xs">In progress</span></div><p className="mt-2 text-2xl font-black text-white">{view.resume.length}</p></div>
          <div className="rounded-2xl bg-ink-950/45 p-3 sm:p-4"><div className="flex items-center gap-2 text-cinema-200"><BookmarkCheck className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-wider sm:text-xs">Watchlist</span></div><p className="mt-2 text-2xl font-black text-white">{view.watchlist.length}</p></div>
          <div className="rounded-2xl bg-ink-950/45 p-3 sm:p-4"><div className="flex items-center gap-2 text-cinema-200"><Heart className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-wider sm:text-xs">Favourites</span></div><p className="mt-2 text-2xl font-black text-white">{view.favourites.length}</p></div>
        </div>}
      </header>

      <a href="#my-downloads" className="group relative isolate flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_88%_10%,rgba(205,218,210,.07),transparent_38%),linear-gradient(115deg,#121715,#090c0b_62%,#111513)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:border-white/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <span className="pointer-events-none absolute -right-8 -top-12 -z-10 h-48 w-48 rounded-full bg-white/[.035] blur-3xl" />
        <span className="flex items-center gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-black/45 text-slate-200 shadow-[0_0_35px_rgba(40,120,220,.10)]"><Download className="h-7 w-7" /></span><span><span className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-300">Your Saved Videos</span><span className="mt-1 block text-xl font-extrabold text-white">Downloads</span><span className="mt-1 block text-xs text-slate-400">Open videos that publishers have approved for saving offline.</span></span></span>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/[.07] px-4 py-2.5 text-xs font-extrabold text-white transition group-hover:bg-sky-100/[.14] sm:self-center">View Downloads <ArrowRight className="h-4 w-4" /></span>
      </a>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Signed in as {user.email}</p>
        <div className="flex flex-wrap gap-2">
          {isAdmin && <a href="/admin" className={BUTTON_SECONDARY}><ShieldCheck className="h-4 w-4" /> Content manager</a>}
          <a href="/profile" className={BUTTON_SECONDARY}><Settings2 className="h-4 w-4" /> Profile & settings</a>
          <a href="/about" className={BUTTON_SECONDARY}><Info className="h-4 w-4" /> About & Credits</a>
          <button type="button" onClick={() => void signOut()} className={BUTTON_SECONDARY}><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="My Cinema shortcuts">
        <a href="#continue-watching" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-1 hover:border-sky-200/30"><History className="h-5 w-5 text-sky-200" /><span className="mt-4 block text-sm font-bold text-white">Continue Watching</span><span className="mt-1 block text-[11px] text-slate-500">Pick up where you paused</span></a>
        <a href="#my-watchlist" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-1 hover:border-sky-200/30"><BookmarkCheck className="h-5 w-5 text-sky-200" /><span className="mt-4 block text-sm font-bold text-white">Watchlist</span><span className="mt-1 block text-[11px] text-slate-500">Saved for later</span></a>
        <a href="#my-saved-shorts" className="group rounded-2xl border border-blue-300/25 bg-gradient-to-br from-blue-950/70 to-ink-950 p-4 transition hover:-translate-y-1 hover:border-blue-200/50"><BookmarkCheck className="h-5 w-5 text-blue-200" /><span className="mt-4 block text-sm font-bold text-white">Saved Shorts</span><span className="mt-1 block text-[11px] text-slate-400">Your Explore collection</span></a>
        <a href="#my-favourites" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-1 hover:border-sky-200/30"><Heart className="h-5 w-5 text-sky-200" /><span className="mt-4 block text-sm font-bold text-white">Favourites</span><span className="mt-1 block text-[11px] text-slate-500">Your top stories</span></a>
        <a href="/friends" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-1 hover:border-sky-200/30"><Users className="h-5 w-5 text-sky-200" /><span className="mt-4 block text-sm font-bold text-white">Friends</span><span className="mt-1 block text-[11px] text-slate-500">Your Cinema circle</span></a>
        <a href="/watch-parties" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-1 hover:border-sky-200/30"><PartyPopper className="h-5 w-5 text-sky-200" /><span className="mt-4 block text-sm font-bold text-white">Watch Parties</span><span className="mt-1 block text-[11px] text-slate-500">Experience together</span></a>
        <a href="/discover" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-1 hover:border-sky-200/30"><Compass className="h-5 w-5 text-sky-200" /><span className="mt-4 block text-sm font-bold text-white">Explore More</span><span className="mt-1 block text-[11px] text-slate-500">Find something new</span></a>
        <a href="/publishers" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-1 hover:border-sky-200/30"><Building2 className="h-5 w-5 text-sky-200" /><span className="mt-4 block text-sm font-bold text-white" >Track</span><span className="mt-1 block text-[11px] text-slate-500">Studios & publishers</span></a>
        <a href="#my-downloads" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:-translate-y-1 hover:border-sky-200/30"><Download className="h-5 w-5 text-sky-200" /><span className="mt-4 block text-sm font-bold text-white">Downloads</span><span className="mt-1 block text-[11px] text-slate-500">Permitted to save</span></a>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <a href="/live-tv" className="group relative isolate overflow-hidden rounded-3xl border border-sky-200/15 bg-[linear-gradient(120deg,#102137,#080d17)] p-5 transition hover:border-sky-200/35"><span className="absolute -right-4 -top-8 -z-10 h-36 w-36 rounded-full bg-sky-300/10 blur-2xl" /><Radio className="h-6 w-6 text-sky-200" /><h3 className="mt-4 text-lg font-extrabold text-white">Your Live Television</h3><p className="mt-1 text-sm text-slate-400">Jump into live channels and programming.</p></a>
        <a href="/movies" className="group relative isolate overflow-hidden rounded-3xl border border-indigo-200/15 bg-[linear-gradient(120deg,#1a1830,#080d17)] p-5 transition hover:border-indigo-200/35"><span className="absolute -right-4 -top-8 -z-10 h-36 w-36 rounded-full bg-indigo-300/10 blur-2xl" /><Film className="h-6 w-6 text-indigo-200" /><h3 className="mt-4 text-lg font-extrabold text-white">Build Your Next Watchlist</h3><p className="mt-1 text-sm text-slate-400">Find films and series worth saving for later.</p></a>
      </section>
      {view && <nav aria-label="My Cinema sections" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ href: '#continue-watching', label: 'Continue watching' }, { href: '#recently-watched', label: 'Recently watched' }, { href: '#my-watchlist', label: 'Watchlist' }, { href: '#my-saved-shorts', label: 'Saved Shorts' }, { href: '#my-favourites', label: 'Favourites' }, { href: '#my-downloads', label: 'Downloads' }, { href: '#my-publishers', label: 'Publishers' }].map((item) => <a key={item.href} href={item.href} className="shrink-0 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-cinema-300/40 hover:bg-cinema-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300">{item.label}</a>)}
      </nav>}
        <section id="my-downloads" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cinema-300">Available Offline</p><h2 className={SECTION_HEADING}>Downloads</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">Only individual videos that their rights holders have explicitly approved for download appear here. Full movies and series need separate download permission and are not downloadable unless Cinema displays that approval.</p></div>
            <button type="button" onClick={reloadDownloads} className={BUTTON_SECONDARY}><History className="h-4 w-4" /> Refresh</button>
          </div>
          {downloadsError && <ErrorState onRetry={reloadDownloads} description="Your permitted downloads could not be loaded right now." />}
          {!downloadsError && !downloadableClips && <LoadingState label="Checking permitted downloads" />}
          {!downloadsError && downloadableClips && downloadableClips.length === 0 && <div className={CARD + ' flex items-center gap-4'}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-200/15 bg-sky-300/[.06] text-sky-100"><Download className="h-5 w-5" /></span><div><p className="font-semibold text-white">No downloads available yet</p><p className="mt-1 text-xs leading-5 text-slate-500">When a publisher permits a video to be saved, it will appear here. Cinema does not enable downloads for every title.</p></div></div>}
          {downloadableClips && downloadableClips.length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {downloadableClips.map((clip) => <article key={clip.id} className={CARD + ' flex min-w-0 items-center gap-3 p-3'}>
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-800">{clip.poster_url && <img src={clip.poster_url} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold text-white">{clip.headline}</p><p className="mt-1 truncate text-xs text-slate-500">{clip.publisher_name || 'Cinema Publisher'} · Approved Download</p><button type="button" disabled={downloadingId === clip.id} onClick={async () => { setDownloadingId(clip.id); try { await downloadPermittedClip(clip); notify('Your download has started.'); } catch (error) { console.error('Cinema download failed', error); notify('This file could not be downloaded from its host. Please try again later.', 'error'); } finally { setDownloadingId(null); } }} className={BUTTON_PRIMARY + ' mt-2'}><Download className="h-4 w-4" /> {downloadingId === clip.id ? 'Preparing…' : 'Download'}</button></div>
            </article>)}
          </div>}
        </section>
        <SavedShortsShelf userId={user.id} />
      {!view && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}
      {view && <>
        <div id="continue-watching" className="scroll-mt-24"><ContinueWatchingRow items={view.resume} /></div>
        <section id="recently-watched" className="scroll-mt-24 space-y-5">
          <div className="flex items-end justify-between gap-4"><div><h2 className={SECTION_HEADING}>Recently Watched</h2><p className="mt-1 text-sm text-slate-400">Your latest viewing activity, all in one place.</p></div></div>
          {view.recent.length ? <TitleGrid titles={view.recent} /> : <p className={`${CARD} text-sm text-slate-400`}>Titles you watch will appear here, so you can easily return to your recent viewing.</p>}
        </section>
        <section id="my-watchlist" className="scroll-mt-24 space-y-5">
          <div className="flex items-end justify-between gap-4"><div><h2 className={SECTION_HEADING}>Your watchlist</h2><p className="mt-1 text-sm text-slate-400">Stories you want to come back to.</p></div><a href="/search" className="text-sm font-semibold text-cinema-300 hover:text-white">Find more</a></div>
          {!ready ? <LoadingState label="Loading your list" /> : view.watchlist.length === 0 ? <p className={`${CARD} text-sm text-slate-400`}>Titles you add with the watchlist button will appear here. Browse Cinema to start building your list.</p> : <TitleGrid titles={view.watchlist} />}
        </section>
        <section id="my-favourites" className="scroll-mt-24 space-y-5">
          <div><h2 className={SECTION_HEADING}>Your favourites</h2><p className="mt-1 text-sm text-slate-400">The stories that stay with you.</p></div>
          {!ready ? <LoadingState label="Loading your favourites" /> : view.favourites.length === 0 ? <p className={`${CARD} text-sm text-slate-400`}>Mark titles as favourites to keep the ones you love within reach.</p> : <TitleGrid titles={view.favourites} />}
        </section>
        <section id="my-publishers" className="scroll-mt-24 space-y-5">
          <div className="flex items-end justify-between gap-4"><div><h2 className={SECTION_HEADING}>Your publishers</h2><p className="mt-1 text-sm text-slate-400">Studios and broadcasters you choose to track.</p></div><a href="/publishers" className="text-sm font-semibold text-cinema-300 hover:text-white">Discover publishers</a></div>
          {(followedPublishers ?? []).length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(followedPublishers ?? []).map((publisher) => <a key={publisher} href={`/publishers/${encodeURIComponent(publisher)}`} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/70 p-4 transition hover:border-sky-200/25 hover:bg-ink-850"><span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-200/15 bg-sky-200/[.07] text-sky-100"><Building2 className="h-5 w-5" /></span><span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{publisher}</span><span className="text-xs font-semibold text-sky-200 transition group-hover:text-white" >Tracking</span></a>)}</div> : <p className={`${CARD} text-sm text-slate-400`}>Publishers you track will appear here. Visit publisher destinations to track their official titles and updates.</p>}
        </section>
        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-ink-850 to-ink-900 p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cinema-300">Keep exploring</p><h2 className="mt-1 text-lg font-extrabold text-white">There is more to experience.</h2><p className="mt-1 text-sm text-slate-400">Discover a new story, share it with friends or plan a watch party.</p></div><div className="flex flex-wrap gap-2"><a href="/discover" className={BUTTON_SECONDARY}><MessageSquareText className="h-4 w-4" /> Discover</a><a href="/watch-parties" className={BUTTON_PRIMARY}><PartyPopper className="h-4 w-4" /> Watch together</a></div></div></section>
      </>}
    </div>
  );
}
