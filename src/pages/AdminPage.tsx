import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Star, Trash2, BadgeCheck, Building2, ShieldCheck, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAsyncData } from '@/hooks/useAsyncData';
import { AdminGate } from '@/components/admin/AdminGate';
import { TitleForm } from '@/components/admin/TitleForm';
import { SeasonManager } from '@/components/admin/SeasonManager';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, PAGE_CONTAINER } from '@/components/ui/styles';
import { deleteTitle, fetchAllTitles, fetchTitleDetail, setTitleFlags } from '@/lib/library';
import { navigateTo } from '@/lib/router';
import { TITLE_TYPE_LABELS, type Title } from '@/lib/types';
import { fetchStudioApplications, setStudioVerificationStatus } from '@/lib/studios';
import { fetchStudioTitleSubmissionsForReview, reviewStudioTitleSubmission, type StudioTitleSubmission } from '@/lib/studio-content';

function AdminPageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <a href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Content manager
        </a>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">{title}</h1>
      </div>
      {action}
    </header>
  );
}


function StudioVerificationQueue() {
  const { notify } = useToast();
  const { data: applications, error, reload } = useAsyncData(fetchStudioApplications, []);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function review(studioId: string, status: 'verified' | 'rejected' | 'suspended') {
    setBusyId(studioId);
    try {
      await setStudioVerificationStatus(studioId, status);
      notify(status === 'verified' ? 'Studio verified. Its official badge is now active.' : `Studio application marked ${status}.`);
      reload();
    } catch {
      notify('The studio verification decision could not be saved. Check the database migration and administrator permissions.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-cinema-400/15 bg-gradient-to-br from-cinema-700/10 via-ink-900 to-ink-950 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cinema-300"><ShieldCheck className="h-4 w-4" /> Official identity review</p><h2 className="mt-2 text-xl font-extrabold text-white">Studio verification</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">Review studio and broadcaster identity applications. Only approved accounts receive the verified Cinema badge.</p></div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">{applications?.filter((item) => item.verification_status === 'pending').length ?? 0} pending</span>
      </div>
      {!applications && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}
      {applications && applications.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">No studio verification applications have been submitted.</p>}
      {applications && applications.length > 0 && <ul className="space-y-3">
        {applications.map((studio) => (
          <li key={studio.id} className="rounded-2xl border border-white/10 bg-ink-950/60 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cinema-300/15 bg-cinema-500/10 text-cinema-200"><Building2 className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">{studio.studio_name}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${studio.verification_status === 'verified' ? 'bg-sky-400/10 text-slate-200' : studio.verification_status === 'pending' ? 'bg-amber-300/10 text-amber-200' : 'bg-slate-700/60 text-slate-300'}`}>{studio.verification_status}</span></div>
                {studio.description && <p className="mt-2 text-sm leading-6 text-slate-300">{studio.description}</p>}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>Owner: {studio.owner_id}</span>{studio.website_url && <a href={studio.website_url} target="_blank" rel="noreferrer" className="text-cinema-300 hover:text-white">Official website</a>}{studio.created_at && <span>Applied {new Date(studio.created_at).toLocaleDateString()}</span>}</div>
              </div>
              {studio.verification_status === 'pending' && <div className="flex flex-wrap gap-2 sm:justify-end">
                <button type="button" disabled={busyId === studio.id} onClick={() => void review(studio.id, 'verified')} className={BUTTON_PRIMARY}><BadgeCheck className="h-4 w-4" /> Verify</button>
                <button type="button" disabled={busyId === studio.id} onClick={() => void review(studio.id, 'rejected')} className={BUTTON_GHOST}><XCircle className="h-4 w-4" /> Reject</button>
              </div>}
              {studio.verification_status === 'verified' && <button type="button" disabled={busyId === studio.id} onClick={() => void review(studio.id, 'suspended')} className={BUTTON_GHOST}>Suspend badge</button>}
            </div>
          </li>
        ))}
      </ul>}
    </section>
  );
}

function StudioTitleReviewQueue() {
  const { notify } = useToast();
  const { data: submissions, error, reload } = useAsyncData(fetchStudioTitleSubmissionsForReview, []);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function review(item: StudioTitleSubmission, status: 'changes_requested' | 'approved' | 'rejected') {
    const promptText = status === 'approved'
      ? 'Optional Cinema review note for this approval:'
      : status === 'rejected'
        ? 'Explain why Cinema cannot accept this submission:'
        : 'What changes or information does the studio need to provide?';
    const note = window.prompt(promptText, item.review_note ?? '');
    if (note === null) return;
    if (status !== 'approved' && !note.trim()) {
      notify('Add a review note before requesting changes or rejecting a title.', 'error');
      return;
    }
    setBusyId(item.id);
    try {
      await reviewStudioTitleSubmission(item.id, status, note);
      notify(status === 'approved' ? 'Submission approved for distribution preparation. It is not published yet.' : status === 'rejected' ? 'Submission rejected with feedback.' : 'Changes requested from the studio.');
      reload();
    } catch {
      notify('The title review could not be saved. Check administrator access and the database migration.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-[#a8cbb6]/15 bg-[linear-gradient(135deg,#202a24,#141a16)] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#b9d2c2]">Distribution Review</p><h2 className="mt-2 text-xl font-extrabold text-white">Studio Title Submissions</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">Review content packages, rights declarations, territories and delivery readiness before preparing a Cinema catalogue title.</p></div><span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100">{submissions?.filter((item) => item.status === 'pending').length ?? 0} awaiting review</span></div>
      {!submissions && (error ? <ErrorState onRetry={reload} /> : <LoadingState label="Loading title submissions" />)}
      {submissions && submissions.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">No full-title distribution submissions yet.</p>}
      {submissions && submissions.length > 0 && <ul className="space-y-3">{submissions.map((item) => <li key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-lg font-extrabold text-white">{item.title}</h3><p className="mt-1 text-xs text-slate-400">{item.content_type.toUpperCase()} · Submitted {new Date(item.created_at).toLocaleDateString()} · Studio ID {item.studio_id.slice(0, 8)}</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${item.status === 'approved' ? 'border-[#a8cbb6]/20 bg-[#a8cbb6]/10 text-[#c7ddcf]' : item.status === 'pending' ? 'border-amber-200/20 bg-amber-200/10 text-amber-100' : item.status === 'changes_requested' ? 'border-sky-200/20 bg-sky-200/10 text-sky-100' : 'border-rose-200/20 bg-rose-200/10 text-rose-100'}`}>{item.status.replace('_', ' ')}</span></div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.synopsis}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white/[.035] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rights Holder</p><p className="mt-1 text-sm text-white">{item.rights_holder}</p><p className="mt-1 text-xs text-slate-400">{item.rights_basis.replaceAll('_', ' ')} · {item.is_exclusive ? 'Exclusive' : 'Non-exclusive'}</p></div>
          <div className="rounded-xl bg-white/[.035] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Territories</p><p className="mt-1 text-sm text-white">{item.territories.join(', ')}</p><p className="mt-1 text-xs text-slate-400">Rights window: {item.rights_start || 'Not set'} → {item.rights_end || 'Not set'}</p></div>
          <div className="rounded-xl bg-white/[.035] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Languages & Platforms</p><p className="mt-1 text-sm text-white">{item.languages.join(', ')}</p><p className="mt-1 text-xs text-slate-400">{item.platforms.join(', ')}</p></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">{item.poster_url && <a className="text-[#c7ddcf] underline" href={item.poster_url} target="_blank" rel="noreferrer">Poster</a>}{item.backdrop_url && <a className="text-[#c7ddcf] underline" href={item.backdrop_url} target="_blank" rel="noreferrer">Backdrop</a>}{item.trailer_url && <a className="text-[#c7ddcf] underline" href={item.trailer_url} target="_blank" rel="noreferrer">Trailer</a>}{item.playback_url && <a className="text-[#c7ddcf] underline" href={item.playback_url} target="_blank" rel="noreferrer">Playback Source</a>}{item.rights_evidence_url && <a className="text-amber-200 underline" href={item.rights_evidence_url} target="_blank" rel="noreferrer">Rights Evidence</a>}</div>
        {item.delivery_notes && <p className="mt-3 rounded-xl border border-white/8 bg-white/[.025] p-3 text-xs leading-5 text-slate-300">Delivery notes: {item.delivery_notes}</p>}
        {item.promotional_rights_confirmed && <p className="mt-2 text-xs text-[#c7ddcf]">Promotional materials permission declared.</p>}
        {item.review_note && <p className="mt-3 rounded-xl border border-sky-200/10 bg-sky-200/[.04] p-3 text-xs leading-5 text-sky-100">Previous Cinema note: {item.review_note}</p>}
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busyId === item.id} onClick={() => void review(item, 'approved')} className={BUTTON_PRIMARY}>Approve For Preparation</button><button type="button" disabled={busyId === item.id} onClick={() => void review(item, 'changes_requested')} className={BUTTON_GHOST}>Request Changes</button><button type="button" disabled={busyId === item.id} onClick={() => void review(item, 'rejected')} className={`${BUTTON_GHOST} text-rose-200`}>Reject</button></div>
      </li>)}</ul>}
      <p className="text-xs leading-5 text-slate-500">Approval confirms that this submission may move to the next internal distribution-preparation step. It does not automatically publish a title, verify the submitted rights, or create a distribution contract.</p>
    </section>
  );
}

export function AdminTitleList() {
  const { notify } = useToast();
  const { data: titles, error, reload } = useAsyncData(fetchAllTitles, []);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(title: Title, flag: 'is_published' | 'is_featured') {
    setBusyId(title.id);
    try {
      await setTitleFlags(title.id, { [flag]: !title[flag] });
      reload();
    } catch {
      notify('That change could not be saved.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(title: Title) {
    if (!window.confirm(`Delete "${title.title}" permanently? Its seasons and episodes will be removed too.`)) return;
    setBusyId(title.id);
    try {
      await deleteTitle(title.id);
      notify('Title deleted.');
      reload();
    } catch {
      notify('The title could not be deleted.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={`${PAGE_CONTAINER} space-y-8`}>
      <AdminPageHeader
        title="Content manager"
        action={
          <div className="flex flex-wrap gap-2">
            <a href="/admin/clips" className={BUTTON_GHOST}>Discover clips</a>
            <a href="/admin/new" className={BUTTON_PRIMARY}><Plus className="h-4 w-4" /> New title</a>
          </div>
        }
      />

      <StudioVerificationQueue />
      <StudioTitleReviewQueue />

      {!titles && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}

      {titles && titles.length === 0 && (
        <p className={`${CARD} text-sm text-slate-400`}>No titles yet. Create your first title to start building the catalogue.</p>
      )}

      {titles && titles.length > 0 && (
        <ul className="space-y-3">
          {titles.map((title) => (
            <li key={title.id} className={`${CARD} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5`}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{title.title}</p>
                <p className="text-xs text-slate-400">{TITLE_TYPE_LABELS[title.type]}{title.release_year ? ` · ${title.release_year}` : ''}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${title.is_published ? 'bg-sky-500/15 text-slate-200' : 'bg-amber-400/15 text-amber-300'}`}>
                    {title.is_published ? 'Published' : 'Draft'}
                  </span>
                  {title.is_featured && <span className="rounded-md bg-cinema-600/20 px-2 py-0.5 text-xs font-semibold text-cinema-200">Featured</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <button type="button" disabled={busyId === title.id} onClick={() => void toggle(title, 'is_published')} className={BUTTON_GHOST}>
                  {title.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {title.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" disabled={busyId === title.id} onClick={() => void toggle(title, 'is_featured')} className={BUTTON_GHOST}>
                  <Star className={`h-4 w-4 ${title.is_featured ? 'fill-current text-cinema-300' : ''}`} />
                  {title.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                <a href={`/admin/title/${title.id}`} className={BUTTON_GHOST}>
                  <Pencil className="h-4 w-4" /> Edit
                </a>
                <button type="button" disabled={busyId === title.id} onClick={() => void remove(title)} className={`${BUTTON_GHOST} text-rose-300 hover:text-rose-200`}>
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminListPage() {
  return (
    <AdminGate>
      <AdminTitleList />
    </AdminGate>
  );
}

function AdminTitleEditor({ titleId }: { titleId: string | null }) {
  const { data, error, reload } = useAsyncData(
    () => (titleId ? fetchTitleDetail(titleId) : Promise.resolve(null)),
    [titleId],
  );

  if (titleId && !data) {
    return <div className={PAGE_CONTAINER}>{error ? <ErrorState onRetry={reload} /> : <LoadingState />}</div>;
  }

  const title = data?.title ?? null;
  if (titleId && !title) {
    return (
      <div className={PAGE_CONTAINER}>
        <p className={`${CARD} text-sm text-slate-300`}>This title could not be found.</p>
      </div>
    );
  }

  return (
    <div className={`${PAGE_CONTAINER} space-y-10`}>
      <AdminPageHeader title={title ? `Edit: ${title.title}` : 'New title'} />
      <TitleForm
        key={title?.id ?? 'new'}
        initial={title}
        onSaved={(saved) => {
          if (!titleId) navigateTo(`/admin/title/${saved.id}`);
          else reload();
        }}
      />
      {title?.type === 'series' && data && (
        <section className="space-y-6">
          <h2 className="text-xl font-extrabold text-white">Seasons and episodes</h2>
          <SeasonManager titleId={title.id} seasons={data.seasons} onChanged={reload} />
        </section>
      )}
      {title && title.type !== 'series' && (
        <p className="text-sm text-slate-400">
          Playback for this title uses the playback link above. Seasons and episodes are only used for series.
        </p>
      )}
    </div>
  );
}

export function AdminTitlePage({ titleId }: { titleId: string | null }) {
  return (
    <AdminGate>
      <AdminTitleEditor titleId={titleId} />
    </AdminGate>
  );
}
