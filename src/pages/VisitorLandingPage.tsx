import { ArrowRight, Compass, Film, Radio, Share2, Sparkles, Tv } from 'lucide-react';
import { CinemaLogo } from '@/components/ui/CinemaLogo';

const FEATURES = [
  { icon: Film, title: 'Stories For Every Mood', description: 'Explore movies and series from familiar favourites to new discoveries.' },
  { icon: Tv, title: 'Television, Reimagined', description: 'Bring entertainment and live programming together in one destination.' },
  { icon: Share2, title: 'A World To Share', description: 'Connect around the titles, creators and channels you care about.' },
];

export function VisitorLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030407] text-[#f1f4f8] selection:bg-blue-500/30">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-blue-500/[.10] blur-[110px]" />
        <div className="absolute -right-40 top-20 h-[32rem] w-[32rem] rounded-full bg-blue-400/[.08] blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-white/[.025] blur-[100px]" />
        <div className="absolute inset-0 opacity-[.16]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)', backgroundSize: '72px 72px', maskImage: 'linear-gradient(to bottom, black, transparent 72%)' }} />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <a href="/" aria-label="Cinema home" className="relative flex items-center">
          <img src="/cinema-icon.png" alt="" aria-hidden="true" className="absolute -left-3 -top-3 h-16 w-16 opacity-[.12] blur-[1px]" />
          <CinemaLogo />
        </a>
        <nav aria-label="Account" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a href="/sign-in" className="rounded-full border border-white/15 bg-white/[.045] px-4 py-2.5 text-xs font-bold text-slate-100 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 sm:px-5 sm:text-sm">Sign In</a>
          <a href="/sign-up" className="rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5 hover:brightness-110 sm:px-5 sm:text-sm">Create Account</a>
        </nav>
      </header>

      <section className="relative z-[1] mx-auto grid min-h-[620px] w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-24">
        <div className="max-w-2xl animate-rise-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.045] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-white shadow-lg shadow-black/30 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Your Next Entertainment Destination
          </div>
          <h1 className="mt-7 text-[2.8rem] font-black leading-[1.04] tracking-[-.055em] text-white sm:text-6xl lg:text-[4.4rem]">
            Experience The
            <span className="mt-1 block text-white">World Of Stories.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#c0c8d3] sm:text-lg">
            Movies, series, television and live entertainment—brought together in a beautiful digital home made for discovering and sharing the stories you love.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/sign-up" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#087cff] px-7 text-sm font-black text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-1 hover:shadow-sky-900/40">
              Create Your Cinema Account <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a href="/sign-in" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[.045] px-7 text-sm font-bold text-white backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[.08]">I Already Have An Account</a>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-400">
            <span className="inline-flex items-center gap-2"><Film className="h-4 w-4 text-[#f1f4f8]" /> Movies & Series</span>
            <span className="inline-flex items-center gap-2"><Radio className="h-4 w-4 text-[#f1f4f8]" /> Live Television</span>
            <span className="inline-flex items-center gap-2"><Compass className="h-4 w-4 text-[#f1f4f8]" /> Discover & Share</span>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center py-8 lg:py-0">
          <div aria-hidden="true" className="pointer-events-none absolute inset-[-5%] -z-10 overflow-hidden rounded-[3rem]">
            <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=85" alt="" loading="lazy" className="h-full w-full object-cover opacity-[.20] blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/75 to-[#030407]/35" />
          </div>
          <div aria-hidden="true" className="absolute h-[22rem] w-[22rem] rounded-full border border-white/[.10] bg-white/[.02] shadow-[0_0_100px_rgba(0,102,255,.12)] sm:h-[27rem] sm:w-[27rem]" />
          <div aria-hidden="true" className="absolute h-[18rem] w-[18rem] rounded-full border border-white/[.07] sm:h-[23rem] sm:w-[23rem]" />
          <div className="relative grid w-full grid-cols-3 items-center gap-2.5 px-2 sm:gap-4 sm:px-5">
            <div className="mt-12 rotate-[-8deg] overflow-hidden rounded-[1.35rem] border border-white/20 bg-[#142236] shadow-2xl shadow-black/50 transition duration-700 hover:rotate-[-3deg] hover:scale-[1.04]">
              <img src="https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" alt="Movie artwork" loading="lazy" className="aspect-[2/3] w-full object-cover" />
              <div className="bg-gradient-to-t from-[#07101b] to-[#142236] p-2.5 sm:p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[#f1f4f8] sm:text-[10px]">Discover</p><p className="mt-1 text-[11px] font-bold text-white sm:text-xs">New Stories</p></div>
            </div>
            <div className="z-[1] -mt-10 overflow-hidden rounded-[1.6rem] border border-white/20 bg-[#13243a] shadow-[0_28px_90px_rgba(0,0,0,.6)] transition duration-700 hover:-translate-y-2">
              <img src="https://image.tmdb.org/t/p/w500/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg" alt="Series artwork" loading="lazy" className="aspect-[2/3] w-full object-cover" />
              <div className="bg-gradient-to-t from-[#07101b] via-[#0d1a2a] to-[#13243a] p-3 sm:p-4"><p className="text-[9px] font-black uppercase tracking-wider text-[#f1f4f8] sm:text-[10px]">Experience</p><p className="mt-1 text-xs font-extrabold text-white sm:text-sm">Your Next Favourite</p><p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">A world of entertainment</p></div>
            </div>
            <div className="mt-14 rotate-[8deg] overflow-hidden rounded-[1.35rem] border border-white/20 bg-[#142236] shadow-2xl shadow-black/50 transition duration-700 hover:rotate-[3deg] hover:scale-[1.04]">
              <img src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=700&q=85" alt="Television screen" loading="lazy" className="aspect-[2/3] w-full object-cover" />
              <div className="bg-gradient-to-t from-[#07101b] to-[#142236] p-2.5 sm:p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[#f1f4f8] sm:text-[10px]">Watch</p><p className="mt-1 text-[11px] font-bold text-white sm:text-xs">Live & More</p></div>
            </div>
          </div>
          <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-[#080b11]/90 px-4 py-2.5 text-[10px] font-bold text-slate-200 shadow-xl shadow-black/40 backdrop-blur-xl sm:bottom-2 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-[#168cff] shadow-[0_0_12px_rgba(22,140,255,.65)]" /> One Account. A World Of Stories.
          </div>
        </div>
      </section>

      <section className="relative z-[1] mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8 lg:px-12">
        <div className="grid gap-3 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <article key={title} className="group rounded-[1.6rem] border border-white/[.10] bg-gradient-to-br from-white/[.075] to-white/[.025] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:from-white/[.08] sm:p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-sky-200/20 bg-sky-200/[.08] text-white"><Icon className="h-5 w-5" /></span>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-[#f1f4f8]/70">0{index + 1}</p>
              <h2 className="mt-1 text-lg font-extrabold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="relative z-[1] mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 border-t border-white/[.08] px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-8 lg:px-12">
        <span>© {new Date().getFullYear()} Cinema. Experience The World Of Stories.</span>
        <div className="flex items-center gap-4"><a href="/about" className="transition hover:text-slate-200">About & Credits</a><a href="/forgot-password" className="transition hover:text-slate-200">Forgot Password?</a><a href="/sign-in" className="transition hover:text-slate-200">Sign In</a></div>
      </footer>
    </main>
  );
}
