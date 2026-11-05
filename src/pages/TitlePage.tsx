import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft, Building2, ChevronRight, Clock3, Film,
  Play, Radio, Share2, Users,
} from 'lucide-react';
import { EpisodeList } from '@/components/title/EpisodeList';
import { TitleActions } from '@/components/title/TitleActions';
import { VideoDialog } from '@/components/player/VideoDialog';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { ShortCard } from '@/components/discover/ShortCard';
import { titleTrailerSource } from '@/lib/videoSource';
import { uniqueVideos, videoIdentity } from '@/lib/videoIdentity';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { Artwork } from '@/components/ui/Artwork';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_ACCENT, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, PAGE_CONTAINER, SECTION_HEADING } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useLibrary } from '@/hooks/useLibrary';
import { useToast } from '@/hooks/useToast';
import { relatedTitles, titleMeta } from '@/lib/catalogue';
import { formatDuration } from '@/lib/format';
import { publisherHref } from '@/lib/publishers';
import { fetchPublishedTitles, fetchTitleDetail } from '@/lib/library';
import { CLIP_KIND_LABEL, fetchPublishedClips, type DiscoverClip } from '@/lib/clips';
import { TITLE_TYPE_LABELS, type TitleType } from '@/lib/types';
import { NotFoundPage } from '@/pages/NotFoundPage';

const BROWSE_PATH: Record<TitleType, string> = { movie: 'movies', series: 'series', sport: 'sports', live: 'live-tv', news: 'news' };

