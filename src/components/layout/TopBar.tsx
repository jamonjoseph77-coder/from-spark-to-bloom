import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { BUTTON_SECONDARY } from '@/components/ui/styles';
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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/5 bg-ink-950/90 px-3 backdrop-blur-xl sm:gap-4 sm:px-6 lg:px-10">
      <a href="/" className="flex h-11 w-[116px] shrink-0 items-center lg:hidden" aria-label="Cinema home">
        <span className="flex flex-col leading-none"><span className="text-[1.45rem] font-black tracking-[-.065em] text-white">Cinema</span><span className="mt-1 whitespace-nowrap text-[7px] font-bold uppercase tracking-[.16em] text-slate-400">Experience The World Of Stories</span></span>
      </a>
      <form role="search" onSubmit={handleSearch} className="min-w-0 w-full max-w-xl">
        <label htmlFor="global-cinema-search" className="sr-only">Search Cinema</label>
        <div className="group flex min-w-0 items-center rounded-2xl border border-white/15 bg-ink-850/95 p-1.5 transition focus-within:border-cinema-300/60 focus-within:ring-2 focus-within:ring-cinema-300/15">
          <Search aria-hidden="true" className="ml-3 h-4 w-4 shrink-0 text-slate-400" />
          <input
            id="global-cinema-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Escape') setQuery(''); }}
            placeholder="Search Movies, Series, Sports..."
            aria-label="Search Cinema"
            autoComplete="off"
            enterKeyHint="search"
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            aria-label="Search"
            title="Search"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cinema-500 text-white transition hover:bg-cinema-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-200"
          >
            <Search aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </form>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {user && <NotificationBell userId={user.id} />}
        {user ? (
          <a href="/profile" aria-label="Your profile" title={user.email ?? 'Your profile'} className="grid h-10 w-10 place-items-center rounded-full bg-cinema-600 text-sm font-extrabold uppercase text-white ring-2 ring-cinema-400/30 transition hover:bg-cinema-500">
            {(user.email?.charAt(0) ?? '?').toUpperCase()}
          </a>
        ) : (
          <a href="/sign-in" className={`${BUTTON_SECONDARY} rounded-full px-3 py-2 text-xs sm:px-4 sm:text-sm`}>Sign In</a>
        )}
      </div>
    </header>
  );
}
