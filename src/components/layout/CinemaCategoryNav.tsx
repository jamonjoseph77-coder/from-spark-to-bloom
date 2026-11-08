import { Film, Home, MonitorPlay, Newspaper, Sparkles, Users } from 'lucide-react';

const DESTINATIONS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Movies', href: '/movies', icon: Film },
  { label: 'Series', href: '/series', icon: MonitorPlay },
  { label: 'Shorts', href: '/shorts', icon: Sparkles },
  { label: 'News', href: '/news', icon: Newspaper },
  { label: 'Documentaries', href: '/category/documentaries', icon: Users },
  { label: 'Animation', href: '/category/animation', icon: Sparkles },
  { label: 'Family', href: '/category/family', icon: Film },
  { label: 'Reality', href: '/category/reality', icon: Users },
];

export function CinemaCategoryNav({ active }: { active: string }) {
  return (
    <nav aria-label="Cinema Categories" className="cinema-category-destinations -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      {DESTINATIONS.map((item) => {
        const Icon = item.icon;
        const selected = item.label.toLowerCase() === active.toLowerCase();
        return (
          <a key={item.href} href={item.href} aria-current={selected ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition ${selected ? "border-sky-200/45 bg-sky-300/[.14] text-white shadow-[0_6px_24px_rgba(8,124,255,.14)]" : "border-white/10 bg-white/[.035] text-slate-300 hover:border-sky-200/35 hover:bg-sky-300/[.08] hover:text-white"}`}>
            <Icon className="h-3.5 w-3.5" />{item.label}
          </a>
        );
      })}
    </nav>
  );
}
