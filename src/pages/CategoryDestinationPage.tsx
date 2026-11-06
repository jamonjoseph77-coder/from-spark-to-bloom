import { ArrowRight, Clapperboard, Compass, Film, Sparkles, Tv } from 'lucide-react';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { PAGE_CONTAINER } from '@/components/ui/styles';

type Shelf = { heading: string; description: string; mediaType: 'movie' | 'tv'; list: 'popular' | 'trending'; genreId?: number };
type CategoryConfig = {
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof Film;
  accent: string;
  shelves: Shelf[];
};

const CATEGORIES: Record<string, CategoryConfig> = {
  documentaries: {
    title: 'Documentaries',
    eyebrow: 'Real Stories. Wider Perspectives.',
    description: 'Explore true stories, remarkable people, nature, history and ideas from around the world.',
    icon: Clapperboard,
    accent: 'Real Stories, From Every Perspective',
    shelves: [
      { heading: 'True Stories In Focus', description: 'Non-fiction stories people are discovering now.', mediaType: 'movie', list: 'trending', genreId: 99 },
      { heading: 'Remarkable Real-Life Films', description: 'Remarkable real-world stories from the film catalogue.', mediaType: 'movie', list: 'popular', genreId: 99 },
      { heading: 'Real Stories, Episode By Episode', description: 'True stories told across episodes.', mediaType: 'tv', list: 'popular', genreId: 99 },
      { heading: 'Factual Series To Explore', description: 'Factual series gaining attention.', mediaType: 'tv', list: 'trending', genreId: 99 },
    ],
  },
  animation: {
    title: 'Animation',
    eyebrow: 'Big Worlds. Unlimited Imagination.',
    description: 'Discover animated films, imaginative adventures, anime and series from different styles and cultures.',
    icon: Sparkles,
    accent: 'Find Your Next Animated World',
    shelves: [
      { heading: 'Animation In The Spotlight', description: 'Animated stories gaining attention right now.', mediaType: 'movie', list: 'trending', genreId: 16 },
      { heading: 'Animated Films To Discover', description: 'More worlds and characters to discover.', mediaType: 'movie', list: 'popular', genreId: 16 },
      { heading: 'Worlds That Keep Going', description: 'Stories that continue episode by episode.', mediaType: 'tv', list: 'popular', genreId: 16 },
      { heading: 'Popular Animated Adventures', description: 'Series audiences are exploring.', mediaType: 'tv', list: 'trending', genreId: 16 },
    ],
  },
  family: {
    title: 'Family',
    eyebrow: 'Stories To Enjoy Together.',
    description: 'Find adventures, animated worlds and uplifting entertainment for shared viewing.',
    icon: Film,
    accent: 'Something For Everyone',
    shelves: [
      { heading: 'Family Film Favourites', description: 'Family-friendly films being discovered.', mediaType: 'movie', list: 'trending', genreId: 10751 },
      { heading: 'More Stories To Share', description: 'More stories for a shared movie moment.', mediaType: 'movie', list: 'popular', genreId: 10751 },
      { heading: 'Series For Everyone', description: 'Series for shared viewing and discovery.', mediaType: 'tv', list: 'popular', genreId: 10751 },
      { heading: 'Family Series In The Spotlight', description: 'Family series gaining attention.', mediaType: 'tv', list: 'trending', genreId: 10751 },
    ],
  },

};

const DESTINATIONS = [
  { label: 'Movies', href: '/movies' },
  { label: 'Series', href: '/series' },
  { label: 'Shorts', href: '/discover' },
  { label: 'News', href: '/news' },
  { label: 'Documentaries', href: '/category/documentaries' },
  { label: 'Animation', href: '/category/animation' },
  { label: 'Family', href: '/category/family' },
  { label: 'Reality', href: '/category/reality' },
];

