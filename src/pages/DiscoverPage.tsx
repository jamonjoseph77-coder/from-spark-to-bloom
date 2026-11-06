import { useMemo, useState } from 'react';
import { Compass, Sparkles, Film, Tv, Radio, Users, BadgeCheck, Flame, Trophy, CalendarDays, Building2, BellPlus, BellRing, ArrowRight } from 'lucide-react';
import { ExploreTimeline } from '@/components/discover/ExploreTimeline';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { CinemaSeasonalSpotlight } from '@/components/catalogue/CinemaSeasonalSpotlight';
import { LoadingState, ErrorState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchPublishedTitles } from '@/lib/library';
import { groupByPublisher, publisherHref } from '@/lib/publishers';
import { fetchFollowedPublishers, followPublisher, unfollowPublisher } from '@/lib/publisherFollows';

const DAILY_DISCOVERY = [
  { name: 'Sunday Stories', line: 'A little time for family, comfort and stories to share.', genreId: 10751 },
  { name: 'Monday Motivation', line: 'Start the week with bold journeys and inspiring characters.', genreId: 18 },
  { name: 'Comedy Tuesday', line: 'Make room for a lighter story and a good laugh.', genreId: 35 },
  { name: 'Mystery Wednesday', line: 'Follow the clues and see where the story leads.', genreId: 9648 },
  { name: 'Adventure Thursday', line: 'Explore new worlds and stories beyond the everyday.', genreId: 12 },
  { name: 'Feel-Good Friday', line: 'Find a story to help ease into the weekend.', genreId: 35 },
  { name: 'Saturday Spotlight', line: 'Make time for a big story and a memorable watch.', genreId: 28 },
] as const;

function DailyDiscovery() {
  const day = new Date().getDay();
  const theme = DAILY_DISCOVERY[day];
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return (
    <section className="space-y-4" aria-labelledby="daily-discovery-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-cinema-300"><CalendarDays className="h-3.5 w-3.5" /> Daily On Cinema · {dateLabel}</p><h2 id="daily-discovery-heading" className="mt-1 text-2xl font-black text-white sm:text-3xl">{theme.name}</h2><p className="mt-1 text-sm text-slate-400">{theme.line}</p></div>
        <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-[11px] font-semibold text-slate-300">A New Theme Every Day</span>
      </div>
      <TmdbRow heading={`Today's Picks · ${theme.name}`} description="A daily discovery shelf to give every visit to Cinema a fresh starting point." mediaType="movie" list="popular" genreId={theme.genreId} />
    </section>
  );
}

