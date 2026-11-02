import { Compass, Sparkles } from 'lucide-react';
import { OfficialTrailers } from '@/components/discover/OfficialTrailers';
import { DiscoverShorts, CinemaPulse } from '@/components/discover/DiscoverShorts';
import { TmdbRow } from '@/components/tmdb/TmdbRow';

export function DiscoverPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 pb-8 sm:px-6 lg:space-y-10 lg:px-10">
      <header className="relative isolate overflow-hidden rounded-3xl border border-cinema-400/20 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.25),transparent_55%),linear-gradient(135deg,#0b1425,#050912_70%)] p-6 shadow-2xl shadow-black/20 sm:p-9">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-cinema-500/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-sky-400/[.07] blur-3xl" />
        <div className="relative max-w-2xl space-y-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cinema-300"><Compass className="h-4 w-4" /> Explore Cinema</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">More than a trailer. Find the story.</h1>
          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">Watch official previews, catch short moments, discover what people are saying and move straight to the stories worth your time.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-200"><Sparkles className="h-3.5 w-3.5 text-cinema-300" /> Watch. Discover. Talk.</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-400">Official video + community conversation</span>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cinema-300">From studios and publishers</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Official trailers</h2><p className="mt-1 text-sm text-slate-400">Trailers and teasers from official studio and publisher sources.</p></div>
          <span className="rounded-full border border-sky-300/15 bg-sky-300/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-200">Verified sources</span>
        </div>
        <OfficialTrailers />
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <DiscoverShorts />
      <CinemaPulse />

      <section className="space-y-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cinema-300">Explore the catalogue</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Stories worth your time</h2><p className="mt-1 text-sm text-slate-400">Useful recommendations with a direct path to each movie or series.</p></div>
        <TmdbRow heading="Trending movies" description="Films audiences are exploring right now." mediaType="movie" list="trending" />
        <TmdbRow heading="Trending series" description="Series creating a buzz." mediaType="tv" list="trending" />
        <TmdbRow heading="Popular movies" description="More films to add to your watchlist." mediaType="movie" list="popular" />
        <TmdbRow heading="Popular series" description="Discover your next series." mediaType="tv" list="popular" />
      </section>
    </div>
  );
}
