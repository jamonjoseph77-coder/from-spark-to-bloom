import { ArrowRight, Clapperboard, Compass, Film, Sparkles, Tv } from 'lucide-react';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { PAGE_CONTAINER } from '@/components/ui/styles';

type CategoryConfig = {
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof Film;
  shelves: Array<{ heading: string; description: string; mediaType: 'movie' | 'tv'; list: 'popular' | 'trending'; genreId?: number }>;
};

const CATEGORIES: Record<string, CategoryConfig> = {
  documentaries: {
    title: 'Documentaries',
    eyebrow: 'Real Stories. Wider Perspectives.',
    description: 'Explore true stories, remarkable people, nature, history and ideas from around the world.',
    icon: Clapperboard,
    shelves: [
      { heading: 'Trending Documentaries', description: 'Non-fiction stories people are discovering.', mediaType: 'movie', list: 'trending', genreId: 99 },
      { heading: 'Popular Documentary Films', description: 'Acclaimed real-world stories.', mediaType: 'movie', list: 'popular', genreId: 99 },
      { heading: 'Documentary Series', description: 'True stories told across episodes.', mediaType: 'tv', list: 'popular', genreId: 99 },
    ],
  },
  animation: {
    title: 'Animation',
    eyebrow: 'Big Worlds. Unlimited Imagination.',
    description: 'Discover animated films, imaginative adventures and series from different styles and cultures.',
    icon: Sparkles,
    shelves: [
      { heading: 'Trending Animation', description: 'Animated stories gaining attention.', mediaType: 'movie', list: 'trending', genreId: 16 },
      { heading: 'Popular Animated Films', description: 'More worlds and characters to discover.', mediaType: 'movie', list: 'popular', genreId: 16 },
      { heading: 'Animated Series', description: 'Stories that continue episode by episode.', mediaType: 'tv', list: 'popular', genreId: 16 },
    ],
  },
  family: {
    title: 'Family',
    eyebrow: 'Stories To Enjoy Together.',
    description: 'Find adventures, animated worlds and uplifting entertainment for shared viewing.',
    icon: Film,
    shelves: [
      { heading: 'Trending Family Films', description: 'Family-friendly films being discovered.', mediaType: 'movie', list: 'trending', genreId: 10751 },
      { heading: 'Popular Family Films', description: 'More stories for a shared movie moment.', mediaType: 'movie', list: 'popular', genreId: 10751 },
      { heading: 'Family Series', description: 'Series made for shared viewing.', mediaType: 'tv', list: 'popular', genreId: 10751 },
    ],
  },
  reality: {
    title: 'Reality',
    eyebrow: 'Real People. Unscripted Moments.',
    description: 'Explore reality programmes, competition formats and unscripted series.',
    icon: Tv,
    shelves: [
      { heading: 'Trending Reality Series', description: 'Unscripted series creating conversation.', mediaType: 'tv', list: 'trending', genreId: 10764 },
      { heading: 'Popular Reality Series', description: 'More reality entertainment to explore.', mediaType: 'tv', list: 'popular', genreId: 10764 },
    ],
  },
};

export function CategoryDestinationPage({ slug }: { slug: string }) {
  const category = CATEGORIES[slug.toLowerCase()];
  if (!category) {
    return (
      <main className={`${PAGE_CONTAINER} space-y-5`}>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-cinema-300">Cinema Categories</p>
        <h1 className="text-3xl font-black text-white">This Destination Is Not Available Yet</h1>
        <p className="max-w-xl text-sm leading-6 text-slate-400">Explore the destinations already available in Cinema.</p>
        <a href="/" className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-400/10 px-4 py-2.5 text-sm font-bold text-sky-100 transition hover:bg-sky-400/15">Return To Cinema <ArrowRight className="h-4 w-4" /></a>
      </main>
    );
  }

  const Icon = category.icon;
  return (
    <main className={`${PAGE_CONTAINER} cinema-category-page space-y-9 pb-16`}>
      <header className="cinema-category-hero relative isolate overflow-hidden rounded-[2rem] border border-sky-200/15 p-6 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-10 lg:p-12">
        <div className="cinema-category-hero__orb cinema-category-hero__orb--one" aria-hidden="true" />
        <div className="cinema-category-hero__orb cinema-category-hero__orb--two" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <a href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-sky-100/75 transition hover:text-white"><Compass className="h-3.5 w-3.5" /> Cinema Home <span className="text-white/35">/</span> Categories</a>
          <div className="mt-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-sky-200/20 bg-sky-300/10 text-sky-100 shadow-[0_0_28px_rgba(8,124,255,.14)]"><Icon className="h-5 w-5" /></span>
            <p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-sky-200">{category.eyebrow}</p>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em] text-white sm:text-6xl">{category.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/80 sm:text-base">{category.description}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <a href="/movies" className="rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-bold text-white transition hover:border-sky-200/40 hover:bg-sky-300/10">Movies</a>
            <a href="/series" className="rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-bold text-white transition hover:border-sky-200/40 hover:bg-sky-300/10">Series</a>
            <a href="/discover" className="rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-bold text-white transition hover:border-sky-200/40 hover:bg-sky-300/10">Cinema Shorts</a>
            <a href="/news" className="rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-bold text-white transition hover:border-sky-200/40 hover:bg-sky-300/10">News</a>
          </div>
        </div>
      </header>
      <section className="space-y-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">Your Category Destination</p><h2 className="text-xl font-extrabold text-white sm:text-2xl">Discover {category.title}</h2><p className="mt-1 text-xs text-slate-500">Explore live catalogue metadata and artwork. Viewing availability on Cinema depends on distribution rights.</p></div>
        {category.shelves.map((shelf) => <TmdbRow key={shelf.heading} {...shelf} />)}
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4">
        <div><p className="text-sm font-bold text-white">Keep Exploring Cinema</p><p className="mt-1 text-xs text-slate-400">Move between films, series, shorts and the stories people share.</p></div>
        <a href="/discover" className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-400/10 px-4 py-2.5 text-xs font-bold text-sky-100 transition hover:bg-sky-400/15">Explore Cinema <ArrowRight className="h-3.5 w-3.5" /></a>
      </footer>
    </main>
  );
}
