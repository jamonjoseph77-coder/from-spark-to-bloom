import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BUTTON_SECONDARY, INPUT } from '@/components/ui/styles';
import { navigateTo } from '@/lib/router';

export function TopBar() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    navigateTo(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/5 bg-ink-950/85 px-4 backdrop-blur-xl sm:gap-4 sm:px-6 lg:px-10">
      <a href="/" className="shrink-0 lg:hidden" aria-label="Cinema home">
        <span className="flex flex-col items-start gap-0.5"><img src="/cinema-wordmark.png" alt="Cinema" className="h-7 w-auto max-w-[142px] object-contain" /><span className="text-[7px] font-semibold uppercase tracking-[0.2em] text-cinema-300/80">Experience the world of stories</span></span>
      </a>

      <form role="search" onSubmit={handleSearch} className="flex w-full max-w-xl items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="global-cinema-search" className="sr-only">Search Cinema</label>
          <input
            id="global-cinema-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('');
            }}
            placeholder="Search movies, series, sports..."
            aria-label="Search Cinema"
            className={`${INPUT} !rounded-full py-2.5 pl-11 pr-4 text-sm shadow-inner shadow-black/20 focus:border-cinema-300/60 focus:ring-cinema-300/20`}
          />
        </div>
        <button
          type="submit"
          aria-label="Submit search"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-cinema-200/20 bg-cinema-500 px-4 text-sm font-bold text-white shadow-lg shadow-cinema-950/30 transition hover:border-cinema-100/40 hover:bg-cinema-400 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-200 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <a
            href="/profile"
            aria-label="Your profile"
            title={user.email ?? 'Your profile'}
            className="grid h-10 w-10 place-items-center rounded-full bg-cinema-600 text-sm font-extrabold uppercase text-white ring-2 ring-cinema-400/30 transition hover:bg-cinema-500"
          >
            {(user.email?.charAt(0) ?? '?').toUpperCase()}
          </a>
        ) : (
          <a href="/sign-in" className={`${BUTTON_SECONDARY} rounded-full px-4 py-2`}>
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
