import { Info } from 'lucide-react';

export function TmdbAttribution() {
  return (
    <p className="flex items-start gap-3 rounded-2xl border border-white/10 bg-ink-850/60 p-5 text-xs leading-relaxed text-slate-400">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-cinema-300" aria-hidden="true" />
      <span>
        Movie and series information, posters and descriptions are provided by TMDB (The Movie Database). This product uses the TMDB API
        but is not endorsed or certified by TMDB. Cinema shows this information only; it does not stream these titles unless they are
        separately licensed and listed as available on Cinema.
      </span>
    </p>
  );
}
