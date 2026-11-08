import { Compass, Home, Clapperboard, Trophy, TvMinimalPlay, Users, type LucideIcon } from 'lucide-react';
import { navKeyOf } from '@/components/layout/navigation';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import type { Route } from '@/lib/router';

interface MobileNavProps { route: Route }
type NavItem = { key: string; label: string; href: string; icon: LucideIcon };

const LEFT_ITEMS = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'discover', label: 'Explore', href: '/discover', icon: Compass },
  { key: 'friends', label: 'Friends', href: '/friends', icon: Users },
];

const RIGHT_ITEMS = [
  { key: 'live-tv', label: 'Live TV', href: '/live-tv', icon: TvMinimalPlay },
  { key: 'sports', label: 'Sports', href: '/sports', icon: Trophy },
  { key: 'my-cinema', label: 'My Cinema', href: '/my-cinema', icon: Clapperboard },
];

export function MobileNav({ route }: MobileNavProps) {
  const activeKey = navKeyOf(route);
  const cinemaActive = route.name === 'home';
  const homeContextActive = route.name === 'category';

  const renderItems = (items: NavItem[]) => items.map((item) => {
    const active = item.key === activeKey || (item.key === 'home' && homeContextActive);
    const Icon = item.icon;
    return (
      <li key={item.key} className="flex h-full min-w-0 flex-1 items-center justify-center">
        <a href={item.href} aria-current={active ? 'page' : undefined} className={`cinema-mobile-nav-item relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${active ? 'text-[#f1f4f8]' : 'text-[#aeb8c4] hover:text-[#f1f4f8]'}`}>
          <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={active ? 2.3 : 1.8} />
          <span className="max-w-full truncate whitespace-nowrap text-[9px] font-semibold leading-none">{item.label}</span>
          {active && <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-[#168cff]" />}
        </a>
      </li>
    );
  });

  return (
    <nav aria-label="Primary" className="cinema-mobile-nav fixed inset-x-2 bottom-1 z-40 rounded-[1.45rem] border border-white/[.14] pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid h-[76px] max-w-xl grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] items-center px-1">
        <ul className="flex h-full min-w-0 items-center justify-around">
          {renderItems(LEFT_ITEMS)}
        </ul>
        <div className="h-full" aria-hidden="true" />
        <ul className="flex h-full min-w-0 items-center justify-around">
          {renderItems(RIGHT_ITEMS)}
        </ul>
      </div>
      <a
        href="/"
        aria-label="Cinema Home"
        aria-current={cinemaActive ? 'page' : undefined}
        className={`cinema-mobile-home-button absolute left-1/2 top-[-17px] flex h-[76px] w-[76px] -translate-x-1/2 items-center justify-center rounded-full transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8d6c2] ${cinemaActive ? 'is-active' : 'hover:scale-[1.04]'}`}
      >
        <span className="cinema-mobile-home-halo" aria-hidden="true" /><CinemaLogo compact className="relative z-10 !h-[62px] !w-[62px] rounded-full border border-white/[.2] bg-[#101712] object-cover shadow-[0_7px_24px_rgba(0,0,0,.52)]" />
        <span className="sr-only">Cinema Home</span>
      </a>
    </nav>
  );
}
