import { Compass, Sparkles } from 'lucide-react';
import { OfficialTrailers } from '@/components/discover/OfficialTrailers';
import { TmdbRow } from '@/components/tmdb/TmdbRow';

export function DiscoverPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 pb-8 sm:px-6 lg:px-10">
      <header className="relative isolate overflow-hidden rounded-3xl border border-cinema-400/20 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.25),transparent_55%),linear-gradient(135deg,#0b1425,#050912_70%)] p-6 shadow-2xl shadow-black/20 sm:p-9">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-cinema-500/10 blur-3xl" />
        <div className="relative max-w-2xl space-y-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cinema-300"><Compass className="h-4 w-4" /> Explore Cinema</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Find your next story.</h1>
          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">Watch official trailers and explore movies and series worth discovering. Every trailer is presented as a preview of its full title.</p>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-300"><Sparkles className="h-3.5 w-3.5 text-cinema-300" /> Official previews. More to explore.</div>
        </div>
      </header>
      <section className="space-y-5">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cinema-300">From studios and publishers</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Official trailers</h2><p className="mt-1 text-sm text-slate-400">Trailers and teasers published by verified rights holders and official channels.</p></div>
        <OfficialTrailers />
      </section>
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <TmdbRow heading="Trending movies" description="Films audiences are exploring right now." mediaType="movie" list="trending" />
      <TmdbRow heading="Trending series" description="Series creating a buzz." mediaType="tv" list="trending" />
      <TmdbRow heading="Popular movies" description="More films to add to your watchlist." mediaType="movie" list="popular" />
      <TmdbRow heading="Popular series" description="Discover your next series." mediaType="tv" list="popular" />
    </div>
  );
}
