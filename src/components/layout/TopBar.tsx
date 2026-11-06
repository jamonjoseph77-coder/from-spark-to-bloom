import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchProfile } from '@/lib/profiles';
import { useAuth } from '@/hooks/useAuth';
import { BUTTON_SECONDARY } from '@/components/ui/styles';
import { navigateTo } from '@/lib/router';

export function TopBar() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const { data: profile } = useAsyncData(() => user ? fetchProfile(user.id) : Promise.resolve(null), [user?.id]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) { navigateTo("/search"); return; }
    navigateTo(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  }

  return (
    <header className="cinema-topbar sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/10 bg-[#070909]/90 px-3 backdrop-blur-2xl sm:gap-4 sm:px-6 lg:px-10">
      <a href="/" className="flex h-11 w-[116px] shrink-0 items-center lg:hidden" aria-label="Cinema home">
        <img src="/cinema-wordmark.png" alt="Cinema" className="h-8 w-auto max-w-full object-contain object-left" />
      </a>
      <form role="search" onSubmit={handleSearch} className="min-w-0 w-full max-w-xl">
        <label htmlFor="global-cinema-search" className="sr-only">Search Cinema</label>
        <div className="cinema-global-search group flex min-w-0 items-center rounded-2xl border border-white/10 bg-white/[.035] p-1.5 transition focus-within:border-white/25 focus-within:bg-white/[.05] focus-within:ring-2 focus-within:ring-white/[.04]">
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
            aria-label="Search"
            title="Search"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/40 bg-gradient-to-br from-sky-500 via-cyan-500 to-cinema-500 text-white shadow-lg shadow-sky-950/35 transition hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          >
            <Search aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </form>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {user && <NotificationBell userId={user.id} />}
        {user ? (
          <a href="/profile" aria-label="Your profile" title={profile?.display_name || user.email || 'Your profile'} className="rounded-full ring-2 ring-cinema-400/30 transition hover:ring-cinema-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-200">
            <ProfileAvatar name={profile?.display_name || profile?.username || user.email || 'Cinema'} imageUrl={profile?.avatar_url} size="sm" />
          </a>
        ) : (
          <a href="/sign-in" className={`${BUTTON_SECONDARY} rounded-full px-3 py-2 text-xs sm:px-4 sm:text-sm`}>Sign In</a>
        )}
      </div>
    </header>
  );
}
