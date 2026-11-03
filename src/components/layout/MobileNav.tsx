import { Compass, Home, Tv, Clapperboard, Film } from 'lucide-react';
import { navKeyOf } from '@/components/layout/navigation';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import type { Route } from '@/lib/router';
interface MobileNavProps { route: Route }
const ITEMS = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'discover', label: 'Explore', href: '/discover', icon: Compass },
  { key: 'cinema', label: 'Cinema', href: '/movies', icon: Film },
  { key: 'live-tv', label: 'Live TV', href: '/live-tv', icon: Tv },
  { key: 'my-cinema', label: 'My Cinema', href: '/my-cinema', icon: Clapperboard },
];
export function MobileNav({ route }: MobileNavProps) {
  const activeKey = route.name === 'browse' && route.kind === 'movie' ? 'cinema' : navKeyOf(route);
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.08] bg-[#040812]/[.97] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_32px_rgba(0,0,0,.38)] backdrop-blur-2xl lg:hidden">
      <ul className="mx-auto grid h-[76px] max-w-xl grid-cols-5 items-center gap-0 px-1">
        {ITEMS.map((item) => {
          const active = item.key === activeKey;
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex h-full items-center justify-center">
              <a href={item.href} aria-current={active ? 'page' : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300 ${active ? 'text-sky-100' : 'text-slate-500 hover:text-slate-100'}`}>
                {item.key === 'cinema' ? <span className={`grid h-[50px] w-[50px] place-items-center rounded-full border bg-gradient-to-br from-[#1a2a40] via-[#0d1727] to-[#070c15] shadow-[0_7px_26px_rgba(0,0,0,.48)] ring-1 transition duration-200 ${active ? 'scale-[1.04] border-sky-200/50 ring-sky-200/20 shadow-[0_0_24px_rgba(95,165,245,.22)]' : 'border-white/15 ring-white/[.06] hover:border-sky-200/30'}`}><CinemaLogo compact /></span> : <Icon className={`h-[22px] w-[22px] transition ${active ? 'text-cinema-200' : ''}`} strokeWidth={active ? 2.3 : 1.8} />}
                <span className="max-w-full truncate text-[9px] font-semibold leading-none">{item.label}</span>
                {active && <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-sky-300" />}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
