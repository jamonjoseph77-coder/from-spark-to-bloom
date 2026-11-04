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
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">{studio.studio_name}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${studio.verification_status === 'verified' ? 'bg-cinema-500/12 text-cinema-200' : studio.verification_status === 'pending' ? 'bg-amber-300/10 text-amber-200' : 'bg-slate-700/60 text-slate-300'}`}>{studio.verification_status}</span></div>
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
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${title.is_published ? 'bg-cinema-500/12 text-cinema-200' : 'bg-amber-400/15 text-amber-300'}`}>
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