export function TitlePage({ titleId }: { titleId: string }) {
  const { progress } = useLibrary();
  const { notify } = useToast();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);
  const { data, error, reload } = useAsyncData(async () => {
    const [detail, published, clips] = await Promise.all([
      fetchTitleDetail(titleId),
      fetchPublishedTitles(),
      fetchPublishedClips().catch((cause) => { console.warn('Title clips unavailable', cause); return []; }),
    ]);
    return { ...detail, published, clips };
  }, [titleId]);

  const related = useMemo(() => (data?.title ? relatedTitles(data.published, data.title) : []), [data]);
  if (!data) return <div className={PAGE_CONTAINER}>{error ? <ErrorState onRetry={reload} /> : <LoadingState />}</div>;
  const { title, seasons } = data;
  if (!title) return <NotFoundPage />;

  const trailerIdentity = videoIdentity(title.trailer_url);
  const titleClips = uniqueVideos(
    data.clips.filter((clip) => clip.title_id === title.id && videoIdentity(clip.video_url) !== trailerIdentity),
    (clip) => clip.video_url,
  );
  const titleShorts = titleClips.filter((clip) => clip.kind === 'short');
  const titleEditorial = titleClips.filter((clip) => clip.kind !== 'short' && clip.kind !== 'trailer');
  const behindScenes = titleEditorial.filter((clip) => ['behind_the_scenes', 'making_of', 'production_diary'].includes(clip.kind));
  const interviews = titleEditorial.filter((clip) => clip.kind === 'interview');
  const additionalClips = titleEditorial.filter((clip) => ['clip', 'featured', 'deleted_scene', 'cast_featurette'].includes(clip.kind));
  const firstEpisode = seasons.flatMap((season) => season.episodes).find((episode) => episode.playback_url.trim() !== '');
  const savedProgress = progress.find((entry) => entry.content_id === title.id);
  const canResume = savedProgress && !savedProgress.completed && savedProgress.position_seconds > 5;

  let primary: ReactNode;
  if (title.type === 'series') {
    primary = firstEpisode
      ? <a href={`/watch/${title.id}?ep=${firstEpisode.id}`} className={BUTTON_PRIMARY}><Play className="h-4 w-4 fill-current" /> Play first episode</a>
      : <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">Episodes are not available yet.</span>;
  } else if (title.playback_url.trim() !== '') {
    primary = <a href={`/watch/${title.id}`} className={BUTTON_PRIMARY}>{title.type === 'live' ? <Radio className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}{title.type === 'live' ? 'Watch live' : canResume ? 'Resume watching' : 'Watch now'}</a>;
  } else {
    primary = <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">Viewing is not available yet</span>;
  }

  const shareableTitle = title;
  async function shareTitle() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: shareableTitle.title, text: `Explore ${shareableTitle.title} on Cinema`, url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); notify('Title link copied. Share it with your friends.'); }
      else notify('Copy this page address to share the title.');
    } catch (cause) {
      if ((cause as { name?: string }).name !== 'AbortError') notify('Could not share this title.', 'error');
    }
  }

  const runtime = formatDuration(title.duration_minutes);
  const release = title.release_date
    ? new Date(title.release_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : title.release_year ? String(title.release_year) : '';

  return (
    <div className="cinema-title-page animate-fade-in">
      <section className="relative isolate overflow-hidden border-b border-white/5">
        <Artwork src={title.backdrop_url || title.poster_url} alt="" fallbackTitle={title.title} className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-55" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#080d14] via-[#080d14]/85 to-[#080d14]/35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/35 to-[#080d14]/20" />
        <div className={`${PAGE_CONTAINER} !pb-12 !pt-8 sm:!pt-12`}>
          <a href={`/${BROWSE_PATH[title.type]}`} className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur transition hover:border-white/25 hover:bg-black/40 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {TITLE_TYPE_LABELS[title.type]}
          </a>
          {!title.is_published && <p className="mb-4 inline-flex rounded-md bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300">Draft · visible to administrators only</p>}
          <div className="grid items-end gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)]">
            <div className="mx-auto w-36 sm:w-44 md:mx-0 md:w-full">
              <Artwork src={title.poster_url} alt={`${title.title} poster`} fallbackTitle={title.title} className="aspect-[2/3] w-full rounded-2xl border border-white/15 shadow-[0_28px_90px_rgba(0,0,0,.65)] ring-1 ring-sky-200/10 sm:rounded-3xl" />
            </div>
            <div className="max-w-3xl space-y-5 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-sky-200/25 bg-sky-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-sky-100">{TITLE_TYPE_LABELS[title.type]}</span>
                {title.release_year && <span className="text-xs font-semibold text-slate-300">{title.release_year}</span>}
                {title.genre && <><span className="text-slate-600">·</span><span className="text-xs text-slate-300">{title.genre}</span></>}
                {runtime && <><span className="text-slate-600">·</span><span className="inline-flex items-center gap-1 text-xs text-slate-300"><Clock3 className="h-3.5 w-3.5" />{runtime}</span></>}
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-[-.045em] text-white [text-wrap:balance] drop-shadow-lg sm:text-5xl lg:text-6xl">{title.title}</h1>
              <p className="line-clamp-2 max-w-2xl text-sm leading-7 text-slate-200/90 sm:text-base">{title.synopsis || 'More information about this title will be available soon.'}</p>
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {primary}
                {title.trailer_url.trim() !== '' && <button type="button" aria-label={`Watch the official trailer for ${title.title}`} onClick={() => setTrailerOpen(true)} className={BUTTON_ACCENT}><Film className="h-4 w-4" /> Watch trailer</button>}
                <TitleActions title={title} />
                <button type="button" onClick={() => void shareTitle()} className={BUTTON_SECONDARY}><Share2 className="h-4 w-4" /> Share</button>
              </div>
              {title.publisher && (
                <a href={publisherHref(title.publisher)} className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-slate-300 transition hover:text-white">
                  <Building2 className="h-4 w-4 text-sky-200" /> {title.publisher} <ChevronRight className="h-4 w-4 text-slate-500" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className={`${PAGE_CONTAINER} !pt-8 sm:!pt-10`}>
        <section className="grid gap-3 sm:grid-cols-2">
          <a href="/friends" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/75 p-4 transition hover:border-sky-200/25 hover:bg-ink-850 sm:p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-300/10 text-sky-100"><Users className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-white">Bring your friends in</span><span className="mt-1 block text-sm text-slate-400">Share this title and see what your circle is talking about.</span></span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-100" />
          </a>
          <a href="/watch-parties" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/75 p-4 transition hover:border-sky-200/25 hover:bg-ink-850 sm:p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-100"><Play className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-white">Watch together</span><span className="mt-1 block text-sm text-slate-400">Explore watch parties connected to this title.</span></span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-100" />
          </a>
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-12">
          <div className="min-w-0 space-y-11">
            <section className="space-y-3">
              <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200/75">The story</p><h2 className={SECTION_HEADING}>About {title.title}</h2></div>
              <p className="max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">{title.synopsis || 'A synopsis has not been added for this title yet.'}</p>
            </section>

            {title.type === 'series' && (
              <section className="space-y-5">
                <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200/75">Explore the series</p><h2 className={SECTION_HEADING}>Episodes and seasons</h2></div>
                <EpisodeList titleId={title.id} seasons={seasons} />
              </section>
            )}

            {(titleShorts.length > 0 || titleEditorial.length > 0) && (
              <section className="space-y-6">
                <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200/75">Official extras</p><h2 className={SECTION_HEADING}>More from {title.title}</h2><p className="mt-1 text-sm text-slate-400">Official extras and publisher-approved videos connected to this title.</p></div>
                {behindScenes.length > 0 && <EditorialVideoGroup heading="Behind the scenes" clips={behindScenes} onOpen={setActiveShort} />}
                {interviews.length > 0 && <EditorialVideoGroup heading="Cast and crew conversations" clips={interviews} onOpen={setActiveShort} />}
                {additionalClips.length > 0 && <EditorialVideoGroup heading="More from this title" clips={additionalClips} onOpen={setActiveShort} />}
                {titleShorts.length > 0 && <div className="space-y-3"><h3 className="text-sm font-bold text-slate-200">Short videos</h3><div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">{titleShorts.map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActiveShort} />)}</div></div>}
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <section className={`${CARD} space-y-4`} aria-label="Title information">
              <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-sky-200/75">At a glance</p><h2 className="mt-1 text-lg font-extrabold text-white">Title information</h2></div>
              <DetailRow label="Format" value={TITLE_TYPE_LABELS[title.type]} />
              <DetailRow label="Publisher" value={title.publisher} href={title.publisher ? publisherHref(title.publisher) : undefined} />
              <DetailRow label="Release" value={release} />
              <DetailRow label="Runtime" value={runtime} />
              <DetailRow label="Genre" value={title.genre} />
              <DetailRow label="Availability" value={title.availability} />
              <p className="border-t border-white/5 pt-3 text-xs leading-5 text-slate-500">{titleMeta(title)}</p>
            </section>
            {title.publisher && (
              <a href={publisherHref(title.publisher)} className="group block rounded-2xl border border-white/10 bg-gradient-to-br from-sky-300/[.10] to-ink-900 p-5 transition hover:border-sky-200/25">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/20 text-sky-100"><Building2 className="h-5 w-5" /></span>
                <span className="mt-4 block text-[10px] font-bold uppercase tracking-[.18em] text-sky-200/75">Explore publisher</span>
                <span className="mt-1 flex items-center justify-between gap-3 font-bold text-white">{title.publisher}<ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-100" /></span>
                <span className="mt-2 block text-sm leading-6 text-slate-400">Discover more titles and published videos from this publisher.</span>
              </a>
            )}
          </aside>
        </div>

        <section className="mt-12 border-t border-white/10 pt-9">
          <TitleRow heading="More like this" titles={related} />
        </section>
      </div>
      {trailerOpen && <VideoDialog {...titleTrailerSource(title)} onClose={() => setTrailerOpen(false)} />}
      {activeShort && <ShortViewer clip={activeShort} onClose={() => setActiveShort(null)} />}
    </div>
  );
}

function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value) return null;
  return <div className="flex justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"><span className="text-slate-400">{label}</span>{href ? <a href={href} className="text-right font-semibold text-sky-200 transition hover:text-white">{value}</a> : <span className="text-right font-semibold text-slate-100">{value}</span>}</div>;
}

function EditorialVideoGroup({ heading, clips, onOpen }: { heading: string; clips: DiscoverClip[]; onOpen: (clip: DiscoverClip) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-200">{heading}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {clips.map((clip) => (
          <button key={clip.id} type="button" onClick={() => onOpen(clip)} className="group overflow-hidden rounded-2xl border border-white/10 bg-ink-900/70 text-left transition hover:border-sky-200/25 hover:bg-ink-850">
            <div className="relative aspect-video overflow-hidden bg-ink-950">
              <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <span className="absolute inset-0 grid place-items-center bg-black/15 text-white"><span className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/45 backdrop-blur"><Play className="h-4 w-4 fill-current" /></span></span>
            </div>
            <div className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-200">{CLIP_KIND_LABEL[clip.kind]}</span>
              <span className="mt-1 block font-semibold text-white">{clip.headline}</span>
              {clip.description && <span className="mt-1 block line-clamp-2 text-sm leading-6 text-slate-400">{clip.description}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
