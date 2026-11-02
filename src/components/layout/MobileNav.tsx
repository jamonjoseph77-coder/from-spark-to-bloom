import { Compass, Home, Tv, Heart } from 'lucide-react';
import { navKeyOf } from '@/components/layout/navigation';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import type { Route } from '@/lib/router';

interface MobileNavProps { route: Route }

const ITEMS = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'discover', label: 'Explore', href: '/discover', icon: Compass },
  { key: 'live-tv', label: 'Live TV', href: '/live-tv', icon: Tv },
  { key: 'my-cinema', label: 'My Cinema', href: '/my-cinema', icon: Heart },
];

export function MobileNav({ route }: MobileNavProps) {
  const activeKey = navKeyOf(route);
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050912]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5 items-end px-2 pt-2">
        {ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = item.key === activeKey;
          return <li key={item.key}><a href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${active ? 'text-cinema-200' : 'text-slate-400 hover:text-white'}`}><Icon className={`h-5 w-5 ${active ? 'drop-shadow-[0_0_9px_rgba(74,165,255,0.8)]' : ''}`} /><span>{item.label}</span></a></li>;
        })}
        <li className="-mt-7 flex justify-center">
          <a href="/" aria-label="Cinema home" className="grid h-[66px] w-[66px] place-items-center rounded-full border border-cinema-400/80 bg-[#07101f] shadow-[0_0_0_5px_rgba(5,9,18,0.95),0_0_28px_rgba(39,130,255,0.45)] transition hover:scale-105">
            <img src="/cinema-icon.png" alt="" className="h-11 w-11 object-contain drop-shadow-[0_0_12px_rgba(77,161,255,0.75)]" />
          </a>
        </li>
        {ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const active = item.key === activeKey;
          return <li key={item.key}><a href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${active ? 'text-cinema-200' : 'text-slate-400 hover:text-white'}`}><Icon className={`h-5 w-5 ${active ? 'drop-shadow-[0_0_9px_rgba(74,165,255,0.8)]' : ''}`} /><span>{item.label}</span></a></li>;
        })}
      </ul>
    </nav>
  );
}
