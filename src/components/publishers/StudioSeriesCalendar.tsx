import { useMemo, useState } from 'react';
import { CalendarDays, Plus, Upload } from 'lucide-react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT } from '@/components/ui/styles';
import { addStudioSeriesEpisodes, fetchStudioSeriesEpisodes, type StudioSeriesEpisodeInput } from '@/lib/studio-content';

function parseBulkEpisodes(submissionId: string, source: string): StudioSeriesEpisodeInput[] {
  return source.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [code, title, release, playback] = line.split('|').map((part) => part.trim());
    const match = code?.match(/^S(\d+)E(\d+)$/i);
    if (!match || !title) throw new Error(`Invalid episode line: ${line}. Use S1E1 | Episode Title | optional date | optional HTTPS playback URL.`);
    const releaseAt = release ? new Date(release) : null;
    if (release && (!releaseAt || Number.isNaN(releaseAt.getTime()))) throw new Error(`Invalid release date for ${code}.`);
    return {
      submission_id: submissionId,
      season_number: Number(match[1]),
      episode_number: Number(match[2]),
      episode_title: title,
      release_at: releaseAt?.toISOString() ?? null,
      playback_url: playback || null,
      delivery_status: playback ? 'ready' : 'planned',
    };
  });
}

export function StudioSeriesCalendar({ submissionId }: { submissionId: string }) {
  const { notify } = useToast();
  const schedule = useAsyncData(() => fetchStudioSeriesEpisodes(submissionId), [submissionId]);
  const [bulkText, setBulkText] = useState('');
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [release, setRelease] = useState('');
  const [playback, setPlayback] = useState('');
  const [busy, setBusy] = useState(false);
  const upcoming = useMemo(() => (schedule.data ?? []).filter((item) => item.release_at).sort((a, b) => (a.release_at ?? '').localeCompare(b.release_at ?? '')), [schedule.data]);

  async function save(items: StudioSeriesEpisodeInput[]) {
    setBusy(true);
    try {
      await addStudioSeriesEpisodes(items);
      notify(`${items.length} episode schedule ${items.length === 1 ? 'entry' : 'entries'} saved.`);
      schedule.reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Cinema could not save this episode schedule.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return <section className="mt-4 rounded-2xl border border-sky-300/15 bg-[linear-gradient(135deg,rgba(31,48,68,.72),rgba(20,24,36,.88))] p-4">
    <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-200/15 bg-sky-300/10 text-sky-200"><CalendarDays className="h-5 w-5" /></span><div><h4 className="font-bold text-white">Series Release Calendar</h4><p className="mt-1 text-xs leading-5 text-slate-400">Add episodes one at a time or paste a whole season. Update the schedule as release dates are confirmed.</p></div></div>
    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const s = Number(season); const e = Number(episode); if (!Number.isInteger(s) || s < 1 || !Number.isInteger(e) || e < 1) { notify('Season and episode numbers must be positive whole numbers.', 'error'); return; } void save([{ submission_id: submissionId, season_number: s, episode_number: e, episode_title: episodeTitle, release_at: release ? new Date(release).toISOString() : null, playback_url: playback || null, delivery_status: playback ? 'ready' : 'planned' }]); setEpisodeTitle(''); setPlayback(''); }}>
      <label className="space-y-1 text-xs font-semibold text-slate-300">Season<input className={INPUT} inputMode="numeric" value={season} onChange={(event) => setSeason(event.target.value)} /></label>
      <label className="space-y-1 text-xs font-semibold text-slate-300">Episode Number<input className={INPUT} inputMode="numeric" value={episode} onChange={(event) => setEpisode(event.target.value)} /></label>
      <label className="space-y-1 text-xs font-semibold text-slate-300 sm:col-span-2">Episode Title<input required maxLength={180} className={INPUT} value={episodeTitle} onChange={(event) => setEpisodeTitle(event.target.value)} placeholder="Episode title" /></label>
      <label className="space-y-1 text-xs font-semibold text-slate-300">Planned Release<input type="datetime-local" className={INPUT} value={release} onChange={(event) => setRelease(event.target.value)} /></label>
      <label className="space-y-1 text-xs font-semibold text-slate-300">Playback URL (Optional)<input type="url" className={INPUT} value={playback} onChange={(event) => setPlayback(event.target.value)} placeholder="https://..." /></label>
      <div className="sm:col-span-2 flex justify-end"><button disabled={busy} className={BUTTON_PRIMARY}><Plus className="h-4 w-4" /> Add Episode</button></div>
    </form>
    <div className="mt-4 border-t border-white/10 pt-4"><label className="block space-y-2 text-xs font-semibold text-slate-300">Bulk Episode Schedule <span className="font-normal text-slate-500">One episode per line: S1E1 | Title | 2026-12-01T18:00 | https://playback-url</span><textarea rows={4} className={INPUT} value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder={'S1E1 | The Beginning | 2026-12-01T18:00\nS1E2 | A New Chapter | 2026-12-08T18:00'} /></label><div className="mt-2 flex justify-end"><button type="button" disabled={busy || !bulkText.trim()} onClick={() => { try { const parsed = parseBulkEpisodes(submissionId, bulkText); void save(parsed); setBulkText(''); } catch (error) { notify(error instanceof Error ? error.message : 'Check the bulk schedule format.', 'error'); } }} className={BUTTON_SECONDARY}><Upload className="h-4 w-4" /> Save Bulk Schedule</button></div></div>
    <div className="mt-4 border-t border-white/10 pt-4"><div className="flex items-center justify-between"><p className="text-sm font-bold text-white">Release Timeline</p><button type="button" onClick={schedule.reload} className="text-xs font-semibold text-sky-200">Refresh</button></div>
      {schedule.loading && !schedule.data ? <p className="mt-3 text-xs text-slate-400">Loading episode schedule…</p> : schedule.error ? <p className="mt-3 text-xs text-rose-200">Could not load the schedule. <button type="button" onClick={schedule.reload} className="underline">Retry</button></p> : upcoming.length ? <ol className="mt-3 space-y-2">{upcoming.map((item) => <li key={item.id} className="flex gap-3 rounded-xl border border-white/10 bg-black/15 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-300/10 text-xs font-black text-sky-100">{new Date(item.release_at!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><span className="min-w-0"><span className="block text-xs font-bold text-white">S{item.season_number} · E{item.episode_number} — {item.episode_title}</span><span className="mt-1 block text-[11px] text-slate-400">{new Date(item.release_at!).toLocaleString()} · {item.delivery_status}</span></span></li>)}</ol> : <p className="mt-3 rounded-xl border border-dashed border-white/10 p-3 text-xs text-slate-400">No dated episodes yet. Add a release date to start the calendar.</p>}
      {schedule.data && schedule.data.some((item) => !item.release_at) && <p className="mt-2 text-[11px] text-slate-500">{schedule.data.filter((item) => !item.release_at).length} episode(s) are saved without a release date.</p>}
    </div>
  </section>;
}