export function CategoryDestinationPage({ slug }: { slug: string }) {
  const category = CATEGORIES[slug.toLowerCase()];
  if (!category) {
    return (
      <main className={`${PAGE_CONTAINER} space-y-5`}>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-cinema-300">Cinema Categories</p>
        <h1 className="text-3xl font-black text-white">This Destination Is Not Available Yet</h1>
        <p className="max-w-xl text-sm leading-6 text-slate-400">Choose one of the available Cinema destinations below.</p>
        <div className="flex flex-wrap gap-2">{DESTINATIONS.map((item) => <a key={item.href} href={item.href} className="rounded-full border border-white/15 bg-white/[.05] px-4 py-2 text-xs font-bold text-white transition hover:border-sky-200/40 hover:bg-sky-300/10">{item.label}</a>)}</div>
        <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-sky-100">Return To Cinema <ArrowRight className="h-4 w-4" /></a>
      </main>
    );
  }

  const Icon = category.icon;
  return (
    <main className={`${PAGE_CONTAINER} cinema-category-page space-y-10 pb-16`}>
      <nav aria-label="Cinema destinations" className="cinema-category-destinations -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {DESTINATIONS.map((item) => <a key={item.href} href={item.href} aria-current={item.href === `/category/${slug}` ? 'page' : undefined} className="shrink-0 rounded-full border border-white/10 bg-white/[.035] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-sky-200/35 hover:bg-sky-300/[.08] hover:text-white">{item.label}</a>)}
      </nav>

      <header className="cinema-category-hero relative isolate overflow-hidden rounded-[2rem] border border-sky-200/15 p-6 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-10 lg:p-12">
        <div className="cinema-category-hero__orb cinema-category-hero__orb--one" aria-hidden="true" />
        <div className="cinema-category-hero__orb cinema-category-hero__orb--two" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <a href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-sky-100/75 transition hover:text-white"><Compass className="h-3.5 w-3.5" /> Cinema Home <span className="text-white/35">/</span> {category.title}</a>
          <div className="mt-8 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-200/20 bg-sky-300/10 text-sky-100 shadow-[0_0_28px_rgba(8,124,255,.14)]"><Icon className="h-5 w-5" /></span>
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-sky-200">{category.eyebrow}</p><p className="mt-1 text-xs font-semibold text-white/50">A Dedicated Cinema Destination</p></div>
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-.04em] text-white sm:text-6xl">{category.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/80 sm:text-base">{category.description}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <a href="/search" className="inline-flex items-center gap-2 rounded-full bg-[#087cff] px-5 py-3 text-xs font-extrabold text-white shadow-[0_8px_26px_rgba(8,124,255,.25)] transition hover:bg-[#168cff]">Find A Story <ArrowRight className="h-3.5 w-3.5" /></a>
            <a href="/discover" className="rounded-full border border-white/20 bg-white/[.07] px-5 py-3 text-xs font-bold text-white transition hover:border-sky-200/40 hover:bg-sky-300/10">Explore Cinema</a>
          </div>
        </div>
      </header>

      <section className="space-y-3 rounded-2xl border border-sky-200/10 bg-[linear-gradient(110deg,rgba(8,124,255,.09),rgba(255,255,255,.018)_58%,rgba(255,255,255,.01))] p-5 sm:p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-sky-200">Your Category, Your Cinema</p>
        <h2 className="text-xl font-extrabold text-white sm:text-2xl">{category.accent}</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">Browse several collections without leaving this destination. Open any title to see its details and the viewing options available through Cinema.</p>
      </section>

      <section className="space-y-10" aria-label={`${category.title} collections`}>
        {category.shelves.map((shelf) => <TmdbRow key={shelf.heading} {...shelf} />)}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:p-6">
        <div><p className="text-sm font-bold text-white">Keep Exploring Cinema</p><p className="mt-1 text-xs leading-5 text-slate-400">Move between movies, series, Shorts, news and more dedicated destinations.</p></div>
        <a href="/" className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-400/10 px-4 py-2.5 text-xs font-bold text-sky-100 transition hover:bg-sky-400/15">Back To Home <ArrowRight className="h-3.5 w-3.5" /></a>
      </footer>
      <p className="text-[11px] leading-5 text-slate-500">Catalogue metadata and artwork help with discovery. Actual viewing availability on Cinema depends on distribution rights and published content.</p>
    </main>
  );
}