function ExploreStudioTracker() {
  const { user } = useAuth();
  const { notify } = useToast();
  const titles = useAsyncData(fetchPublishedTitles, []);
  const follows = useAsyncData(() => user ? fetchFollowedPublishers(user.id) : Promise.resolve([] as string[]), [user?.id]);
  const [busy, setBusy] = useState<string | null>(null);
  const publishers = useMemo(() => groupByPublisher(titles.data ?? []).slice(0, 8), [titles.data]);
  async function toggle(name: string) {
    if (!user || busy) return;
    setBusy(name);
    try {
      if (follows.data?.includes(name)) {
        await unfollowPublisher(user.id, name);
        notify(`You Are No Longer Tracking ${name}.`);
      } else {
        await followPublisher(user.id, name);
        notify(`You Are Now Tracking ${name}.`);
      }
      follows.reload();
    } catch {
      notify('We Could Not Update Your Studio Tracking. Please Try Again.', 'error');
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="space-y-4" aria-labelledby="explore-studios-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-cinema-300"><Building2 className="h-3.5 w-3.5" /> Follow The People Behind The Stories</p><h2 id="explore-studios-heading" className="mt-1 text-2xl font-black text-white sm:text-3xl">Studios To Track</h2><p className="mt-1 text-sm text-slate-400">Choose studios, broadcasters and publishers you want updates from.</p></div>
        <a href="/publishers" className="inline-flex items-center gap-2 text-sm font-bold text-cinema-200 hover:text-white">All Studios & Publishers <ArrowRight className="h-4 w-4" /></a>
      </div>
      {!titles.data && (titles.error ? <ErrorState onRetry={titles.reload} /> : <LoadingState label="Finding publishers in Cinema" />)}
      {titles.data && publishers.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">Studio destinations will appear here as publishers add titles to Cinema.</div>}
      {publishers.length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {publishers.map((publisher) => {
          const tracked = follows.data?.includes(publisher.name) ?? false;
          return <article key={publisher.name} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 transition hover:border-cinema-300/25">
            <a href={publisherHref(publisher.name)} className="group flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cinema-300/15 bg-cinema-400/10 text-lg font-black text-cinema-100">{publisher.name.charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-white group-hover:text-cinema-100">{publisher.name}</span><span className="mt-1 block text-[11px] text-slate-400">{publisher.titles.length} {publisher.titles.length === 1 ? 'title' : 'titles'} in Cinema</span></span>
            </a>
            {user ? <button type="button" onClick={() => void toggle(publisher.name)} disabled={Boolean(busy) || follows.loading} aria-pressed={tracked} className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${tracked ? 'border-cinema-300/25 bg-cinema-300/10 text-cinema-100' : 'border-white/10 bg-white/[.04] text-slate-200 hover:border-cinema-300/30 hover:bg-cinema-300/10'}`}>
              {tracked ? <BellRing className="h-3.5 w-3.5" /> : <BellPlus className="h-3.5 w-3.5" />}{tracked ? 'Tracking' : 'Track Studio'}
            </button> : <a href="/sign-in" className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-xs font-bold text-slate-200">Sign In To Track</a>}
          </article>;
        })}
      </div>}
      <p className="text-[11px] leading-5 text-slate-500">Tracking a publisher adds it to your Cinema circle so you can find its updates more easily. Only available publisher information is shown.</p>
    </section>
  );
}

export function DiscoverPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 pb-8 sm:px-6 lg:space-y-10 lg:px-10">
      <header className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_top_right,rgba(170,190,182,.075),transparent_55%),linear-gradient(135deg,#111715,#070909_72%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,.26)] sm:p-8">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/[.035] blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-emerald-100/[.025] blur-3xl" />
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

      <ExploreTimeline />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Explore Cinema categories">
        <a href="/movies" className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1421] p-5 transition hover:-translate-y-1 hover:border-sky-200/35"><img src="https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-50" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101d]/95 via-[#07101d]/65 to-transparent" /><Film className="h-5 w-5 text-sky-200" /><h3 className="mt-5 text-lg font-extrabold text-white">Movies</h3><p className="mt-1 text-xs text-slate-300">Films From Every Corner</p></a>
        <a href="/series" className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1421] p-5 transition hover:-translate-y-1 hover:border-sky-200/35"><img src="https://image.tmdb.org/t/p/w500/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-50" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101d]/95 via-[#07101d]/65 to-transparent" /><Tv className="h-5 w-5 text-sky-200" /><h3 className="mt-5 text-lg font-extrabold text-white">Series</h3><p className="mt-1 text-xs text-slate-300">Stories That Keep Going</p></a>
        <a href="/live-tv" className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1421] p-5 transition hover:-translate-y-1 hover:border-sky-200/35"><img src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=80" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-50" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101d]/95 via-[#07101d]/65 to-transparent" /><Radio className="h-5 w-5 text-sky-200" /><h3 className="mt-5 text-lg font-extrabold text-white">Live Television</h3><p className="mt-1 text-xs text-slate-300">Channels And Live Programming</p></a>
        <a href="/sports" className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1421] p-5 transition hover:-translate-y-1 hover:border-sky-200/35"><img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900&q=85" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 transition duration-500 group-hover:scale-105 group-hover:opacity-45" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101d]/95 via-[#07101d]/65 to-transparent" /><Trophy className="h-5 w-5 text-sky-200" /><h3 className="mt-5 text-lg font-extrabold text-white">Sports</h3><p className="mt-1 text-xs text-slate-300">Live Coverage, Highlights & Replays</p></a>
        <a href="/friends" className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1421] p-5 transition hover:-translate-y-1 hover:border-sky-200/35"><img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 transition duration-500 group-hover:scale-105 group-hover:opacity-45" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101d]/95 via-[#07101d]/65 to-transparent" /><Users className="h-5 w-5 text-sky-200" /><h3 className="mt-5 text-lg font-extrabold text-white">Friends & Community</h3><p className="mt-1 text-xs text-slate-300">Discover What People Share</p></a>
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <a href="/publishers" className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-sky-400/[.10] to-white/[.02] p-5 transition hover:border-sky-200/30"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-200/20 bg-sky-300/10 text-sky-100"><BadgeCheck className="h-6 w-6" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Verified Studios & Publishers</span><span className="mt-1 block text-xs text-slate-400">Track official entertainment destinations.</span></span></a>
        <a href="/friends" className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-400/[.10] to-white/[.02] p-5 transition hover:border-sky-200/30"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-indigo-200/20 bg-indigo-300/10 text-indigo-100"><Flame className="h-6 w-6" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">What Your Circle Is Watching</span><span className="mt-1 block text-xs text-slate-400">Find conversations and shared favourites.</span></span></a>
      </section>

      <DailyDiscovery />
      <section className="grid gap-4 lg:grid-cols-2" aria-label="Seasonal collections">
        <CinemaSeasonalSpotlight mediaType="movie" />
        <CinemaSeasonalSpotlight mediaType="tv" />
      </section>
      <ExploreStudioTracker />

      <section className="space-y-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cinema-300">Explore The Catalogue</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Stories worth your time</h2><p className="mt-1 text-sm text-slate-400">Useful recommendations with a direct path to each movie or series.</p></div>
        <TmdbRow heading="Trending movies" description="Films audiences are exploring right now." mediaType="movie" list="trending" />
        <TmdbRow heading="Trending series" description="Series creating a buzz." mediaType="tv" list="trending" />
        <TmdbRow heading="Popular movies" description="More films to add to your watchlist." mediaType="movie" list="popular" />
        <TmdbRow heading="Popular series" description="Discover your next series." mediaType="tv" list="popular" />
        <TmdbRow heading="Action & Adventure" description="Big journeys, bold heroes and high-energy stories." mediaType="movie" list="trending" genreId={28} />
        <TmdbRow heading="Comedy Picks" description="Find something lighter to enjoy." mediaType="movie" list="popular" genreId={35} />
        <TmdbRow heading="Animation & Family Stories" description="Animated worlds and stories for every age." mediaType="movie" list="popular" genreId={16} />
        <TmdbRow heading="Documentaries" description="Explore real people, places and ideas." mediaType="movie" list="popular" genreId={99} />
        <TmdbRow heading="Drama Series" description="Character-led stories worth discovering." mediaType="tv" list="popular" genreId={18} />
      </section>
    </div>
  );
}
