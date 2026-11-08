import { useState, type FormEvent } from 'react';
import { FileCheck2, Film, Plus, Send } from 'lucide-react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT } from '@/components/ui/styles';
import { fetchMyStudioTitleSubmissions, submitStudioTitle, type StudioContentType, type StudioRightsBasis } from '@/lib/studio-content';
import type { StudioAccount } from '@/lib/studios';

const STATUS_STYLES = {
  pending: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  changes_requested: 'border-sky-200/20 bg-sky-200/10 text-sky-100',
  approved: 'border-[#a8cbb6]/20 bg-[#a8cbb6]/10 text-[#c7ddcf]',
  rejected: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
};

function splitList(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

export function StudioTitleSubmissionDesk({ studio, userId }: { studio: StudioAccount; userId: string }) {
  const { notify } = useToast();
  const submissions = useAsyncData(() => fetchMyStudioTitleSubmissions(studio.id), [studio.id]);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [contentType, setContentType] = useState<StudioContentType>('movie');
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [runtime, setRuntime] = useState('');
  const [poster, setPoster] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [trailer, setTrailer] = useState('');
  const [playback, setPlayback] = useState('');
  const [rightsHolder, setRightsHolder] = useState(studio.studio_name);
  const [rightsBasis, setRightsBasis] = useState<StudioRightsBasis>('owned');
  const [territories, setTerritories] = useState('Ghana, Nigeria');
  const [languages, setLanguages] = useState('English');
  const [platforms, setPlatforms] = useState('Web, Mobile, Smart TV');
  const [rightsStart, setRightsStart] = useState('');
  const [rightsEnd, setRightsEnd] = useState('');
  const [exclusive, setExclusive] = useState(false);
  const [promoRights, setPromoRights] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedYear = year.trim() ? Number(year) : null;
    const parsedRuntime = runtime.trim() ? Number(runtime) : null;
    const territoryList = splitList(territories);
    const languageList = splitList(languages);
    const platformList = splitList(platforms);
    if (!Number.isInteger(parsedYear) && parsedYear !== null) { notify('Enter a valid release year.', 'error'); return; }
    if (!Number.isInteger(parsedRuntime) && parsedRuntime !== null) { notify('Enter the runtime in whole minutes.', 'error'); return; }
    if (!territoryList.length || !languageList.length || !platformList.length) { notify('Add at least one territory, language and Cinema platform.', 'error'); return; }
    if (rightsStart && rightsEnd && rightsEnd < rightsStart) { notify('The rights end date must be after the start date.', 'error'); return; }
    const secureUrl = (value: string) => !value.trim() || value.trim().startsWith('https://');
    if (![poster, backdrop, trailer, playback, evidence].every(secureUrl)) { notify('Content and evidence links must use HTTPS.', 'error'); return; }
    setBusy(true);
    try {
      await submitStudioTitle({
        studio_id: studio.id,
        submitted_by: userId,
        content_type: contentType,
        title: title.trim(),
        synopsis: synopsis.trim(),
        genre: genre.trim(),
        release_year: parsedYear,
        duration_minutes: parsedRuntime,
        poster_url: poster.trim(),
        backdrop_url: backdrop.trim() || null,
        trailer_url: trailer.trim() || null,
        playback_url: playback.trim() || null,
        rights_holder: rightsHolder.trim(),
        rights_basis: rightsBasis,
        territories: territoryList,
        languages: languageList,
        platforms: platformList,
        rights_start: rightsStart || null,
        rights_end: rightsEnd || null,
        is_exclusive: exclusive,
        promotional_rights_confirmed: promoRights,
        rights_evidence_url: evidence.trim() || null,
        delivery_notes: deliveryNotes.trim(),
      });
      notify('Your title package has been sent to Cinema for rights and content review.');
      setTitle(''); setSynopsis(''); setGenre(''); setYear(''); setRuntime('');
      setPoster(''); setBackdrop(''); setTrailer(''); setPlayback(''); setEvidence(''); setDeliveryNotes('');
      setExclusive(false); setPromoRights(false); setRightsStart(''); setRightsEnd('');
      setExpanded(false);
      submissions.reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Cinema could not receive this title submission. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#a8cbb6]/15 bg-[linear-gradient(135deg,#202a24,#141a16)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#b9d2c2]">Distribution Desk</p><h3 className="mt-1 text-lg font-extrabold text-white">Full Title Submissions</h3><p className="mt-1 text-xs text-slate-400">Submit films, series, programmes and live content for Cinema review.</p></div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className={BUTTON_SECONDARY}>{expanded ? 'Close Form' : <><Plus className="h-4 w-4" /> Submit A Title</>}</button>
      </div>
      {expanded && <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-start gap-3"><Film className="mt-1 h-5 w-5 shrink-0 text-[#b9d2c2]" /><div><h4 className="font-bold text-white">Content Package</h4><p className="mt-1 text-xs leading-5 text-slate-400">Provide the title information and secure media links. A submission stays private while Cinema reviews it.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-semibold text-slate-200">Content Type<select className={INPUT} value={contentType} onChange={(event) => setContentType(event.target.value as StudioContentType)}><option value="movie">Movie</option><option value="series">Series</option><option value="sport">Sports Programme</option><option value="news">News Programme</option><option value="live">Live TV / Event</option></select></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-200">Title Name<input required maxLength={180} className={INPUT} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Official title" /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-200 sm:col-span-2">Synopsis<textarea required minLength={20} maxLength={5000} rows={4} className={INPUT} value={synopsis} onChange={(event) => setSynopsis(event.target.value)} placeholder="What is this film, series or programme about?" /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-200">Genre / Category<input className={INPUT} maxLength={160} value={genre} onChange={(event) => setGenre(event.target.value)} placeholder="Drama, Comedy..." /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-200">Release Year<input className={INPUT} inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} placeholder="2026" /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-200">Runtime In Minutes<input className={INPUT} inputMode="numeric" value={runtime} onChange={(event) => setRuntime(event.target.value)} placeholder="Optional" /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-200">Poster Image URL<input required type="url" className={INPUT} value={poster} onChange={(event) => setPoster(event.target.value)} placeholder="https://..." /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-200">Backdrop Image URL<input type="url" className={INPUT} value={backdrop} onChange={(event) => setBackdrop(event.target.value)} placeholder="https://..." /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-200">Trailer URL<input type="url" className={INPUT} value={trailer} onChange={(event) => setTrailer(event.target.value)} placeholder="https://..." /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-200">Playback / Delivery URL<input type="url" className={INPUT} value={playback} onChange={(event) => setPlayback(event.target.value)} placeholder="https://... (optional at submission)" /></label>
          <p className="sm:col-span-2 text-[11px] leading-5 text-slate-500">Use a secure source you are authorised to provide. If the final video master is not ready, leave the playback field empty and explain delivery arrangements below. Cinema will not publish an unreviewed source.</p>
        </div>
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-[#b9d2c2]" /><h4 className="font-bold text-white">Rights & Distribution Declaration</h4></div>
          <label className="block space-y-1.5 text-xs font-semibold text-slate-200">Rights Holder<input required maxLength={180} className={INPUT} value={rightsHolder} onChange={(event) => setRightsHolder(event.target.value)} /></label>
          <label className="block space-y-1.5 text-xs font-semibold text-slate-200">Your Authority To Distribute<select className={INPUT} value={rightsBasis} onChange={(event) => setRightsBasis(event.target.value as StudioRightsBasis)}><option value="owned">We Own The Rights</option><option value="exclusive_license">Exclusive Licence</option><option value="non_exclusive_license">Non-Exclusive Licence</option><option value="distribution_agreement">Distribution Agreement</option><option value="commissioned">Commissioned / Produced For Us</option><option value="other_authorised">Other Written Authorisation</option></select></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-slate-200">Territories <span className="font-normal text-slate-500">(comma separated)</span><input required className={INPUT} value={territories} onChange={(event) => setTerritories(event.target.value)} placeholder="Ghana, Nigeria, Worldwide" /></label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-200">Languages <span className="font-normal text-slate-500">(comma separated)</span><input required className={INPUT} value={languages} onChange={(event) => setLanguages(event.target.value)} placeholder="English, Twi, Yoruba" /></label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-200 sm:col-span-2">Permitted Cinema Platforms <span className="font-normal text-slate-500">(comma separated)</span><input required className={INPUT} value={platforms} onChange={(event) => setPlatforms(event.target.value)} placeholder="Web, Mobile, Smart TV" /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-slate-200">Rights Start Date<input type="date" className={INPUT} value={rightsStart} onChange={(event) => setRightsStart(event.target.value)} /></label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-200">Rights End Date<input type="date" className={INPUT} value={rightsEnd} onChange={(event) => setRightsEnd(event.target.value)} /></label>
          </div>
          <label className="flex items-start gap-3 text-xs leading-5 text-slate-300"><input type="checkbox" checked={exclusive} onChange={(event) => setExclusive(event.target.checked)} className="mt-1 accent-cinema-500" /><span>This distribution permission is exclusive within the territories and dates I have listed.</span></label>
          <label className="flex items-start gap-3 text-xs leading-5 text-slate-300"><input type="checkbox" checked={promoRights} onChange={(event) => setPromoRights(event.target.checked)} className="mt-1 accent-cinema-500" /><span>We have permission to provide Cinema with promotional materials and excerpts for the submitted title.</span></label>
          <label className="block space-y-1.5 text-xs font-semibold text-slate-200">Rights Evidence URL <span className="font-normal text-slate-500">(optional secure link for Cinema reviewers)</span><input type="url" className={INPUT} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="https://..." /></label>
          <label className="block space-y-1.5 text-xs font-semibold text-slate-200">Delivery Notes <textarea rows={3} maxLength={2000} className={INPUT} value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} placeholder="Master file status, captions, audio formats, episode package, delivery contact..." /></label>
          <p className="rounded-xl border border-amber-200/15 bg-amber-200/[.04] p-3 text-xs leading-5 text-amber-100/80">Submitting information is a request for review, not a distribution contract or a guarantee of acceptance. Cinema checks rights, technical readiness and content suitability separately before any title is published.</p>
          <label className="flex items-start gap-3 text-xs leading-5 text-slate-300"><input type="checkbox" required className="mt-1 accent-cinema-500" /><span>I confirm that the information is accurate and that this organisation is authorised to submit this title for Cinema's review. Any final distribution agreement will be handled separately by the appropriate authorised representatives.</span></label>
        </div>
        <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setExpanded(false)} className={BUTTON_SECONDARY}>Cancel</button><button type="submit" disabled={busy} className={BUTTON_PRIMARY}><Send className="h-4 w-4" /> {busy ? 'Sending For Review...' : 'Submit To Cinema'}</button></div>
      </form>}
      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-white">Your Title Pipeline</h4><button type="button" onClick={submissions.reload} className="text-xs font-bold text-[#c7ddcf]">Refresh</button></div>
        {submissions.loading && !submissions.data ? <p className="mt-3 text-xs text-slate-400">Loading your title submissions…</p> : submissions.error ? <button type="button" onClick={submissions.reload} className="mt-3 text-xs font-bold text-[#c7ddcf]">Retry Loading</button> : submissions.data?.length ? <ul className="mt-3 space-y-2">{submissions.data.map((item) => <li key={item.id} className="rounded-xl border border-white/10 bg-black/15 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-white">{item.title}</p><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[item.status]}`}>{item.status.replace('_', ' ')}</span></div><p className="mt-1 text-[11px] text-slate-500">{item.content_type.toUpperCase()} · Submitted {new Date(item.created_at).toLocaleDateString()}</p>{item.review_note && <p className="mt-2 text-xs text-slate-300">Cinema Review: {item.review_note}</p>}</li>)}</ul> : <p className="mt-3 rounded-xl border border-dashed border-white/10 p-4 text-xs text-slate-400">No full-title submissions yet. Start with a film, series or programme package.</p>}
      </div>
    </section>
  );
}
