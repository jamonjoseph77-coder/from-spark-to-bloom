import { ArrowLeft } from 'lucide-react';
import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import { CARD, PAGE_CONTAINER } from '@/components/ui/styles';

export function AboutPage() {
  return (
    <div className={PAGE_CONTAINER + ' space-y-7'}>
      <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back To Cinema
      </a>
      <header className="space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-slate-400">Cinema</p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">About & Credits</h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">
          Cinema Is A Next-Generation Television Service Bringing Movies, Series, Live Television And Discovery Together In One Digital Home.
          Experience The World Of Stories.
        </p>
      </header>
      <section className={CARD + ' space-y-4'}>
        <h2 className="text-lg font-extrabold text-white">Data & Credits</h2>
        <p className="text-sm leading-6 text-slate-400">
          Cinema uses third-party metadata and artwork to help viewers discover films and television titles.
          This information does not itself grant streaming or distribution rights to the underlying works.
        </p>
        <TmdbAttribution />
      </section>
    </div>
  );
}
