import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, BadgeCheck, Building2, Search as SearchIcon, ShieldCheck, Send, Globe2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT, PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { groupByPublisher, publisherHref } from '@/lib/publishers';
import { fetchPublishedTitles } from '@/lib/library';
import { TITLE_TYPE_LABELS } from '@/lib/types';
import { fetchMyStudioApplication, fetchVerifiedStudios, submitStudioApplication, updateMyVerifiedStudioProfile, type StudioAccount } from '@/lib/studios';
import { fetchMyCreatorShortSubmissions } from '@/lib/creator-shorts';

function StudioApplicationPanel({ userId }: { userId: string }) {
  const { notify } = useToast();
  const application = useAsyncData(() => fetchMyStudioApplication(userId), [userId]);
  const [studioName, setStudioName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileDescription, setProfileDescription] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileLogo, setProfileLogo] = useState('');
  const submissions = useAsyncData(() => fetchMyCreatorShortSubmissions(userId), [userId]);

  useEffect(() => {
    const record = application.data;
    if (!record) return;
    setProfileDescription(record.description ?? '');
    setProfileWebsite(record.website_url ?? '');
    setProfileLogo(record.logo_url ?? '');
  }, [application.data?.id, application.data?.updated_at]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!application.data || application.data.verification_status !== 'verified') return;
    const website = profileWebsite.trim();
    const logo = profileLogo.trim();
    if (website && !website.startsWith('https://')) {
      notify('Use a secure website address beginning with https://.', 'error');
      return;
    }
    if (logo && !logo.startsWith('https://')) {
      notify('Use a secure logo image address beginning with https://.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      await updateMyVerifiedStudioProfile(userId, {
        description: profileDescription.trim(),
        website_url: website || null,
        logo_url: logo || null,
      });
      notify('Your official studio profile has been updated.');
      setEditing(false);
      application.reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Your studio profile could not be updated.', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studioName.trim() || description.trim().length < 20) {
      notify('Enter your organisation name and a description of at least 20 characters.', 'error');
      return;
    }
    if (websiteUrl.trim() && !(websiteUrl.trim().startsWith('https://') || websiteUrl.trim().startsWith('http://'))) {
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
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-ink-950/60 p-4">
            <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-white">{record.studio_name}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${record.verification_status === 'verified' ? 'bg-[#a8cbb6]/15 text-[#c7ddcf]' : record.verification_status === 'pending' ? 'bg-amber-300/10 text-amber-200' : 'bg-slate-700 text-slate-300'}`}>{record.verification_status}</span></div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{record.verification_status === 'pending' ? 'Your application is awaiting review by the Cinema team. The verified badge will appear only if your application is approved.' : record.verification_status === 'verified' ? 'Your official studio identity is verified. You can manage your public profile and follow your content submissions below.' : 'This application is not currently verified. Profile publishing tools are unavailable while verification is inactive.'}</p>
            {record.verification_status === 'verified' && <a href={publisherHref(record.studio_name)} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#c7ddcf] hover:text-white">View Public Studio Destination <ArrowRight className="h-3.5 w-3.5" /></a>}
          </div>
          {record.verification_status === 'verified' && <section className="rounded-2xl border border-[#a8cbb6]/15 bg-[linear-gradient(135deg,#202a24,#141a16)] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#b9d2c2]">Studio Workspace</p><h3 className="mt-1 text-lg font-extrabold text-white">Official Profile</h3><p className="mt-1 text-xs text-slate-400">Keep your public Cinema identity accurate and up to date.</p></div><button type="button" onClick={() => setEditing((value) => !value)} className={BUTTON_SECONDARY}>{editing ? 'Cancel Editing' : 'Edit Profile'}</button></div>
            {editing ? <form onSubmit={(event) => void saveProfile(event)} className="mt-4 grid gap-3">
              <label className="space-y-1.5 text-xs font-semibold text-slate-200">Studio Description<textarea required minLength={20} maxLength={1200} rows={4} value={profileDescription} onChange={(event) => setProfileDescription(event.target.value)} className={`${INPUT} resize-y`} /></label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-200">Official Website<input type="url" value={profileWebsite} onChange={(event) => setProfileWebsite(event.target.value)} placeholder="https://example.com" className={INPUT} /></label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-200">Logo Image URL<input type="url" value={profileLogo} onChange={(event) => setProfileLogo(event.target.value)} placeholder="https://example.com/logo.png" className={INPUT} /></label>
              <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => { setProfileDescription(record.description); setProfileWebsite(record.website_url ?? ''); setProfileLogo(record.logo_url ?? ''); setEditing(false); }} className={BUTTON_SECONDARY}>Cancel</button><button type="submit" disabled={savingProfile} className={BUTTON_PRIMARY}>{savingProfile ? 'Saving...' : 'Save Official Profile'}</button></div>
            </form> : <div className="mt-4 flex items-start gap-3">{record.logo_url ? <img src={record.logo_url} alt="" className="h-14 w-14 rounded-xl border border-white/10 bg-black/20 object-contain p-1" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-xl font-black text-white">{record.studio_name.charAt(0)}</span>}<div className="min-w-0"><p className="text-sm leading-6 text-slate-300">{record.description}</p>{record.website_url && <a href={record.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-block truncate text-xs font-semibold text-[#c7ddcf] underline">{record.website_url}</a>}</div></div>}
          </section>}
          {record.verification_status === 'verified' && <section className="rounded-2xl border border-white/10 bg-ink-950/50 p-4"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-cinema-300">Content Desk</p><h3 className="mt-1 text-lg font-extrabold text-white">Shorts Submissions</h3><p className="mt-1 text-xs text-slate-400">Track review progress for videos submitted from this account.</p></div><a href="/creator/shorts" className="text-xs font-bold text-cinema-200 hover:text-white">Submit A Short <ArrowRight className="inline h-3.5 w-3.5" /></a></div>
            {submissions.loading && !submissions.data ? <p className="mt-4 text-xs text-slate-400">Loading submissions…</p> : submissions.error ? <button type="button" onClick={submissions.reload} className="mt-4 text-xs font-bold text-cinema-200">Retry Loading Submissions</button> : submissions.data?.length ? <ul className="mt-4 space-y-2">{submissions.data.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[.025] p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{item.headline}</p><p className="mt-1 text-[11px] text-slate-500">Submitted {new Date(item.created_at).toLocaleDateString()}{item.reviewed_at ? ` · Reviewed ${new Date(item.reviewed_at).toLocaleDateString()}` : ''}</p>{item.review_note && <p className="mt-1 text-xs text-slate-400">Cinema note: {item.review_note}</p>}</div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${item.status === 'approved' ? 'bg-[#a8cbb6]/15 text-[#c7ddcf]' : item.status === 'pending' ? 'bg-amber-300/10 text-amber-200' : 'bg-rose-400/10 text-rose-200'}`}>{item.status}</span></li>)}</ul> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-xs text-slate-400">No video submissions yet. Your submitted Shorts will appear here while Cinema reviews them.</p>}
          </section>}
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

type PublisherDirectoryEntry = ReturnType<typeof groupByPublisher>[number] & { verifiedStudio?: StudioAccount };

export function PublishersPage() {
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
  const { data: verifiedStudios, loading: studiosLoading } = useAsyncData(() => fetchVerifiedStudios().catch(() => []), []);
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const publishers = useMemo(() => groupByPublisher(titles ?? []), [titles]);
  const directory = useMemo<PublisherDirectoryEntry[]>(() => {
    const byName = new Map<string, PublisherDirectoryEntry>();
    publishers.forEach((publisher) => byName.set(publisher.name.trim().toLowerCase(), { ...publisher }));
    (verifiedStudios ?? []).forEach((studio) => {
      const key = studio.studio_name.trim().toLowerCase();
      const existing = byName.get(key);
      if (existing) existing.verifiedStudio = studio;
      else byName.set(key, { name: studio.studio_name, titles: [], upcoming: [], trailers: [], verifiedStudio: studio });
    });
    return [...byName.values()].sort((a, b) => Number(Boolean(b.verifiedStudio)) - Number(Boolean(a.verifiedStudio)) || a.name.localeCompare(b.name));
  }, [publishers, verifiedStudios]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? directory.filter((publisher) => publisher.name.toLowerCase().includes(needle)) : directory;
  }, [directory, query]);

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
      {titles && titles.length === 0 && verifiedStudios && verifiedStudios.length === 0 && !studiosLoading && <EmptyState icon={<Building2 className="h-7 w-7 text-cinema-300" />} title="Industry profiles are on their way" description="Studios and publishers appear here as their titles and official profiles are added to Cinema." />}
      {titles && directory.length > 0 && <>
        <div className="relative max-w-xl"><SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a studio, broadcaster or publisher" aria-label="Find a studio or publisher" className={`${INPUT} py-3 pl-11`} /></div>
        {visible.length === 0 ? <p className="text-sm text-slate-400">No profiles match “{query.trim()}”.</p> : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((publisher) => {
          const types = [...new Set(publisher.titles.map((item) => item.type))];
          const verified = Boolean(publisher.verifiedStudio);
          const titleCount = publisher.titles.length;
          return <li key={publisher.name}><a href={publisherHref(publisher.name)} className="group flex h-full items-center gap-4 rounded-3xl border border-[#91b7a2]/15 bg-[linear-gradient(135deg,#202a24,#171e1a_72%,#121714)] p-5 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-[#91b7a2]/35"><span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#a8cbb6]/20 bg-[#a8cbb6]/10 text-2xl font-black uppercase text-[#d2e4d8]">{publisher.verifiedStudio?.logo_url ? <img src={publisher.verifiedStudio.logo_url} alt="" className="h-full w-full object-contain p-2" /> : publisher.name.charAt(0)}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-base font-extrabold text-white">{publisher.name}</span>{verified && <BadgeCheck className="h-4 w-4 shrink-0 fill-[#a8cbb6]/15 text-[#b9d2c2]" aria-label="Verified by Cinema" />}</span><span className="mt-1 block text-xs text-slate-400">{titleCount ? `${titleCount} ${titleCount === 1 ? 'title' : 'titles'}${publisher.upcoming.length ? ` · ${publisher.upcoming.length} upcoming` : ''}` : 'Verified Official Profile · Catalogue Coming Soon'}</span><span className="mt-2 block truncate text-[10px] font-bold uppercase tracking-wider text-[#a8cbb6]">{types.length ? types.map((type) => TITLE_TYPE_LABELS[type]).join(' · ') : publisher.verifiedStudio?.website_url ? 'Official Organisation' : 'Cinema Publisher'}</span></span><ArrowRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-[#b9d2c2]" /></a></li>;
        })}</ul>}
      </>}
      <div className="flex items-start gap-2 rounded-2xl border border-white/8 bg-ink-900/50 p-4 text-xs leading-5 text-slate-500"><Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-cinema-300" /><p>Verification confirms the official organisation identity on Cinema. It does not, by itself, confirm that every title in a profile is licensed for viewing in every territory.</p></div>
    </div>
  );
}
