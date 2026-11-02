import { useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, Film, Play, Radio, Share2, Users, MessageCircle } from 'lucide-react';
import { EpisodeList } from '@/components/title/EpisodeList';
import { TitleActions } from '@/components/title/TitleActions';
import { VideoDialog } from '@/components/player/VideoDialog';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { ShortCard } from '@/components/discover/ShortCard';
import { titleTrailerSource } from '@/lib/videoSource';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { Artwork } from '@/components/ui/Artwork';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, PAGE_CONTAINER, SECTION_HEADING } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useLibrary } from '@/hooks/useLibrary';
import { useToast } from '@/hooks/useToast';
import { relatedTitles, titleMeta } from '@/lib/catalogue';
import { formatDuration } from '@/lib/format';
import { publisherHref } from '@/lib/publishers';
import { fetchPublishedTitles, fetchTitleDetail } from '@/lib/library';
import { fetchPublishedClips, type DiscoverClip } from '@/lib/clips';
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

  const titleShorts = data.clips.filter((clip) => clip.kind === 'short' && clip.title_id === title.id);
  const titleClips = data.clips.filter((clip) => clip.kind === 'clip' && clip.title_id === title.id);
  const firstEpisode = seasons.flatMap((season) => season.episodes).find((episode) => episode.playback_url.trim() !== '');
  const savedProgress = progress.find((entry) => entry.content_id === title.id);
  const canResume = savedProgress && !savedProgress.completed && savedProgress.position_seconds > 5;

  let primary: ReactNode;
  if (title.type === 'series') {
    primary = firstEpisode ? <a href={`/watch/${title.id}?ep=${firstEpisode.id}`} className={BUTTON_PRIMARY}><Play className="h-4 w-4 fill-current" /> Play first episode</a> : <span className="text-sm text-slate-400">Episodes are not available yet.</span>;
  } else if (title.playback_url.trim() !== '') {
    primary = <a href={`/watch/${title.id}`} className={BUTTON_PRIMARY}>{title.type === 'live' ? <Radio className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}{title.type === 'live' ? 'Watch live' : canResume ? 'Resume' : 'Play'}</a>;
  } else primary = <span className="text-sm text-slate-400">This title is not available to watch yet.</span>;

  const shareableTitle = title as NonNullable<typeof title>;
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
  return (
    <div className="animate-fade-in">
      <section className="relative isolate overflow-hidden border-b border-white/5">
        <Artwork src={title.backdrop_url || title.poster_url} alt="" fallbackTitle={title.title} className="absolute inset-0 -z-10 h-full w-full object-cover object-top opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/20" />
        <div className={`${PAGE_CONTAINER} flex min-h-[34rem] items-end gap-8 pb-12 pt-20 sm:min-h-[39rem] sm:pb-16 sm:pt-28`}>
          <Artwork src={title.poster_url} alt={`${title.title} poster`} fallbackTitle={title.title} className="hidden aspect-[3/4] w-52 flex-none rounded-[1.6rem] border border-white/15 shadow-[0_28px_80px_rgba(0,0,0,.65)] ring-1 ring-sky-200/10 md:block lg:w-64" />
          <div className="max-w-2xl space-y-5">
            <a href={`/${BROWSE_PATH[title.type]}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> {TITLE_TYPE_LABELS[title.type]}</a>
            {!title.is_published && <p className="inline-block rounded-md bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300">Draft: only administrators can see this title</p>}
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">{title.title}</h1>
            <p className="text-sm text-slate-300">{[title.release_year, runtime, title.genre].filter(Boolean).join(' · ')}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {primary}
              {title.trailer_url.trim() !== '' && <button type="button" onClick={() => setTrailerOpen(true)} className={BUTTON_SECONDARY}><Film className="h-4 w-4" /> Trailer</button>}
              <TitleActions title={title} />
              <button type="button" onClick={() => void shareTitle()} className={BUTTON_SECONDARY}><Share2 className="h-4 w-4" /> Share</button>
            </div>
          </div>
        </div>
      </section>

      <div className={`${PAGE_CONTAINER} space-y-12`}>
        <section className="grid gap-4 sm:grid-cols-2">
          <a href="/friends" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/75 p-5 transition hover:border-cinema-400/35 hover:bg-ink-850"><span className="grid h-11 w-11 place-items-center rounded-xl bg-cinema-500/15 text-cinema-200"><Users className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Share with your friends</span><span className="mt-1 block text-sm text-slate-400">Bring your circle into the conversation.</span></span><MessageCircle className="h-5 w-5 text-slate-500 transition group-hover:text-cinema-200" /></a>
          <a href={`/watch-parties`} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/75 p-5 transition hover:border-cinema-400/35 hover:bg-ink-850"><span className="grid h-11 w-11 place-items-center rounded-xl bg-cinema-500/15 text-cinema-200"><Play className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Experience it together</span><span className="mt-1 block text-sm text-slate-400">Create or join a watch party.</span></span><ArrowLeft className="h-5 w-5 rotate-180 text-slate-500 transition group-hover:text-cinema-200" /></a>
        </section>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section className="space-y-4"><h2 className={SECTION_HEADING}>About this title</h2><p className="max-w-3xl text-base leading-relaxed text-slate-300">{title.synopsis || 'A synopsis has not been added for this title yet.'}</p></section>
            {titleShorts.length > 0 && <section className="space-y-5"><div><h2 className={SECTION_HEADING}>Shorts from this story</h2><p className="mt-1 text-sm text-slate-400">Short videos and first looks connected to {title.title}.</p></div><div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">{titleShorts.map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActiveShort} />)}</div></section>}
            {titleClips.length > 0 && <section className="space-y-4"><h2 className={SECTION_HEADING}>More from the publisher</h2><div className="grid gap-3 sm:grid-cols-2">{titleClips.map((clip) => <button key={clip.id} type="button" onClick={() => setActiveShort(clip)} className="rounded-xl border border-white/10 bg-ink-900 p-4 text-left transition hover:border-cinema-400/30"><p className="font-semibold text-white">{clip.headline}</p><p className="mt-1 line-clamp-2 text-sm text-slate-400">{clip.description}</p></button>)}</div></section>}
            {title.type === 'series' && <section className="space-y-5"><h2 className={SECTION_HEADING}>Episodes</h2><EpisodeList titleId={title.id} seasons={seasons} /></section>}
          </div>
          <aside className={`${CARD} h-fit space-y-4 text-sm`} aria-label="Title details">
            <DetailRow label="Type" value={TITLE_TYPE_LABELS[title.type]} />
            <DetailRow label="Publisher" value={title.publisher} href={title.publisher ? publisherHref(title.publisher) : undefined} />
            <DetailRow label="Release date" value={title.release_date ? new Date(title.release_date).toLocaleDateString() : title.release_year ? String(title.release_year) : ''} />
            <DetailRow label="Runtime" value={runtime} /><DetailRow label="Genre" value={title.genre} /><DetailRow label="Availability" value={title.availability} />
            <p className="pt-2 text-xs text-slate-500">{titleMeta(title)}</p>
          </aside>
        </div>
        <TitleRow heading="More like this" titles={related} />
      </div>
      {trailerOpen && <VideoDialog {...titleTrailerSource(title)} onClose={() => setTrailerOpen(false)} />}
      {activeShort && <ShortViewer clip={activeShort} onClose={() => setActiveShort(null)} />}
    </div>
  );
}

function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value) return null;
  return <div className="flex justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"><span className="text-slate-400">{label}</span>{href ? <a href={href} className="text-right font-semibold text-cinema-300 transition hover:text-white">{value}</a> : <span className="text-right font-semibold text-slate-100">{value}</span>}</div>;
}
