import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Clapperboard, MessageCircle, Play, Send } from 'lucide-react';
import { ClipCard } from '@/components/discover/ClipCard';
import { ShortCard } from '@/components/discover/ShortCard';
import { VideoDialog } from '@/components/player/VideoDialog';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchPublishedClips, isPlayableShort, type DiscoverClip } from '@/lib/clips';
import { fetchLetterboxFeed, createLetterboxPost, subscribeToLetterbox, type LetterboxPost } from '@/lib/letterbox';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchDiscoverTrailers, tmdbImageUrl, type TmdbTrailer } from '@/lib/tmdb';
import { isDirectVideoUrl, toEmbedUrl } from '@/lib/media';
import { navigateTo } from '@/lib/router';
import { LetterboxPostCard } from '@/pages/LetterboxPage';

type ExploreEntry =
  | { id: string; kind: 'post'; createdAt: number; post: LetterboxPost }
  | { id: string; kind: 'clip'; createdAt: number; clip: DiscoverClip }
  | { id: string; kind: 'trailer'; createdAt: number; trailer: TmdbTrailer };

interface ExploreData {
  posts: LetterboxPost[];
  clips: DiscoverClip[];
  trailers: TmdbTrailer[];
  postsUnavailable: boolean;
  clipsUnavailable: boolean;
}

async function loadExploreData(): Promise<ExploreData> {
  const [postsResult, clipsResult, trailersResult] = await Promise.allSettled([
    fetchLetterboxFeed(60),
    fetchPublishedClips(),
    fetchDiscoverTrailers(2),
  ]);
  const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
  const clips = clipsResult.status === 'fulfilled'
    ? clipsResult.value.filter((clip) => {
      const playable = Boolean(clip.video_url && (isDirectVideoUrl(clip.video_url) || toEmbedUrl(clip.video_url)));
      if (clip.kind === 'short' || clip.kind === 'clip') return isPlayableShort(clip);
      return playable;
    })
    : [];
  const trailers = trailersResult.status === 'fulfilled' ? trailersResult.value : [];
  return {
    posts,
    clips,
    trailers,
    postsUnavailable: postsResult.status === 'rejected',
    clipsUnavailable: clipsResult.status === 'rejected',
  };
}

function PublisherVideoPost({ clip, onOpenShort, onOpenVideo }: {
  clip: DiscoverClip;
  onOpenShort: (clip: DiscoverClip) => void;
  onOpenVideo: (clip: DiscoverClip) => void;
}) {
  const isShort = (clip.kind === 'short' || clip.kind === 'clip') && isPlayableShort(clip);
  const publisher = clip.publisher_name?.trim() || 'Cinema Publisher';
  return (
    <article id={isShort ? `short-${clip.id}` : undefined} className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e10] p-3 shadow-[0_12px_36px_rgba(0,0,0,.16)] transition duration-300 hover:border-white/20 hover:bg-[#0e1214] sm:p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-[#18201f] text-sm font-black text-white">{publisher.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-white">{publisher}</p>
          <p className="text-[11px] capitalize text-slate-500">{clip.kind.replace(/_/g, ' ')} · {clip.created_at ? new Date(clip.created_at).toLocaleDateString() : 'Cinema Video'}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Video</span>
      </div>
      {isShort ? (
        <div className="flex items-start gap-3 sm:gap-4">
          <ShortCard clip={clip} onOpen={onOpenShort} />
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="text-sm font-bold leading-5 text-white">{clip.headline}</h3>
            {clip.description && <p className="mt-2 line-clamp-5 text-xs leading-5 text-slate-400">{clip.description}</p>}
            <p className="mt-3 text-[11px] text-slate-500">{(clip.views_count ?? 0).toLocaleString()} Views</p>
          </div>
        </div>
      ) : (
        <ClipCard clip={clip} onOpen={onOpenVideo} />
      )}
    </article>
  );
}

function OfficialTrailerPost({ trailer, onOpen }: { trailer: TmdbTrailer; onOpen: (trailer: TmdbTrailer) => void }) {
  const image = tmdbImageUrl(trailer.backdropPath || trailer.posterPath, 'w780');
  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e10] p-3 shadow-[0_12px_36px_rgba(0,0,0,.16)] transition duration-300 hover:border-white/20 sm:p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-[#18201f] text-white"><Play className="h-4 w-4 fill-current" /></span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-white">Official Video</p><p className="text-[11px] text-slate-500">Trailer Preview · {trailer.releaseDate?.slice(0, 4) || 'Cinema'}</p></div>
        <span className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Trailer</span>
      </div>
      <button type="button" onClick={() => onOpen(trailer)} className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
        {image && <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />
        <span className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3"><span className="min-w-0"><span className="block truncate text-base font-extrabold text-white">{trailer.title}</span><span className="mt-1 block truncate text-xs text-slate-300">{trailer.videoName}</span></span><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-black shadow-xl"><Play className="h-4 w-4 fill-current" /></span></span>
      </button>
    </article>
  );
}

