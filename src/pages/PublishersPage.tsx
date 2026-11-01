import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, BadgeCheck, Building2, Search as SearchIcon, ShieldCheck, Send, Globe2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT, PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { groupByPublisher, publisherHref } from '@/lib/publishers';
import { fetchPublishedTitles } from '@/lib/library';
import { TITLE_TYPE_LABELS } from '@/lib/types';
import { fetchMyStudioApplication, fetchVerifiedStudios, submitStudioApplication, type StudioAccount } from '@/lib/studios';

function StudioApplicationPanel({ userId }: { userId: string }) {
  const { notify } = useToast();
  const application = useAsyncData(() => fetchMyStudioApplication(userId), [userId]);
  const [studioName, setStudioName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studioName.trim() || description.trim().length < 20) {
      notify('Enter your organisation name and a description of at least 20 characters.', 'error');
      return;
    }
    if (websiteUrl.trim() && !/^https?:\\/\\//i.test(websiteUrl.trim())) {
      notify('Use a full website address beginning with https://.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await submitStudioApplication({
        owner_id: userId,
        studio_name: studioName.trim(),
        description: description.trim(),
        website_url: websiteUrl.trim() || null,
        logo_url: logoUrl.trim() || null,
      });
      notify('Your studio application has been submitted for Cinema review.');
      application.reload();
    } catch {
      notify('We could not submit this application. Check whether an application already exists for this account.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!application.data && application.loading) return <div className="rounded-3xl border border-white/10 bg-ink-900/70 p-5"><LoadingState label="Checking studio application" /></div>;
  if (application.error) return <div className="rounded-3xl border border-white/10 bg-ink-900/70 p-5"><ErrorState onRetry={application.reload} /></div>;

  const record = application.data as StudioAccount | null;
  return (
    <section className="rounded-3xl border border-cinema-400/15 bg-gradient-to-br from-cinema-700/15 via-ink-900 to-ink-950 p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cinema-500/15 text-cinema-200"><Building2 className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cinema-300">For studios and broadcasters</p><h2 className="mt-1 text-xl font-extrabold text-white">Establish your official presence on Cinema.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Submit your organisation for review. Cinema checks each application before granting an official verified identity.</p></div></div>
      {record ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-ink-950/60 p-4">
          <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-white">{record.studio_name}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${record.verification_status === 'verified' ? 'bg-emerald-400/10 text-emerald-300' : record.verification_status === 'pending' ? 'bg-amber-300/10 text-amber-200' : 'bg-slate-700 text-slate-300'}`}>{record.verification_status}</span></div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{record.verification_status === 'pending' ? 'Your application is awaiting review by the Cinema team. The verified badge will appear only if your application is approved.' : record.verification_status === 'verified' ? 'Your official studio identity has been verified by Cinema.' : 'This application is not currently verified. Contact Cinema through its official support route for further review.'}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-200">Organisation name<input required maxLength={120} value={studioName} onChange={(event) => setStudioName(event.target.value)} placeholder="Studio or broadcaster name" className={`${INPUT} mt-1`} /></label>
          <label className="space-y-2 text-sm font-semibold text-slate-200">Official website<input type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://example.com" className={`${INPUT} mt-1`} /></label>
          <label className="space-y-2 text-sm font-semibold text-slate-200 sm:col-span-2">Organisation description<textarea required minLength={20} maxLength={1200} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe your studio, broadcaster or distribution organisation and the work you represent." className={`${INPUT} mt-1 resize-y`} /></label>
          <label className="space-y-2 text-sm font-semibold text-slate-200 sm:col-span-2">Logo image URL (optional)<input type="url" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://example.com/logo.png" className={`${INPUT} mt-1`} /></label>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2"><p className="max-w-xl text-xs leading-5 text-slate-500">Submitting does not grant verification. The Cinema team reviews the organisation and supporting details before approving its badge.</p><button type="submit" disabled={submitting} className={BUTTON_PRIMARY}><Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit for review'}</button></div>
        </form>
      )}
    </section>
  );
}

export function PublishersPage() {
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
  const { data: verifiedStudios } = useAsyncData(() => fetchVerifiedStudios().catch(() => []), []);
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const publishers = useMemo(() => groupByPublisher(titles ?? []), [titles]);
  const verifiedNames = new Set((verifiedStudios ?? []).map((studio) => studio.studio_name.trim().toLowerCase()));
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? publishers.filter((publisher) => publisher.name.toLowerCase().includes(needle)) : publishers;
  }, [publishers, query]);

  return (
    <div className={`${PAGE_CONTAINER} space-y-8 pb-12`}>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/15 bg-gradient-to-br from-cinema-700/25 via-ink-900 to-ink-950 p-6 sm:p-9">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cinema-200"><Building2 className="h-4 w-4" /> The industry behind the stories</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Studios & Publishers</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Explore the studios, broadcasters, distributors and production partners whose entertainment appears across Cinema.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><BadgeCheck className="h-4 w-4 text-cinema-200" /> Verified profiles are reviewed by Cinema</span><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><ShieldCheck className="h-4 w-4 text-cinema-200" /> Official status is never self-assigned</span></div>
      </header>
      {user ? <StudioApplicationPanel userId={user.id} /> : <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-ink-900/70 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-white">Are you a studio, broadcaster or distributor?</p><p className="mt-1 text-sm text-slate-400">Sign in to submit your organisation for official verification.</p></div><a href="/sign-in" className={BUTTON_PRIMARY}>Sign in to apply</a></div>}
      {!titles && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}
      {titles && titles.length === 0 && <EmptyState icon={<Building2 className="h-7 w-7 text-cinema-300" />} title="Industry profiles are on their way" description="Studios and publishers appear here as their titles and official profiles are added to Cinema." />}
      {titles && publishers.length > 0 && <>
        <div className="relative max-w-xl"><SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a studio, broadcaster or publisher" aria-label="Find a studio or publisher" className={`${INPUT} py-3 pl-11`} /></div>
        {visible.length === 0 ? <p className="text-sm text-slate-400">No profiles match “{query.trim()}”.</p> : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((publisher) => {
          const types = [...new Set(publisher.titles.map((item) => item.type))];
          const verified = verifiedNames.has(publisher.name.trim().toLowerCase());
          return <li key={publisher.name}><a href={publisherHref(publisher.name)} className="group flex h-full items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-950 p-5 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-cinema-300/35"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-cinema-300/15 bg-cinema-500/15 text-2xl font-black uppercase text-cinema-100">{publisher.name.charAt(0)}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-base font-extrabold text-white">{publisher.name}</span>{verified && <BadgeCheck className="h-4 w-4 shrink-0 fill-cinema-400/15 text-cinema-300" aria-label="Verified studio" />}</span><span className="mt-1 block text-xs text-slate-400">{publisher.titles.length} {publisher.titles.length === 1 ? 'title' : 'titles'}{publisher.upcoming.length ? ` · ${publisher.upcoming.length} upcoming` : ''}</span><span className="mt-2 block truncate text-[10px] font-bold uppercase tracking-wider text-cinema-300">{types.map((type) => TITLE_TYPE_LABELS[type]).join(' · ')}</span></span><ArrowRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-300" /></a></li>;
        })}</ul>}
      </>}
      <div className="flex items-start gap-2 rounded-2xl border border-white/8 bg-ink-900/50 p-4 text-xs leading-5 text-slate-500"><Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-cinema-300" /><p>Verification confirms the official organisation identity on Cinema. It does not, by itself, confirm that every title in a profile is licensed for viewing in every territory.</p></div>
    </div>
  );
}
