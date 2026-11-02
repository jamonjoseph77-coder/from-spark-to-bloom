import { Compass, Home, Tv, Clapperboard } from 'lucide-react';
import { navKeyOf } from '@/components/layout/navigation';
import type { Route } from '@/lib/router';

interface MobileNavProps { route: Route }

const ITEMS = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'discover', label: 'Explore', href: '/discover', icon: Compass },
  { key: 'cinema', label: 'Cinema', href: '/movies', icon: null },
  { key: 'live-tv', label: 'Live TV', href: '/live-tv', icon: Tv },
  { key: 'my-cinema', label: 'My Cinema', href: '/my-cinema', icon: Clapperboard },
];

export function MobileNav({ route }: MobileNavProps) {
  const activeKey = route.name === 'browse' && route.kind === 'movie' ? 'cinema' : navKeyOf(route);
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.08] bg-[#040812]/[.97] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_32px_rgba(0,0,0,.42)] backdrop-blur-2xl lg:hidden">
      <ul className="mx-auto grid h-[68px] max-w-xl grid-cols-5 items-center gap-0 px-1">
        {ITEMS.map((item) => {
          const active = item.key === activeKey;
          const Icon = item.icon;
          if (item.key === 'cinema') {
            return (
              <li key={item.key} className="flex h-full items-center justify-center">
                <a
                  href={item.href}
                  aria-label="Cinema catalogue — browse movies"
                  aria-current={active ? 'page' : undefined}
                  className={`group flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1 transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300 ${active ? 'bg-sky-300/[.09]' : 'hover:bg-white/[.045]'}`}
                >
                  <img
                    src="/cinema-icon.png"
                    alt=""
                    className={`h-[43px] w-[43px] rounded-full object-cover transition duration-300 group-hover:scale-[1.04] ${active ? 'drop-shadow-[0_0_13px_rgba(56,160,255,.48)]' : 'drop-shadow-[0_3px_9px_rgba(0,0,0,.42)]'}`}
                  />
                  <span className={`text-[9px] font-extrabold tracking-[.04em] ${active ? 'text-sky-100' : 'text-slate-400 group-hover:text-white'}`}>Cinema</span>
                </a>
              </li>
            );
          }
          return (
            <li key={item.key} className="flex h-full items-center justify-center">
              <a href={item.href} aria-current={active ? 'page' : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300 ${active ? 'text-sky-200' : 'text-slate-500 hover:text-slate-100'}`}>
                {Icon && <Icon className={`h-[20px] w-[20px] transition ${active ? 'drop-shadow-[0_0_8px_rgba(74,165,255,.75)]' : ''}`} strokeWidth={active ? 2.4 : 1.8} />}
                <span className="max-w-full truncate text-[9px] font-semibold leading-none">{item.label}</span>
                {active && <span className="absolute -bottom-1 h-0.5 w-5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,.8)]" />}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
