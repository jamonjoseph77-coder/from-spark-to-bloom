import { useEffect, useState } from 'react';
import { Info, Play } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/ui/styles';
import { titleHref, titleMeta } from '@/lib/catalogue';
import type { Title } from '@/lib/types';

const ROTATE_MS = 7000;

export function HeroBanner({ titles }: { titles: Title[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = titles.length;

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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group relative isolate h-[31rem] overflow-hidden rounded-[1.75rem] border border-sky-200/15 bg-ink-900 shadow-[0_28px_90px_rgba(0,0,0,.48)] sm:h-[36rem] sm:rounded-[2rem]"
    >
      <Artwork
        key={current.id}
        src={current.backdrop_url || current.poster_url}
        alt=""
        fallbackTitle={current.title}
        className="absolute inset-0 h-full w-full scale-[1.015] animate-fade-in object-cover object-center transition-transform duration-[9000ms] group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#030711] via-[#030711]/85 via-45% to-[#030711]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-[#030711]/25 to-transparent" />

      <div key={`copy-${current.id}`} className="relative flex h-full max-w-2xl animate-rise-in flex-col justify-end gap-4 p-6 pb-12 sm:justify-center sm:p-10 lg:p-14">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-cinema-400/40 bg-cinema-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cinema-100">
            Featured
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{titleMeta(current)}</p>
        </div>
        <h1 className="max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,.55)] sm:text-5xl lg:text-6xl">{current.title}</h1>
        {current.synopsis && (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-300 sm:text-base">{current.synopsis}</p>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          <a href={titleHref(current)} className={BUTTON_PRIMARY}>
            <Play className="h-4 w-4 fill-current" />
            {primaryLabel}
          </a>
          <a href={`/title/${current.id}`} className={BUTTON_SECONDARY}>
            <Info className="h-4 w-4" />
            More info
          </a>
        </div>
      </div>

      {count > 1 && (
        <div className="absolute bottom-6 right-6 flex items-center gap-2 sm:bottom-10 sm:right-10">
          {titles.map((title, position) => (
            <button
              key={title.id}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Show ${title.title}`}
              aria-current={position === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                position === index ? 'w-8 bg-cinema-400' : 'w-3 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
