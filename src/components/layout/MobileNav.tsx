import { useEffect, useState } from 'react';
import { Compass, Home, Clapperboard, Trophy, TvMinimalPlay, Users, type LucideIcon } from 'lucide-react';
import { navKeyOf } from '@/components/layout/navigation';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import { getAdaptiveDestination, recordAdaptiveVisit } from '@/components/layout/adaptiveNavigation';
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
  const homeContextActive = route.name === 'category';
  const [adaptiveDestination, setAdaptiveDestination] = useState(getAdaptiveDestination);

  useEffect(() => {
    setAdaptiveDestination(recordAdaptiveVisit(route));
  }, [route]);

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
        href={adaptiveDestination.href}
        aria-label={`Adaptive Cinema Shortcut. Open your most-used section: ${adaptiveDestination.label}`}
        title={adaptiveDestination.label === 'Home' ? 'Cinema Home' : `Your Most-Used: ${adaptiveDestination.label}`}
        className="cinema-mobile-home-button absolute left-1/2 top-[-11px] flex h-[64px] w-[64px] -translate-x-1/2 items-center justify-center rounded-full transition duration-200 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
      >
        <CinemaLogo compact className="!h-[62px] !w-[62px] rounded-full !border-0 !bg-transparent !drop-shadow-none !shadow-none object-cover" />
        <span className="sr-only">Open {adaptiveDestination.label}</span>
      </a>
    </nav>
  );
}
