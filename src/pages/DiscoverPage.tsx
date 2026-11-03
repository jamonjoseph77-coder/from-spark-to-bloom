import { Compass, Sparkles, Film, Tv, Radio, Users, BadgeCheck, Flame } from 'lucide-react';
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
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cinema-300">From Studios And Publishers</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Official Trailers</h2><p className="mt-1 text-sm text-slate-400">Trailers and teasers from official studio and publisher sources.</p></div>
          <span className="rounded-full border border-sky-300/15 bg-sky-300/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-200">Verified sources</span>
        </div>
        <OfficialTrailers />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Explore Cinema categories">
        <a href="/movies" className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1421] p-5 transition hover:-translate-y-1 hover:border-sky-200/35"><img src="https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-50" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101d]/95 via-[#07101d]/65 to-transparent" /><Film className="h-5 w-5 text-sky-200" /><h3 className="mt-5 text-lg font-extrabold text-white">Movies</h3><p className="mt-1 text-xs text-slate-300">Films From Every Corner</p></a>
        <a href="/series" className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1421] p-5 transition hover:-translate-y-1 hover:border-sky-200/35"><img src="https://image.tmdb.org/t/p/w500/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-50" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101d]/95 via-[#07101d]/65 to-transparent" /><Tv className="h-5 w-5 text-sky-200" /><h3 className="mt-5 text-lg font-extrabold text-white">Series</h3><p className="mt-1 text-xs text-slate-300">Stories That Keep Going</p></a>
        <a href="/live-tv" className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1421] p-5 transition hover:-translate-y-1 hover:border-sky-200/35"><img src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=80" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-50" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101d]/95 via-[#07101d]/65 to-transparent" /><Radio className="h-5 w-5 text-sky-200" /><h3 className="mt-5 text-lg font-extrabold text-white">Live Television</h3><p className="mt-1 text-xs text-slate-300">Channels And Live Programming</p></a>
        <a href="/friends" className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1421] p-5 transition hover:-translate-y-1 hover:border-sky-200/35"><img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 transition duration-500 group-hover:scale-105 group-hover:opacity-45" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101d]/95 via-[#07101d]/65 to-transparent" /><Users className="h-5 w-5 text-sky-200" /><h3 className="mt-5 text-lg font-extrabold text-white">Friends & Community</h3><p className="mt-1 text-xs text-slate-300">Discover What People Share</p></a>
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <a href="/publishers" className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-sky-400/[.10] to-white/[.02] p-5 transition hover:border-sky-200/30"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-200/20 bg-sky-300/10 text-sky-100"><BadgeCheck className="h-6 w-6" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Verified Studios & Publishers</span><span className="mt-1 block text-xs text-slate-400">Follow official entertainment destinations.</span></span></a>
        <a href="/friends" className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-400/[.10] to-white/[.02] p-5 transition hover:border-sky-200/30"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-indigo-200/20 bg-indigo-300/10 text-indigo-100"><Flame className="h-6 w-6" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">What Your Circle Is Watching</span><span className="mt-1 block text-xs text-slate-400">Find conversations and shared favourites.</span></span></a>
      </section>
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <DiscoverShorts />
      <CinemaPulse />

      <section className="space-y-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cinema-300">Explore The Catalogue</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Stories worth your time</h2><p className="mt-1 text-sm text-slate-400">Useful recommendations with a direct path to each movie or series.</p></div>
        <TmdbRow heading="Trending movies" description="Films audiences are exploring right now." mediaType="movie" list="trending" />
        <TmdbRow heading="Trending series" description="Series creating a buzz." mediaType="tv" list="trending" />
        <TmdbRow heading="Popular movies" description="More films to add to your watchlist." mediaType="movie" list="popular" />
        <TmdbRow heading="Popular series" description="Discover your next series." mediaType="tv" list="popular" />
      </section>
    </div>
  );
}