export function ExploreTimeline() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data, error, reload, loading } = useAsyncData(loadExploreData, []);
  const { data: titles } = useAsyncData(fetchPublishedTitles, []);
  const [body, setBody] = useState('');
  const [titleId, setTitleId] = useState('');
  const [posting, setPosting] = useState(false);
  const openShort = (clip: DiscoverClip) => setActiveShort(clip);
  const [activeVideo, setActiveVideo] = useState<DiscoverClip | null>(null);
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);
  const [activeTrailer, setActiveTrailer] = useState<TmdbTrailer | null>(null);

  useEffect(() => subscribeToLetterbox(reload), [reload]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reload]);

  const entries = useMemo<ExploreEntry[]>(() => {
    if (!data) return [];
    const posts = data.posts.map((post): ExploreEntry => ({
      id: `post:${post.id}`, kind: 'post', createdAt: Date.parse(post.created_at) || 0, post,
    }));
    const clips = data.clips.map((clip): ExploreEntry => ({
      id: `clip:${clip.id}`, kind: 'clip', createdAt: Date.parse(clip.created_at ?? '') || 0, clip,
    }));
    const trailers = data.trailers.map((trailer): ExploreEntry => ({
      id: `trailer:${trailer.mediaType}:${trailer.id}`, kind: 'trailer',
      createdAt: Date.parse(trailer.releaseDate ?? '') || 0, trailer,
    }));
    return [...posts, ...clips, ...trailers].sort((a, b) => b.createdAt - a.createdAt);
  }, [data]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return notify('Sign in to share a post in Cinema Explore.', 'error');
    const message = body.trim();
    if (!message || posting) return;
    setPosting(true);
    try {
      await createLetterboxPost(user.id, message, titleId || null);
      setBody('');
      setTitleId('');
      await reload();
      notify('Your post is now in Cinema Explore.');
    } catch {
      notify('Your post could not be published. Please try again.', 'error');
    } finally {
      setPosting(false);
    }
  }

  return (
    <section aria-label="Cinema Explore Home" className="cinema-explore-home mx-auto w-full max-w-[92rem]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Cinema · Discover</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Explore Stories, Videos & Conversations</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">Watch previews, discover publishers, share a thought and find the stories behind every screen.</p>
        </div>
        <a href="/publishers" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[.07] hover:text-white">Studios & Publishers <Clapperboard className="h-3.5 w-3.5" /></a>
      </header>

      {user && <form onSubmit={(event) => void publish(event)} className="mb-5 rounded-2xl border border-white/10 bg-[#0b0e10] p-4 shadow-[0_12px_36px_rgba(0,0,0,.16)] sm:p-5">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-[#18201f] text-sm font-black text-white">{(user.email?.slice(0, 1) || 'C').toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <label htmlFor="cinema-explore-post" className="sr-only">Share with Cinema</label>
            <textarea id="cinema-explore-post" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={2} placeholder="Share A Thought, Recommendation Or Moment…" className="w-full resize-y rounded-xl border border-white/10 bg-white/[.025] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/25 focus:ring-2 focus:ring-white/[.04]" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select aria-label="Attach a title" value={titleId} onChange={(event) => setTitleId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101413] px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-white/25">
                <option value="">Attach A Title (Optional)</option>
                {(titles ?? []).map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}
              </select>
              <span className="text-[10px] text-slate-500">{body.length}/2000</span>
              <button type="submit" disabled={!body.trim() || posting} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2.5 text-xs font-extrabold text-[#080a0a] transition hover:bg-slate-200 disabled:opacity-50"><Send className="h-3.5 w-3.5" /> {posting ? 'Sharing…' : 'Post'}</button>
            </div>
          </div>
        </div>
      </form>}

      {loading && !data && <div className="rounded-2xl border border-white/10 bg-[#0b0e10] p-6"><LoadingState label="Loading Cinema Explore" /></div>}
      {error && !data && <div className="rounded-2xl border border-white/10 bg-[#0b0e10] p-5"><ErrorState onRetry={reload} description="Cinema Explore could not load right now. Your other Cinema destinations remain available." /></div>}
      {data?.postsUnavailable && <p className="mb-4 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs text-slate-400">Community posts are temporarily unavailable. Publisher videos remain available.</p>}
      {data?.clipsUnavailable && <p className="mb-4 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs text-slate-400">Publisher videos are temporarily unavailable. Community posts remain available.</p>}
      {data && entries.length === 0 && <div className="rounded-2xl border border-white/10 bg-[#0b0e10] p-7"><EmptyState icon={<MessageCircle className="h-7 w-7 text-slate-300" />} title="Your Cinema Explore Starts Here" description="Official videos, creator posts and entertainment conversations will appear together as they are published." /></div>}

      {data && entries.length > 0 && <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:gap-5">
        {entries.map((entry) => {
          if (entry.kind === 'post') return <div key={entry.id} className="cinema-explore-post col-span-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e10] shadow-[0_12px_36px_rgba(0,0,0,.16)]"><LetterboxPostCard post={entry.post} userId={user?.id} onChanged={() => void reload()} /></div>;
          if (entry.kind === 'clip') return <PublisherVideoPost key={entry.id} clip={entry.clip} onOpenShort={openShort} onOpenVideo={setActiveVideo} />;
          return <OfficialTrailerPost key={entry.id} trailer={entry.trailer} onOpen={setActiveTrailer} />;
        })}
      </div>}

      <footer className="mt-6 border-t border-white/[.07] px-2 py-4 text-center">
        <p className="text-xs text-slate-500">Entertainment, People And Stories — Together On Cinema.</p>
      </footer>

      {activeShort && <ShortViewer clip={activeShort} onClose={() => setActiveShort(null)} />}
      {activeVideo && <VideoDialog url={activeVideo.video_url} label={activeVideo.headline} heading={activeVideo.publisher_name || 'Cinema Video'} contentKey={`clip:${activeVideo.id}`} imageUrl={activeVideo.poster_url} onClose={() => setActiveVideo(null)} />}
      {activeTrailer && <VideoDialog url={`https://www.youtube.com/watch?v=${activeTrailer.videoKey}`} label={activeTrailer.videoName} heading={activeTrailer.title} contentKey={`trailer:${activeTrailer.mediaType}:${activeTrailer.id}`} imageUrl={activeTrailer.backdropPath || activeTrailer.posterPath || undefined} onClose={() => setActiveTrailer(null)} />}
    </section>
  );
}
