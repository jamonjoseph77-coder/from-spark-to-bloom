import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import { BUTTON_SECONDARY, INPUT } from '@/components/ui/styles';
import { navigateTo } from '@/lib/router';

export function TopBar() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateTo(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/5 bg-ink-950/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <a href="/" className="shrink-0 lg:hidden" aria-label="Cinema home">
        <span className="flex flex-col items-start gap-0.5"><img src="/cinema-wordmark.png" alt="Cinema" className="h-7 w-auto max-w-[142px] object-contain" /><span className="text-[7px] font-semibold uppercase tracking-[0.2em] text-cinema-300/80">Experience the world of stories</span></span>
      </a>

      <form role="search" onSubmit={handleSearch} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search movies, series, sports..."
          aria-label="Search Cinema"
          className={`${INPUT} py-2.5 pl-11`}
        />
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
          <a href="/sign-in" className={`${BUTTON_SECONDARY} px-4 py-2`}>
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
