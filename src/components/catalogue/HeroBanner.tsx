import { useEffect, useState } from 'react';
import { Info, Pause, Play } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/ui/styles';
import { titleHref, titleMeta } from '@/lib/catalogue';
import type { Title } from '@/lib/types';

const ROTATE_MS = 7000;

export function HeroBanner({ titles }: { titles: Title[] }) {
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = titles.length;
  const paused = hoverPaused || manualPaused || reducedMotion;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  const current = titles[index % Math.max(count, 1)];
  if (!current) return null;

  const primaryLabel = current.type === 'live' ? 'Watch live' : current.type === 'series' ? 'View episodes' : 'Play';

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured titles"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      className="group relative isolate h-[28rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090c0b] shadow-[0_28px_90px_rgba(0,0,0,.48)] sm:h-[34rem] sm:rounded-[2rem]"
    >
      <Artwork
        key={current.id}
        src={current.backdrop_url || current.poster_url}
        alt=""
        fallbackTitle={current.title}
        className="absolute inset-0 h-full w-full scale-[1.015] animate-fade-in object-cover object-center transition-transform duration-[9000ms] group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#030605] via-[#030605]/85 via-45% to-[#030605]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030605] via-[#030605]/25 to-transparent" />

      <div key={`copy-${current.id}`} className="relative flex h-full max-w-2xl flex-col justify-end gap-4 p-5 pb-16 sm:justify-center sm:p-10 lg:p-14">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/20 bg-white/[.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-100">Featured</span>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{titleMeta(current)}</p>
        </div>
        <h1 className="max-w-xl text-3xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,.55)] sm:text-5xl lg:text-6xl">{current.title}</h1>
        {current.synopsis && <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">{current.synopsis}</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          <a href={titleHref(current)} className={BUTTON_PRIMARY}><Play className="h-4 w-4 fill-current" />{primaryLabel}</a>
          <a href={`/title/${current.id}`} className={BUTTON_SECONDARY}><Info className="h-4 w-4" />More info</a>
        </div>
      </div>

      {count > 1 && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 sm:bottom-7 sm:right-7">
          <button type="button" onClick={() => setManualPaused((value) => !value)} aria-label={paused ? 'Resume featured titles' : 'Pause featured titles'} aria-pressed={manualPaused} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
            {paused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
          {titles.map((title, position) => (
            <button key={title.id} type="button" onClick={() => setIndex(position)} aria-label={`Show ${title.title}`} aria-current={position === index ? 'true' : undefined} className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${position === index ? 'w-8 bg-white' : 'w-3 bg-white/30 hover:bg-white/60'}`} />
          ))}
        </div>
      )}
    </section>
  );
}
