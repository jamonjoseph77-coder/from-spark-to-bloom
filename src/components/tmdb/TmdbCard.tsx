import { ArrowUpRight, Star } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { tmdbHref, tmdbImageUrl, tmdbYear, type TmdbItem } from '@/lib/tmdb';

export function TmdbCard({ item, landscape = false }: { item: TmdbItem; landscape?: boolean }) {
  const typeLabel = item.mediaType === 'movie' ? 'Movie' : 'Series';
  const year = tmdbYear(item);
  const image = landscape
    ? tmdbImageUrl(item.backdropPath, 'w780') || tmdbImageUrl(item.posterPath, 'w342')
    : tmdbImageUrl(item.posterPath, 'w342');

  return (
    <a href={tmdbHref(item)} className="group block w-full" aria-label={`${item.title}, ${typeLabel}${year ? `, ${year}` : ''}`}>
      <div className={`relative ${landscape ? 'aspect-video' : 'aspect-[2/3]'} overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/50 group-hover:ring-cinema-300/55`}>
        <Artwork src={image} alt="" fallbackTitle={item.title} className="h-full w-full transition duration-700 group-hover:scale-[1.06]" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-70 transition group-hover:opacity-100" />
        {item.rating !== null && <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-white/10 bg-black/65 px-2 py-1 text-[11px] font-semibold text-amber-200 backdrop-blur"><Star className="h-3 w-3 fill-current" aria-hidden="true" />{item.rating.toFixed(1)}</span>}
        <span className="absolute bottom-3 left-3 right-3 flex translate-y-2 items-center justify-between text-xs font-bold text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"><span>Explore title</span><ArrowUpRight className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 px-0.5">
        <p className="truncate text-sm font-bold text-slate-100 transition group-hover:text-cinema-200">{item.title}</p>
        <p className="mt-1 truncate text-xs text-slate-400">{typeLabel}{year ? ` · ${year}` : ''}</p>
      </div>
    </a>
  );
}
