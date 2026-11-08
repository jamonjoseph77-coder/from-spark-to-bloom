import { useMemo } from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchPublishedTitles } from '@/lib/library';
import type { Title } from '@/lib/types';

export function FreeContentPage() {
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
  const freeTitles = useMemo(() => (titles ?? []).filter((title) => /(^|\b)free(\b|$)/i.test(title.availability ?? '')), [titles]);
  const movies = useMemo(() => freeTitles.filter((title: Title) => title.type === 'movie'), [freeTitles]);
  const series = useMemo(() => freeTitles.filter((title: Title) => title.type === 'series'), [freeTitles]);

  return <main className={`${PAGE_CONTAINER} space-y-7 pb-14`}>
    <header className="rounded-2xl border border-emerald-200/15 bg-[linear-gradient(120deg,rgba(25,91,72,.22),rgba(20,25,35,.92)_58%,rgba(40,55,83,.25))] px-5 py-5 sm:px-6">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200"><Gift className="h-4 w-4" /> A Little More To Enjoy</p>
      <h1 className="mt-2 text-2xl font-extrabold text-white">Free Movies & Series</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">A small collection of titles marked free by their publisher. Explore without a subscription.</p>
    </header>
    {!titles && (error ? <ErrorState onRetry={reload} /> : <LoadingState label="Finding Free Stories" />)}
    {titles && movies.length > 0 && <TitleRow heading="Free Movies" description="Films currently marked free to watch in Cinema." titles={movies} />}
    {titles && series.length > 0 && <TitleRow heading="Free Series" description="Series currently marked free to watch in Cinema." titles={series} />}
    {titles && freeTitles.length === 0 && <EmptyState icon={<Gift className="h-7 w-7 text-emerald-200" />} title="Free Picks Are On Their Way" description="Titles will appear here when a publisher marks them as free to watch in Cinema." />}
    <a href="/discover" className="inline-flex items-center gap-2 text-xs font-semibold text-cinema-200 hover:text-white">Explore All Of Cinema <ArrowRight className="h-3.5 w-3.5" /></a>
  </main>;
}
