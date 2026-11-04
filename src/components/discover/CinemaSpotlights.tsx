import { useMemo, useState } from 'react';
import { ArrowUpRight, BadgeCheck, Clapperboard, Play } from 'lucide-react';
import { ContentEngagement } from '@/components/discover/ContentEngagement';
import { VideoDialog } from '@/components/player/VideoDialog';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchPublishedClips, type DiscoverClip } from '@/lib/clips';

const STORY_FEATURE_KINDS: DiscoverClip['kind'][] = [
  'featured',
  'behind_the_scenes',
  'interview',
  'making_of',
  'cast_featurette',
  'production_diary',
  'deleted_scene',
];

function featureLabel(kind: DiscoverClip['kind']): string {
  const labels: Partial<Record<DiscoverClip['kind'], string>> = {
    featured: 'Featured Story',
    behind_the_scenes: 'Behind The Scenes',
    interview: 'Cast & Creator Talk',
    making_of: 'The Making Of',
    cast_featurette: 'Cast Feature',
    production_diary: 'Production Diary',
    deleted_scene: 'Bonus Scene',
  };
  return labels[kind] ?? 'Inside The Story';
}

export function CinemaSpotlights() {
  const [active, setActive] = useState<DiscoverClip | null>(null);
  const { data: clips, error, reload } = useAsyncData(fetchPublishedClips, []);
  const features = useMemo(
    () => (clips ?? []).filter((clip) => STORY_FEATURE_KINDS.includes(clip.kind)).slice(0, 12),
    [clips],
  );

  return (
    <section className="space-y-4" aria-label="Inside The Story">
      {!clips && !error && <LoadingState label="Finding Stories From The People Behind The Screen" />}
      {!clips && error && <ErrorState onRetry={reload} />}
      {clips && features.length === 0 && (
        <EmptyState
          icon={<Clapperboard className="h-7 w-7 text-cinema-300" />}
          title="More Stories Are On The Way"
          description="Behind-The-Scenes Moments, Cast Conversations And Studio Features Will Appear Here When Published."
        />
      )}
      {features.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((clip) => (
            <article key={clip.id} className="group min-w-0">
              <button
                type="button"
                onClick={() => setActive(clip)}
                aria-label={`Watch ${featureLabel(clip.kind)}: ${clip.headline}`}
                className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-[#080b11] text-left ring-1 ring-white/10 transition hover:ring-cinema-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300"
              >
                <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full transition duration-500 group-hover:scale-[1.04]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                  <BadgeCheck className="h-3.5 w-3.5 text-sky-200" /> {featureLabel(clip.kind)}
                </span>
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-white/40 bg-black/45 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-[#087cff]/80">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                </span>
                <span className="absolute bottom-3 left-3 right-3">
                  <span className="block line-clamp-2 text-left text-sm font-extrabold leading-snug text-white drop-shadow-lg">{clip.headline}</span>
                  <span className="mt-1 block truncate text-[11px] font-semibold text-slate-200">{clip.publisher_name || 'Cinema Publisher'}</span>
                </span>
              </button>
              <div className="mt-3 flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cinema-300/15 bg-cinema-300/10 text-cinema-200">
                  <Clapperboard className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-white">{clip.headline}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{clip.description || featureLabel(clip.kind)}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-cinema-200" />
              </div>
              <ContentEngagement
                contentKey={`clip:${clip.id}`}
                title={clip.headline}
                href={`/discover#clip-${clip.id}`}
                imageUrl={clip.poster_url}
                compact
              />
            </article>
          ))}
        </div>
      )}
      {active && (
        <VideoDialog
          url={active.video_url}
          label={active.headline}
          heading={featureLabel(active.kind)}
          onClose={() => setActive(null)}
        />
      )}
    </section>
  );
}
