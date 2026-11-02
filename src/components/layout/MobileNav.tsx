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
      <ul className="mx-auto grid h-[62px] max-w-xl grid-cols-5 items-center gap-0 px-1">
        {ITEMS.map((item) => {
          const active = item.key === activeKey;
          const Icon = item.icon;
          if (item.key === 'cinema') {
            return (
              <li key={item.key} className="flex h-full items-center justify-center">
                <a href={item.href} aria-label="Cinema catalogue — browse movies" aria-current={active ? 'page' : undefined} className="group flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300">
                  <span className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border transition duration-300 ${active ? 'border-sky-200/70 bg-[radial-gradient(circle_at_32%_20%,#294e7a,#0a1830_58%,#030712)] shadow-[inset_0_1px_5px_rgba(255,255,255,.18),0_0_0_2px_rgba(44,132,255,.18),0_0_20px_rgba(36,121,255,.42)]' : 'border-white/15 bg-[radial-gradient(circle_at_30%_20%,#1b2c46,#07101f_65%,#030712)] shadow-[inset_0_1px_5px_rgba(255,255,255,.12),0_5px_14px_rgba(0,0,0,.45)] group-hover:border-cinema-300/50 group-hover:shadow-[0_0_18px_rgba(36,121,255,.3)]'}`}>
                    <span className="absolute inset-0 rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,.12),transparent_48%)]" />
                    <img src="/cinema-icon.png" alt="" className="relative h-7 w-7 object-contain drop-shadow-[0_0_8px_rgba(91,174,255,.7)] transition duration-300 group-hover:scale-105" />
                  </span>
                  <span className={`text-[9px] font-extrabold tracking-[.04em] ${active ? 'text-sky-100' : 'text-slate-400 group-hover:text-white'}`}>Cinema</span>
                </a>
              </li>
            );
          }
          return (
            <li key={item.key} className="flex h-full items-center justify-center">
              <a href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300 ${active ? 'text-sky-200' : 'text-slate-500 hover:text-slate-100'}`}>
                {Icon && <Icon className={`h-[19px] w-[19px] transition ${active ? 'drop-shadow-[0_0_8px_rgba(74,165,255,.75)]' : ''}`} strokeWidth={active ? 2.4 : 1.8} />}
                <span className="max-w-full truncate text-[9px] font-semibold leading-none">{item.label}</span>
                {active && <span className="absolute bottom-[calc(env(safe-area-inset-bottom)+3px)] h-0.5 w-5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,.8)]" />}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
