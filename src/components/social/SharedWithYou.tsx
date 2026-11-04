import { ArrowUpRight, Inbox, Share2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchSharedDiscoverContent } from '@/lib/discoverEngagement';

export function SharedWithYou() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { data, error, reload } = useAsyncData(() => fetchSharedDiscoverContent(userId), [userId]);
  return (
    <section className="space-y-4" aria-label="Content Shared With You">
      <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-sky-200"><Inbox className="h-3.5 w-3.5" /> Your Cinema Inbox</p><h2 className="mt-1 text-xl font-extrabold text-white">Shared With You</h2><p className="mt-1 text-sm text-slate-400">Entertainment picks your friends have sent your way.</p></div>
      {!data && !error && <LoadingState label="Finding Content Shared With You" />}
      {!data && error && <ErrorState onRetry={reload} />}
      {data && data.length === 0 && <EmptyState icon={<Share2 className="h-7 w-7 text-sky-200" />} title="Nothing Shared Yet" description="When friends send you a trailer, short or title, it will appear here." />}
      {data && data.length > 0 && <div className="grid gap-3 md:grid-cols-2">{data.map((item) => <article key={item.id} className="cinema-content-engagement flex gap-3 p-3"><div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-black/40">{item.image_url && <img src={item.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-sky-200">From {item.sender_name}</p><h3 className="mt-1 line-clamp-2 text-sm font-extrabold text-white">{item.content_title}</h3>{item.message && <p className="mt-1 line-clamp-2 text-xs text-slate-400">“{item.message}”</p>}<p className="mt-1 text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString()}</p><a href={item.content_url} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-sky-200 hover:text-white">Open In Cinema <ArrowUpRight className="h-3.5 w-3.5" /></a></div></article>)}</div>}
    </section>
  );
}
