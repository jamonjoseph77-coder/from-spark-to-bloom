import { useMemo } from 'react';
import { Clapperboard, LogOut, ShieldCheck, Users, PartyPopper, MessageSquareText, Settings2 } from 'lucide-react';
import { ContinueWatchingRow } from '@/components/catalogue/ContinueWatchingRow';
import { TitleGrid } from '@/components/catalogue/TitleGrid';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, PAGE_CONTAINER, SECTION_HEADING } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { resumeItems } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';

export function MyCinemaPage() {
 const { user, isAdmin, loading: authLoading, signOut } = useAuth();
 const { watchlistIds, favouriteIds, progress, ready } = useLibrary();
 const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
 const view = useMemo(() => {
  if (!titles) return null;
  return { resume: resumeItems(progress, titles), watchlist: titles.filter((title) => watchlistIds.has(title.id)), favourites: titles.filter((title) => favouriteIds.has(title.id)) };
 }, [titles, progress, watchlistIds, favouriteIds]);
 if (authLoading) return <div className={PAGE_CONTAINER}><LoadingState /></div>;
 if (!user) return <div className={PAGE_CONTAINER}><EmptyState icon={<Clapperboard className="h-7 w-7 text-cinema-300" />} title="Your personal cinema" description="Sign in to see your watchlist, favourites and the titles you are part way through." action={<div className="flex flex-wrap justify-center gap-3"><a href="/sign-in" className={BUTTON_PRIMARY}>Sign in</a><a href="/sign-up" className={BUTTON_SECONDARY}>Create account</a></div>} /></div>;
 return (
  <div className={`${PAGE_CONTAINER} space-y-12 pb-12`}>
   <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/15 bg-gradient-to-br from-cinema-700/25 via-ink-900 to-ink-950 p-6 sm:p-8">
    <div className="absolute -right-10 -top-16 -z-10 h-56 w-56 rounded-full bg-cinema-400/10 blur-3xl" />
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
     <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-cinema-300/25 bg-cinema-400/15 text-cinema-100 shadow-xl shadow-cinema-950/30"><Clapperboard className="h-8 w-8" /></span>
     <div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[0.22em] text-cinema-200">Your personal entertainment space</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">My Cinema</h1><p className="mt-2 text-sm text-slate-300">Your watchlist, favourites and viewing journey, together in one place.</p></div>
     <div className="flex flex-wrap gap-2"><a href="/letterbox" className={BUTTON_SECONDARY}><MessageSquareText className="h-4 w-4" /> Letterbox</a><a href="/friends" className={BUTTON_SECONDARY}><Users className="h-4 w-4" /> Friends</a><a href="/watch-parties" className={BUTTON_SECONDARY}><PartyPopper className="h-4 w-4" /> Parties</a></div>
    </div>
   </header>
   <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-400">Signed in as {user.email}</p><div className="flex flex-wrap gap-2">{isAdmin && <a href="/admin" className={BUTTON_SECONDARY}><ShieldCheck className="h-4 w-4" /> Content manager</a>}<a href="/profile" className={BUTTON_SECONDARY}><Settings2 className="h-4 w-4" /> Profile & settings</a><button type="button" onClick={() => void signOut()} className={BUTTON_SECONDARY}><LogOut className="h-4 w-4" /> Sign out</button></div></div>
   {!view && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}
   {view && <><ContinueWatchingRow items={view.resume} /><section className="space-y-5"><h2 className={SECTION_HEADING}>Watchlist</h2>{!ready ? <LoadingState label="Loading your list" /> : view.watchlist.length === 0 ? <p className={`${CARD} text-sm text-slate-400`}>Titles you add with the watchlist button will appear here. Browse the catalogue to start building your list.</p> : <TitleGrid titles={view.watchlist} />}</section><section className="space-y-5"><h2 className={SECTION_HEADING}>Favourites</h2>{!ready ? <LoadingState label="Loading your favourites" /> : view.favourites.length === 0 ? <p className={`${CARD} text-sm text-slate-400`}>Mark titles as favourites to keep the ones you love within reach.</p> : <TitleGrid titles={view.favourites} />}</section></>}
  </div>
 );
}
