import { Compass, Home, Clapperboard, Trophy, TvMinimalPlay } from 'lucide-react';
import { navKeyOf } from '@/components/layout/navigation';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import type { Route } from '@/lib/router';

interface MobileNavProps { route: Route }

const LEFT_ITEMS = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'discover', label: 'Explore', href: '/discover', icon: Compass },
];

const RIGHT_ITEMS = [
  { key: 'live-tv', label: 'Live TV', href: '/live-tv', icon: TvMinimalPlay },
  { key: 'sports', label: 'Sports', href: '/sports', icon: Trophy },
  { key: 'my-cinema', label: 'My Cinema', href: '/my-cinema', icon: Clapperboard },
];

export function MobileNav({ route }: MobileNavProps) {
  const activeKey = route.name === 'browse' && route.kind === 'movie' ? 'cinema' : navKeyOf(route);
  const cinemaActive = activeKey === 'cinema';

  const renderItems = (items: typeof LEFT_ITEMS[number][]) => items.map((item) => {
    const active = item.key === activeKey;
    const Icon = item.icon;
    return (
      <li key={item.key} className="flex h-full min-w-0 flex-1 items-center justify-center">
        <a href={item.href} aria-current={active ? 'page' : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168cff] ${active ? 'text-[#f1f4f8]' : 'text-[#aeb8c4] hover:text-[#f1f4f8]'}`}>
          <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={active ? 2.3 : 1.8} />
          <span className="max-w-full truncate whitespace-nowrap text-[9px] font-semibold leading-none">{item.label}</span>
          {active && <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-[#168cff]" />}
        </a>
      </li>
    );
  });

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.08] bg-[#030407]/[.98] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_32px_rgba(0,0,0,.38)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid h-[76px] max-w-xl grid-cols-[minmax(0,1fr)_68px_minmax(0,1fr)] items-center px-1">
        <ul className="flex h-full min-w-0 items-center justify-around">
          {renderItems(LEFT_ITEMS)}
        </ul>
        <div className="h-full" aria-hidden="true" />
        <ul className="flex h-full min-w-0 items-center justify-around">
          {renderItems(RIGHT_ITEMS)}
        </ul>
      </div>
      <a
        href="/movies"
        aria-label="Cinema"
        aria-current={cinemaActive ? 'page' : undefined}
        className={`absolute left-1/2 top-[-10px] flex h-[60px] w-[60px] -translate-x-1/2 items-center justify-center rounded-[21px] border border-white/[.14] bg-[#080c14] shadow-[0_6px_22px_rgba(0,0,0,.48)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168cff] ${cinemaActive ? 'ring-1 ring-[#168cff]/55' : 'hover:border-white/25'}`}
      >
        <CinemaLogo compact className="!h-[48px] !w-[48px] rounded-[16px] object-cover" />
        <span className="sr-only">Cinema</span>
      </a>
    </nav>
  );
}