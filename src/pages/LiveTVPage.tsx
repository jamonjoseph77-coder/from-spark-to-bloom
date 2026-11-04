import { useMemo, useState } from 'react';
import { Radio, Search, Signal, TvMinimalPlay } from 'lucide-react';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { KeepUpButton } from '@/components/social/KeepUpButton';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { CHIP_BASE, INPUT, LABEL, PAGE_CONTAINER, chipClass } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchPublishedTitles } from '@/lib/library';
import { genresOf, hasGenre, matchesQuery } from '@/lib/catalogue';
import type { Title } from '@/lib/types';

const ALL_CHANNELS = 'All Channels';

export function LiveTVPage() {
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
  const channels = useMemo(() => (titles ?? []).filter((title) => title.type === 'live'), [titles]);
  const playable = useMemo(() => channels.filter((channel) => channel.playback_url.trim().length > 0), [channels]);
  const genres = useMemo(() => genresOf(channels), [channels]);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState(ALL_CHANNELS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(
    () => channels.filter((channel) =>
      (genre === ALL_CHANNELS || hasGenre(channel, genre)) && matchesQuery(channel, query),
    ),
    [channels, genre, query],
  );
  const selected = useMemo(
    () => playable.find((channel) => channel.id === selectedId) ?? null,
    [playable, selectedId],
  );

  function chooseChannel(channel: Title) {
    if (!channel.playback_url.trim()) return;
    setSelectedId(channel.id);
  }

  return (
    <div className={`${PAGE_CONTAINER} cinema-live-tv space-y-7`}>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#151b1a] via-[#0d1111] to-[#101a18] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-300/[.08] blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-72 rounded-full bg-slate-200/[.07] blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-emerald-100/[.07] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-100">
              <Signal className="h-3.5 w-3.5" /> Television, Together
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.2rem] border border-white/15 bg-white/[.07] text-slate-100 shadow-[0_10px_32px_rgba(0,0,0,.28)]">
                <TvMinimalPlay className="h-7 w-7" strokeWidth={1.65} />
              </span>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Live TV</h1>
                <p className="mt-1 text-sm text-slate-300">Your Channels. One Cinema Experience.</p>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">Explore television channels and open linked streams directly in Cinema. Channel access depends on the stream and viewing rights available to Cinema.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <p className="text-2xl font-black tabular-nums text-white">{channels.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Channels</p>
            </div>
            <div className="rounded-2xl border border-emerald-100/15 bg-emerald-100/[.06] px-4 py-3">
              <p className="text-2xl font-black tabular-nums text-emerald-100">{playable.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Linked Streams</p>
            </div>
          </div>
        </div>
      </header>

      {!titles && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}

      {titles && channels.length > 0 && (
        <section className="space-y-4" aria-label="Live television player">
          {selected ? (
            <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0b0f0e] p-3 shadow-[0_24px_70px_rgba(0,0,0,.34)] sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-100"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.7)]" /> Now Selected</p>
                  <h2 className="mt-1 truncate text-lg font-extrabold text-white">{selected.title}</h2>
                  <p className="text-xs text-slate-400">{selected.publisher || 'Cinema Channel'}{selected.genre ? ` · ${selected.genre}` : ''}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selected.publisher && <KeepUpButton publisherName={selected.publisher} />}
                  <button type="button" onClick={() => setSelectedId(null)} className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-white/30 hover:bg-white/[.06]">Close Player</button>
                </div>
              </div>
              <VideoPlayer key={selected.id} src={selected.playback_url} title={selected.title} poster={selected.backdrop_url || selected.poster_url || undefined} isLive autoPlay layout="landscape" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[1.7rem] border border-dashed border-white/15 bg-white/[.025] px-5 py-9 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-100/15 bg-emerald-100/[.06] text-emerald-100"><TvMinimalPlay className="h-7 w-7" /></span>
              <h2 className="mt-4 text-lg font-extrabold text-white">Choose A Channel</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-400">Select a channel below to open the Cinema player. Playback controls adapt to your screen.</p>
            </div>
          )}
        </section>
      )}

      {titles && channels.length > 0 && (
        <section className="space-y-4" aria-label="Browse live TV channels">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-100/80">The Channel Line-Up</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Explore Channels</h2></div>
            <div className="w-full sm:max-w-xs"><label htmlFor="live-tv-search" className={LABEL}>Find A Channel</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="live-tv-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Channels" className={`${INPUT} pl-10`} /></div></div>
          </div>
          {genres.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter channels by category">{[ALL_CHANNELS, ...genres].map((item) => <button key={item} type="button" aria-pressed={genre === item} onClick={() => setGenre(item)} className={`${CHIP_BASE} shrink-0 ${chipClass(genre === item)}`}>{item}</button>)}</div>}
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[.025] p-7 text-center text-sm text-slate-400">No Channels Match This Search. Try Another Name Or Category.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {visible.map((channel) => {
                const ready = Boolean(channel.playback_url.trim());
                const active = selected?.id === channel.id;
                return (
                  <button key={channel.id} type="button" onClick={() => chooseChannel(channel)} disabled={!ready} aria-pressed={active} className={`group min-w-0 overflow-hidden rounded-[1.35rem] border text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-75 ${active ? 'border-emerald-200/55 bg-emerald-100/[.08] shadow-[0_12px_36px_rgba(74,222,128,.08)]' : 'border-white/10 bg-white/[.025] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[.05]'}`}>
                    <div className="relative aspect-video overflow-hidden bg-[#101514]">
                      <Artwork src={channel.backdrop_url || channel.poster_url} alt="" fallbackTitle={channel.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
                      <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md ${ready ? 'border-emerald-100/25 bg-black/65 text-emerald-100' : 'border-white/15 bg-black/65 text-slate-300'}`}>
                        {ready ? <><Radio className="h-3 w-3" /> Stream Linked</> : 'Coming Soon'}
                      </span>
                      {active && <span className="absolute bottom-2 right-2 rounded-full bg-emerald-200 px-2 py-1 text-[9px] font-black uppercase text-[#07100d]">Selected</span>}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="line-clamp-1 text-sm font-extrabold text-white">{channel.title}</p>
                      <p className="line-clamp-1 text-[11px] text-slate-400">{channel.publisher || channel.genre || 'Television Channel'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {titles && channels.length === 0 && (
        <EmptyState icon={<TvMinimalPlay className="h-7 w-7 text-emerald-100" />} title="Your Live TV Line-Up Is Being Prepared" description="Cinema will show channels here as authorised broadcaster streams and programme information become available." />
      )}
      {titles && channels.length > 0 && playable.length === 0 && <p className="rounded-2xl border border-amber-200/10 bg-amber-100/[.04] p-4 text-xs leading-5 text-slate-400">Channels Can Be Listed Before Their Streams Are Connected. Cinema Will Only Start Playback When A Valid Channel Stream Has Been Added.</p>}
    </div>
  );
}
