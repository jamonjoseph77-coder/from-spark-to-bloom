const DESTINATIONS = [
  { label: 'Home', href: '/' },
  { label: 'Movies', href: '/movies' },
  { label: 'Series', href: '/series' },
  { label: 'Shorts', href: '/shorts' },
  { label: 'News', href: '/news' },
  { label: 'Documentaries', href: '/category/documentaries' },
  { label: 'Animation', href: '/category/animation' },
  { label: 'Family', href: '/category/family' },
];

export function CinemaCategoryNav({ active }: { active: string }) {
  return (
    <nav aria-label="Cinema Categories" className="cinema-category-destinations -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      {DESTINATIONS.map((item) => (
        <a key={item.href} href={item.href} aria-current={item.label.toLowerCase() === active.toLowerCase() ? 'page' : undefined} className="shrink-0 rounded-full border border-white/10 bg-white/[.035] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-sky-200/35 hover:bg-sky-300/[.08] hover:text-white">
          {item.label}
        </a>
      ))}
    </nav>
  );
}
