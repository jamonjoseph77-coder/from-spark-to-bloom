export function TmdbAttribution() {
  return (
    <section aria-labelledby="tmdb-credit-heading" className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-ink-850/60 p-5 sm:flex-row sm:items-center">
      <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" aria-label="The Movie Database website" className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25 p-3">
        <img src="https://www.themoviedb.org/assets/2/v4/logos/stacked-white.svg" alt="The Movie Database logo" loading="lazy" className="h-12 w-auto max-w-[9rem] object-contain" />
      </a>
      <div className="min-w-0">
        <h2 id="tmdb-credit-heading" className="text-sm font-bold text-white">Movie And Television Data</h2>
        <p className="mt-1 text-xs leading-6 text-slate-300">
          Movie and television metadata and artwork in Cinema are provided by The Movie Database (TMDB).
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </section>
  );
}
