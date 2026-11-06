import { CalendarDays } from 'lucide-react';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import type { TmdbMediaType } from '@/lib/tmdb';

interface SeasonalTheme {
  title: string;
  description: string;
  movieGenreId: number;
  seriesGenreId: number;
}

export function getCinemaSeasonalTheme(date = new Date()): SeasonalTheme {
  const month = date.getMonth();
  if (month === 1) return { title: 'Stories Of Love & Friendship', description: 'A seasonal collection about connection, friendship and the people who matter.', movieGenreId: 10749, seriesGenreId: 18 };
  if (month === 9) return { title: 'Spooky Season & Mystery Nights', description: 'Mysteries, supernatural stories and atmospheric picks for the season.', movieGenreId: 27, seriesGenreId: 9648 };
  if (month === 11) return { title: 'Holiday Stories & Festive Favourites', description: 'Stories for shared moments, family time and the end-of-year season.', movieGenreId: 10751, seriesGenreId: 10751 };
  if (month === 10) return { title: 'Stories To Gather Around', description: 'Warm, entertaining stories to enjoy and share as the year winds down.', movieGenreId: 35, seriesGenreId: 10751 };
  if (month === 0) return { title: 'Fresh Starts & New Worlds', description: 'Begin the year with fresh perspectives, bold journeys and new discoveries.', movieGenreId: 12, seriesGenreId: 18 };
  if (month === 2 || month === 3) return { title: 'Adventure & Discovery', description: 'Explore new worlds, remarkable journeys and stories that open new perspectives.', movieGenreId: 12, seriesGenreId: 10759 };
  if (month === 4 || month === 5) return { title: 'Stories To Enjoy Together', description: 'A collection for family moments, shared laughter and stories across generations.', movieGenreId: 10751, seriesGenreId: 10751 };
  if (month === 6 || month === 7) return { title: 'Big Escapes & Great Adventures', description: 'Travel beyond the everyday with journeys, action and imaginative worlds.', movieGenreId: 12, seriesGenreId: 10759 };
  return { title: 'New Perspectives & Great Stories', description: 'Discover stories that bring fresh ideas, people and places into view.', movieGenreId: 18, seriesGenreId: 18 };
}

export function CinemaSeasonalSpotlight({ categoryLabel, mediaType, genreId }: { categoryLabel?: string; mediaType?: TmdbMediaType; genreId?: number }) {
  const theme = getCinemaSeasonalTheme();
  const selectedGenre = genreId ?? (mediaType === 'tv' ? theme.seriesGenreId : theme.movieGenreId);

  return (
    <section className="cinema-seasonal-spotlight space-y-4 rounded-[1.6rem] border border-white/10 bg-[radial-gradient(ellipse_at_top_right,rgba(210,190,150,.10),transparent_48%),linear-gradient(125deg,#151714,#0a0d0b_68%,#080a09)] p-5 sm:p-7">
      <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-amber-100/80"><CalendarDays className="h-3.5 w-3.5" /> Seasonal Spotlight{categoryLabel ? ` · ${categoryLabel}` : ''}</div>
      {mediaType ? (
        <TmdbRow heading={theme.title} description={theme.description} mediaType={mediaType} list="popular" genreId={selectedGenre} />
      ) : (
        <div><h2 className="text-2xl font-black tracking-tight text-white">{theme.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{theme.description} Seasonal programmes and special collections will appear here as verified publishers add them to Cinema.</p><a href="/discover" className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-100/20 bg-amber-100/[.07] px-4 py-2.5 text-xs font-bold text-amber-50 transition hover:bg-amber-100/[.12]">Explore Seasonal Stories</a></div>
      )}
    </section>
  );
}
