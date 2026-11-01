import { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Building2, Search as SearchIcon, ShieldCheck } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { INPUT, PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { groupByPublisher, publisherHref } from '@/lib/publishers';
import { fetchPublishedTitles } from '@/lib/library';
import { TITLE_TYPE_LABELS } from '@/lib/types';
import { fetchVerifiedStudios } from '@/lib/studios';
export function PublishersPage() {
 const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
 const { data: verifiedStudios } = useAsyncData(() => fetchVerifiedStudios().catch(() => []), []);
 const [query, setQuery] = useState('');
 const publishers = useMemo(() => groupByPublisher(titles ?? []), [titles]);
 const verifiedNames = new Set((verifiedStudios ?? []).map((studio) => studio.studio_name.trim().toLowerCase()));
 const visible = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? publishers.filter((publisher) => publisher.name.toLowerCase().includes(needle)) : publishers; }, [publishers, query]);
 return <div className={`${PAGE_CONTAINER} space-y-8 pb-12`}>
  <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/15 bg-gradient-to-br from-cinema-700/25 via-ink-900 to-ink-950 p-6 sm:p-9">
   <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cinema-200"><Building2 className="h-4 w-4" /> The industry behind the stories</p><h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Studios & Publishers</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Explore the studios, broadcasters, distributors and production partners whose entertainment appears across Cinema.</p>
   <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><BadgeCheck className="h-4 w-4 text-cinema-200" /> Verified profiles are reviewed by Cinema</span><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><ShieldCheck className="h-4 w-4 text-cinema-200" /> Official status is never self-assigned</span></div>
  </header>
  {!titles && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}
  {titles && titles.length === 0 && <EmptyState icon={<Building2 className="h-7 w-7 text-cinema-300" />} title="Industry profiles are on their way" description="Studios and publishers appear here as their titles and official profiles are added to Cinema." />}
  {titles && publishers.length > 0 && <><div className="relative max-w-xl"><SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a studio, broadcaster or publisher" aria-label="Find a studio or publisher" className={`${INPUT} py-3 pl-11`} /></div>
   {visible.length === 0 ? <p className="text-sm text-slate-400">No profiles match “{query.trim()}”.</p> : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((publisher) => { const types = [...new Set(publisher.titles.map((item) => item.type))]; const verified = verifiedNames.has(publisher.name.trim().toLowerCase()); return <li key={publisher.name}><a href={publisherHref(publisher.name)} className="group flex h-full items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-950 p-5 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-cinema-300/35"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-cinema-300/15 bg-cinema-500/15 text-2xl font-black uppercase text-cinema-100">{publisher.name.charAt(0)}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-base font-extrabold text-white">{publisher.name}</span>{verified && <BadgeCheck className="h-4 w-4 shrink-0 fill-cinema-400/15 text-cinema-300" aria-label="Verified studio" />}</span><span className="mt-1 block text-xs text-slate-400">{publisher.titles.length} {publisher.titles.length === 1 ? 'title' : 'titles'}{publisher.upcoming.length ? ` · ${publisher.upcoming.length} upcoming` : ''}</span><span className="mt-2 block truncate text-[10px] font-bold uppercase tracking-wider text-cinema-300">{types.map((type) => TITLE_TYPE_LABELS[type]).join(' · ')}</span></span><ArrowRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-300" /></a></li>; })}</ul>}</>}
 </div>;
}
