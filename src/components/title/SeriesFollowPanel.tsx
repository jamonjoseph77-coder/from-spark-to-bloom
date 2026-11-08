import { useState } from 'react';
import { BellRing, CalendarDays, Check, LoaderCircle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/ui/styles';
import { navigateTo } from '@/lib/router';
import { fetchPublicSeriesEpisodes, followSeries, isFollowingSeries, unfollowSeries } from '@/lib/seriesFollows';

export function SeriesFollowPanel({ titleId, title }: { titleId: string; title: string }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const { data: following, error: followError, reload: reloadFollow } = useAsyncData(
    () => user ? isFollowingSeries(user.id, titleId) : Promise.resolve(false),
    [user?.id, titleId],
  );
  const { data: episodes, error: scheduleError, reload: reloadSchedule } = useAsyncData(
    () => fetchPublicSeriesEpisodes(titleId),
    [titleId],
  );

  async function toggleFollow() {
    if (!user) {
      notify('Sign in to follow this series and receive Cinema updates.', 'error');
      navigateTo('/sign-in');
      return;
    }
    setBusy(true);
    try {
      if (following) {
        await unfollowSeries(user.id, titleId);
        notify(`You are no longer following ${title}.`);
      } else {
        await followSeries(user.id, titleId);
        notify(`You are now following ${title}. New episode schedules will appear in your notifications.`);
      }
      reloadFollow();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Cinema could not update your series follow.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const upcoming = (episodes ?? []).filter((episode) => episode.release_at && new Date(episode.release_at).getTime() >= Date.now());
  const released = (episodes ?? []).filter((episode) => episode.release_at && new Date(episode.release_at).getTime() < Date.now());

  return <section className="cinema-series-follow-panel relative isolate overflow-hidden rounded-[1.65rem] border border-sky-200/15 p-4 shadow-[0_18px_48px_rgba(0,0,0,.2)] sm:p-5">
    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full border border-sky-100/10 bg-sky-300/[.035] blur-[1px]" />
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sky-100/15 bg-sky-200/10 text-sky-100"><BellRing className="h-5 w-5" /></span>
        <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-100/75">Stay With The Story</p><h2 className="mt-1 text-lg font-extrabold text-white">Follow {title}</h2><p className="mt-1 max-w-xl text-xs leading-5 text-slate-300">Keep the series close. Cinema will let you know when its publisher adds or changes an episode schedule.</p></div>
      </div>
      <button type="button" disabled={busy || Boolean(followError)} onClick={() => void toggleFollow()} className={following ? BUTTON_SECONDARY : BUTTON_PRIMARY}>
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : following ? <Check className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
        {following ? 'Following' : 'Follow Series'}
      </button>
    </div>
    {followError && <p role="alert" className="mt-3 text-xs text-rose-200">Your follow status could not be checked. <button type="button" onClick={reloadFollow} className="underline">Try again</button></p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/[.045] p-3"><p className="flex items-center gap-2 text-xs font-bold text-white"><CalendarDays className="h-4 w-4 text-sky-200" /> Upcoming Episodes</p><p className="mt-2 text-2xl font-black text-white tabular-nums">{upcoming.length}</p><p className="mt-1 text-[11px] text-slate-400">Scheduled for release</p></div>
      <div className="rounded-xl border border-white/10 bg-white/[.045] p-3"><p className="flex items-center gap-2 text-xs font-bold text-white"><Users className="h-4 w-4 text-violet-200" /> Story Updates</p><p className="mt-2 text-sm font-bold text-white">{following ? 'Updates Enabled' : 'Follow To Stay Updated'}</p><p className="mt-1 text-[11px] text-slate-400">New schedules and date changes</p></div>
    </div>
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-white">Release Calendar</h3><button type="button" onClick={reloadSchedule} className="text-xs font-semibold text-sky-100 hover:text-white">Refresh</button></div>
      {scheduleError ? <p className="mt-3 text-xs text-rose-200">The release calendar could not load. <button type="button" onClick={reloadSchedule} className="underline">Try again</button></p> : !episodes ? <p className="mt-3 text-xs text-slate-400">Loading the series calendar…</p> : episodes.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[.025] p-3 text-xs leading-5 text-slate-400">The publisher has not connected a public episode schedule yet. Follow the series to keep its updates close.</p> : <ol className="mt-3 space-y-2">{episodes.map((episode) => <li key={episode.id} className="flex items-center gap-3 rounded-xl border border-white/[.08] bg-black/15 p-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-sky-200/10 bg-sky-200/[.08] text-[10px] font-extrabold text-sky-100">{episode.release_at ? new Date(episode.release_at).toLocaleDateString(undefined,{month:'short',day:'numeric'}) : 'TBA'}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-white">S{episode.season_number} · E{episode.episode_number} — {episode.episode_title}</span><span className="mt-1 block text-[10px] text-slate-400">{episode.release_at ? new Date(episode.release_at).toLocaleString() : 'Release date to be announced'}</span></span><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${episode.release_at && new Date(episode.release_at).getTime() < Date.now() ? 'bg-emerald-300/10 text-emerald-100' : 'bg-sky-300/10 text-sky-100'}`}>{episode.release_at && new Date(episode.release_at).getTime() < Date.now() ? 'Released' : episode.delivery_status === 'ready' || episode.delivery_status === 'delivered' ? 'Ready' : 'Upcoming'}</span></li>)}</ol>}
      {episodes && released.length > 0 && <p className="mt-3 text-[10px] text-slate-500">{released.length} episode(s) already past their scheduled release date.</p>}
    </div>
  </section>;
}
