import { useMemo, useState } from 'react';
import { Activity, ArrowRight, CalendarClock, CalendarDays, Radio, Search, Trophy, Tv } from 'lucide-react';
import { TitleGrid } from '@/components/catalogue/TitleGrid';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { CinemaSeasonalSpotlight } from '@/components/catalogue/CinemaSeasonalSpotlight';
import { YourNextWatch } from '@/components/catalogue/YourNextWatch';
import { SportsHighlights } from '@/components/sports/SportsHighlights';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { CHIP_BASE, INPUT, LABEL, PAGE_CONTAINER, chipClass } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useLibrary } from '@/hooks/useLibrary';
import { fetchPublishedTitles } from '@/lib/library';
import { genresOf, matchesQuery } from '@/lib/catalogue';
import type { Title } from '@/lib/types';
import { Artwork } from '@/components/ui/Artwork';

const ALL_SPORTS = 'All Sports';

function isLiveChannel(title: Title): boolean {
  return Boolean(title.playback_url?.trim()) && /live|on air|live now/i.test(title.availability ?? '');
}

function isSportsChannel(title: Title): boolean {
  return /channel|broadcaster|sports tv/i.test(title.availability ?? '') || /sports channel/i.test(title.genre ?? '');
}

export function SportsPage() {
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
  const { watchlistIds, favouriteIds } = useLibrary();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_SPORTS);

  const sections = useMemo(() => {
    const sports = (titles ?? []).filter((title) => title.type === 'sport');
    const today = new Date().toISOString().slice(0, 10);
    const liveChannels = (titles ?? []).filter((title) =>
      title.type === 'live' &&
      /sport/i.test(`${title.title} ${title.genre ?? ''} ${title.availability ?? ''} ${title.publisher ?? ''}`) &&
      Boolean(title.playback_url?.trim()),
    );
    const liveNow = [...sports.filter(isLiveChannel), ...liveChannels];
    const startingSoon = sports.filter((title) => Boolean(title.release_date && title.release_date > today));
    const channels = [...sports.filter(isSportsChannel), ...liveChannels];
    const highlights = sports.filter((title) => !isLiveChannel(title) && !isSportsChannel(title) && Boolean(title.playback_url?.trim() || title.trailer_url?.trim()));
    const yourSports = sports.filter((title) => watchlistIds.has(title.id) || favouriteIds.has(title.id));
    return { sports, liveNow, startingSoon, channels, highlights, yourSports, genres: genresOf(sports) };
  }, [titles, watchlistIds, favouriteIds]);

  const visible = useMemo(
    () => sections.sports.filter((title) => (category === ALL_SPORTS || (title.genre ?? '').split(',').map((item) => item.trim()).includes(category)) && matchesQuery(title, query)),
    [sections.sports, category, query],
  );

  return (
    <div className={`${PAGE_CONTAINER} cinema-sports space-y-9 pb-16`}>
      <header className="relative isolate overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#080c13] px-5 py-7 shadow-[0_22px_70px_rgba(0,0,0,.28)] sm:px-8 sm:py-9">
        {(sections.sports[0]?.backdrop_url || sections.sports[0]?.poster_url) && <Artwork src={sections.sports[0].backdrop_url || sections.sports[0].poster_url} alt="" fallbackTitle="Sports" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-[.24]" />}
        {(sections.sports[0]?.backdrop_url || sections.sports[0]?.poster_url) && <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#030407]/95 via-[#030407]/80 to-[#030407]/48" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#030407]/95 via-[#030407]/80 to-[#030407]/45" />
        <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-white/[.035] blur-3xl" />
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.24em] text-slate-200"><Trophy className="h-4 w-4 text-slate-200" /> The Sports Destination</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Your Sports. All In Cinema.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Follow the competitions, channels and moments that matter. Move from live coverage to highlights and replays in one place.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#sports-live" className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-[#edf0ef] px-4 py-2.5 text-xs font-extrabold text-[#080b0a] shadow-[0_8px_24px_rgba(0,0,0,.22)] transition hover:bg-white">Live Coverage <ArrowRight className="h-3.5 w-3.5" /></a>
            <a href="#sports-highlights" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm">Highlights & Replays</a>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-5 border-t border-white/10 pt-4 text-xs text-slate-300">
          <span className="inline-flex items-center gap-2"><Radio className="h-4 w-4 text-sky-300" /> Live Coverage</span>
          <span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-sky-300" /> Upcoming Events</span>
          <span className="inline-flex items-center gap-2"><Activity className="h-4 w-4 text-sky-300" /> Highlights & Replays</span>
        </div>
      </header>

      <YourNextWatch titleTypes={['sport']} categoryLabel="Sports" />
      <CinemaSeasonalSpotlight categoryLabel="Sports" />

      {!titles && (error ? <ErrorState onRetry={reload} /> : <LoadingState label="Loading Sports On Cinema" />)}

      {titles && (
        <>
          <section id="sports-live" className="space-y-4 scroll-mt-24">
            <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-200">Live Now</p><h2 className="mt-1 text-2xl font-extrabold text-white">Live Sports Coverage</h2><p className="mt-1 text-sm text-slate-400">Playable sports streams published by Cinema.</p></div><span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-[10px] font-bold text-slate-300">{sections.liveNow.length} Available</span></div>
            {sections.liveNow.length ? <TitleGrid titles={sections.liveNow} /> : <p className="rounded-2xl border border-white/10 bg-white/[.02] px-4 py-5 text-sm text-slate-400">No verified live sports streams are published right now. Connected broadcaster streams will appear here when available.</p>}
          </section>


          <section className="grid gap-3 md:grid-cols-2" aria-label="Official Ghana sports sources">
            <a href="https://gpl.com.gh/fixtures" target="_blank" rel="noreferrer" className="group rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-sky-200/30 hover:bg-white/[.04]">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-sky-200">Official Ghana Competition</p>
              <h2 className="mt-2 text-lg font-extrabold text-white">Ghana Premier League Fixtures</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">Open the league’s official fixture list for matchweeks, dates, kick-off times and venues.</p>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-sky-200">View Official Fixtures <ArrowRight className="h-3.5 w-3.5" /></span>
            </a>
            <a href="https://gpl.com.gh/" target="_blank" rel="noreferrer" className="group rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-sky-200/30 hover:bg-white/[.04]">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-sky-200">League News & Media</p>
              <h2 className="mt-2 text-lg font-extrabold text-white">Ghana Premier League</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">Follow official league announcements, clubs, videos and competition updates.</p>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-sky-200">Open League Website <ArrowRight className="h-3.5 w-3.5" /></span>
            </a>
          </section>
          <section className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/20 bg-sky-300/[.08] text-sky-200"><Activity className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Scores & Fixtures</p><h2 className="text-lg font-extrabold text-white">Live Scores</h2></div></div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">The scoreboard area is ready for a verified sports data provider. Live scores, match clocks and fixtures will only appear when a reliable feed is connected — Cinema will not show invented results.</p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300"><CalendarDays className="h-3.5 w-3.5" /> Fixtures Feed Not Connected</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/20 bg-sky-300/[.08] text-sky-200"><CalendarClock className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Starting Soon</p><h2 className="text-lg font-extrabold text-white">Upcoming Sports</h2></div></div>
              <p className="mt-3 text-3xl font-black tabular-nums text-white">{sections.startingSoon.length}</p><p className="text-xs text-slate-400">Future-dated sports programmes and events in Cinema.</p>
              {sections.startingSoon.length > 0 && <a href="#sports-catalogue" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-sky-200">See Upcoming <ArrowRight className="h-3.5 w-3.5" /></a>}
            </div>
          </section>

          {sections.yourSports.length > 0 && <TitleRow heading="Your Sports" description="Sports titles saved to your Cinema watchlist or favourites." titles={sections.yourSports} />}
          {sections.startingSoon.length > 0 && <TitleRow heading="Starting Soon" description="Upcoming sports content with a published future date." titles={sections.startingSoon} />}
          {sections.channels.length > 0 && <section><div className="mb-3 flex items-end gap-3"><Tv className="h-5 w-5 text-sky-300" /><div><h2 className="text-xl font-extrabold text-white">Sports Channels</h2><p className="text-xs text-slate-400">Sports broadcasters and channels available in Cinema.</p></div></div><TitleGrid titles={sections.channels} /></section>}
          <section id="sports-highlights" className="scroll-mt-24 space-y-6">
            <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">The Best Moments</p><h2 className="text-2xl font-extrabold text-white">Highlights & Replays</h2><p className="text-sm text-slate-400">Catch up on sports programmes, official video features and playable replays published in Cinema.</p></div>
            <SportsHighlights />
            {sections.highlights.length > 0 ? <TitleRow heading="Sports Programmes & Replays" description="Playable sports titles available to watch in Cinema." titles={sections.highlights} /> : <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5"><h3 className="text-base font-bold text-white">More Match Moments Are On Their Way</h3><p className="mt-2 text-sm text-slate-400">Playable sports programmes and replays will appear here as verified publishers add them to Cinema.</p></div>}
          </section>

          <section id="sports-catalogue" className="space-y-4 scroll-mt-24">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">Explore By Sport</p><h2 className="mt-1 text-2xl font-extrabold text-white">Sports On Cinema</h2><p className="mt-1 text-sm text-slate-400">Browse published sports content and programmes.</p></div><div className="w-full sm:max-w-xs"><label htmlFor="sports-search" className={LABEL}>Find Sports Content</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="sports-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams, competitions or programmes" className={`${INPUT} pl-10`} /></div></div></div>
            {sections.genres.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter sports by category"><button type="button" aria-pressed={category === ALL_SPORTS} onClick={() => setCategory(ALL_SPORTS)} className={`${CHIP_BASE} shrink-0 ${chipClass(category === ALL_SPORTS)}`}>{ALL_SPORTS}</button>{sections.genres.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`${CHIP_BASE} shrink-0 ${chipClass(category === item)}`}>{item}</button>)}</div>}
            {sections.sports.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-7 text-center text-sm text-slate-400">Sports content will appear here as verified broadcasters and publishers add it to Cinema.</p> : visible.length === 0 ? <p className="rounded-2xl border border-white/10 bg-white/[.02] p-7 text-center text-sm text-slate-400">No sports content matches this search. Try another name or category.</p> : <><p className="text-xs text-slate-500">{visible.length} {visible.length === 1 ? 'title' : 'titles'}</p><TitleGrid titles={visible} /></>}
          </section>
        </>
      )}
    </div>
  );
}
