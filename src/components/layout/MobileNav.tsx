import { Compass, Home, Clapperboard, Film, Trophy, TvMinimalPlay } from 'lucide-react';
import { navKeyOf } from '@/components/layout/navigation';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import type { Route } from '@/lib/router';

interface MobileNavProps { route: Route }

const ITEMS = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'discover', label: 'Explore', href: '/discover', icon: Compass },
  { key: 'cinema', label: 'Cinema', href: '/movies', icon: Film },
  { key: 'live-tv', label: 'Live TV', href: '/live-tv', icon: TvMinimalPlay },
  { key: 'sports', label: 'Sports', href: '/sports', icon: Trophy },
  { key: 'my-cinema', label: 'My Cinema', href: '/my-cinema', icon: Clapperboard },
];

export function MobileNav({ route }: MobileNavProps) {
  const activeKey = route.name === 'browse' && route.kind === 'movie' ? 'cinema' : navKeyOf(route);
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.08] bg-[#030407]/[.98] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_32px_rgba(0,0,0,.38)] backdrop-blur-2xl lg:hidden">
      <ul className="mx-auto grid h-[76px] max-w-xl grid-cols-6 items-center gap-0 px-1">
        {ITEMS.map((item) => {
          const active = item.key === activeKey;
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex h-full items-center justify-center">
              <a href={item.href} aria-current={active ? 'page' : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168cff] ${active ? 'text-[#f1f4f8]' : 'text-[#aeb8c4] hover:text-[#f1f4f8]'}`}>
                {item.key === 'cinema'
                  ? <CinemaLogo compact className={`!h-[52px] !w-[52px] rounded-full object-cover transition duration-200 ${active ? 'scale-105 opacity-100' : 'opacity-85 hover:opacity-100'}`} />
                  : <Icon className={`h-[22px] w-[22px] transition ${active ? 'text-[#f1f4f8]' : ''}`} strokeWidth={active ? 2.3 : 1.8} />}
                <span className="max-w-full truncate text-[9px] font-semibold leading-none">{item.label}</span>
                {active && item.key !== 'cinema' && <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-[#168cff]" />}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
