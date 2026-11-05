import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Compass, MessageCircle, Play, Send } from 'lucide-react';
import { ClipCard } from '@/components/discover/ClipCard';
import { ShortCard } from '@/components/discover/ShortCard';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { VideoDialog } from '@/components/player/VideoDialog';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchPublishedClips, isPlayableShort, type DiscoverClip } from '@/lib/clips';
import { fetchLetterboxFeed, createLetterboxPost, subscribeToLetterbox, type LetterboxPost } from '@/lib/letterbox';
import { fetchPublishedTitles } from '@/lib/library';
import { loadFriendsSnapshot } from '@/lib/friends';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { fetchDiscoverTrailers, tmdbImageUrl, type TmdbTrailer } from '@/lib/tmdb';
import { isDirectVideoUrl, toEmbedUrl } from '@/lib/media';
import { LetterboxPostCard } from '@/pages/LetterboxPage';

type ExploreMode = 'for-you' | 'following' | 'titles';
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
    <article id={isShort ? `short-${clip.id}` : undefined} className="border-b border-white/10 bg-[#07090d] px-4 py-4 transition-colors hover:bg-white/[.018] sm:px-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-[#111821] text-sm font-black text-white">{publisher.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-white">{publisher}</p>
          <p className="text-xs text-slate-500">{clip.kind.replace(/_/g, ' ')} · {clip.created_at ? new Date(clip.created_at).toLocaleDateString() : 'Cinema Video'}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Video</span>
      </div>
      <div className={isShort ? 'pl-0 sm:pl-[3.25rem]' : 'pl-0 sm:pl-[3.25rem]'}>
        {isShort
          ? <div className="space-y-2"><ShortCard clip={clip} onOpen={onOpenShort} /><p className="max-w-sm text-xs leading-5 text-slate-400">{clip.description}</p></div>
          : <ClipCard clip={clip} onOpen={onOpenVideo} />}
      </div>
    </article>
  );
}

function OfficialTrailerPost({ trailer, onOpen }: { trailer: TmdbTrailer; onOpen: (trailer: TmdbTrailer) => void }) {
  const image = tmdbImageUrl(trailer.backdropPath || trailer.posterPath, 'w780');
  return (
    <article className="border-b border-white/10 bg-[#07090d] px-4 py-4 transition-colors hover:bg-white/[.018] sm:px-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sky-300/20 bg-sky-300/10 text-sky-100"><Play className="h-4 w-4 fill-current" /></span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-white">Official Video</p><p className="text-xs text-slate-500">Studio-identified YouTube trailer</p></div>
        <span className="rounded-full border border-sky-300/15 bg-sky-300/[.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-100">Official</span>
      </div>
      <div className="sm:pl-[3.25rem]">
        <p className="mb-3 text-sm text-slate-100">{trailer.videoName}</p>
        <button type="button" onClick={() => onOpen(trailer)} className="group relative block aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
          {image && <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />}
          <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
          <span className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3"><span><span className="block text-lg font-extrabold text-white">{trailer.title}</span><span className="mt-1 block text-xs text-slate-300">{trailer.releaseDate?.slice(0, 4) || 'Movie & Television'}</span></span><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#087cff] text-white shadow-xl"><Play className="h-5 w-5 fill-current" /></span></span>
        </button>
      </div>
    </article>
  );
}

export function ExploreTimeline() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data, error, reload, loading } = useAsyncData(loadExploreData, []);
  const { data: titles } = useAsyncData(fetchPublishedTitles, []);
  const { data: social } = useAsyncData(async () => {
    if (!user) return { friendIds: [] as string[], followedPublishers: [] as string[] };
    const [friendsResult, followsResult] = await Promise.allSettled([loadFriendsSnapshot(user.id), fetchFollowedPublishers(user.id)]);
    return {
      friendIds: friendsResult.status === 'fulfilled' ? friendsResult.value.friends.map((friend) => friend.otherUserId) : [],
      followedPublishers: followsResult.status === 'fulfilled' ? followsResult.value : [],
    };
  }, [user?.id]);
  const [mode, setMode] = useState<ExploreMode>('for-you');
  const [body, setBody] = useState('');
  const [titleId, setTitleId] = useState('');
  const [posting, setPosting] = useState(false);
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);
  const [activeVideo, setActiveVideo] = useState<DiscoverClip | null>(null);
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
    const posts = data.posts
      .filter((post) => mode !== 'titles' || Boolean(post.title_id))
      .filter((post) => mode !== 'following' || Boolean(social?.friendIds.includes(post.author_id)))
      .map((post): ExploreEntry => ({ id: `post:${post.id}`, kind: 'post', createdAt: Date.parse(post.created_at) || 0, post }));
    const clips = data.clips
      .filter((clip) => mode !== 'titles' || Boolean(clip.title_id))
      .filter((clip) => mode !== 'following' || Boolean(social?.followedPublishers.some((name) => name.toLowerCase() === (clip.publisher_name ?? '').toLowerCase())))
      .map((clip): ExploreEntry => ({ id: `clip:${clip.id}`, kind: 'clip', createdAt: Date.parse(clip.created_at ?? '') || 0, clip }));
    const trailers = mode === 'for-you'
      ? data.trailers.map((trailer): ExploreEntry => ({ id: `trailer:${trailer.mediaType}:${trailer.id}`, kind: 'trailer', createdAt: Date.parse(trailer.releaseDate ?? '') || 0, trailer }))
      : [];
    return [...posts, ...clips, ...trailers].sort((a, b) => b.createdAt - a.createdAt);
  }, [data, mode, social]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return notify('Sign in to share a post in Explore.', 'error');
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

  const closeShort = () => setActiveShort(null);
  const closeVideo = () => setActiveVideo(null);
  const closeTrailer = () => setActiveTrailer(null);

  return (
    <section aria-label="Cinema Explore Timeline" className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#07090d] shadow-2xl shadow-black/20">
      <header className="border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-2"><Compass className="h-4 w-4 text-sky-200" /><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-300">Cinema Explore</p></div>
        <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">The Latest From Cinema</h2>
        <p className="mt-1 text-xs leading-5 text-slate-400">Creator videos, official previews and conversations in one place.</p>
        <nav aria-label="Explore timeline filters" className="mt-4 flex border-t border-white/[.06]">
          {[{ id: 'for-you', label: 'For You' }, { id: 'following', label: 'Following' }, { id: 'titles', label: 'About Titles' }].map((item) => (
            <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => setMode(item.id as ExploreMode)} className={`flex-1 border-b-2 py-3 text-center text-xs font-bold transition ${mode === item.id ? 'border-[#168cff] text-white' : 'border-transparent text-slate-500 hover:bg-white/[.025] hover:text-slate-200'}`}>{item.label}</button>
          ))}
        </nav>
      </header>

      {user && <form onSubmit={(event) => void publish(event)} className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#142238] text-sm font-black text-white">{(user.email?.slice(0, 1) || 'C').toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <label htmlFor="cinema-explore-post" className="sr-only">Share with Cinema</label>
            <textarea id="cinema-explore-post" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={3} placeholder="Share A Thought, Recommendation Or Moment…" className="w-full resize-y rounded-xl border border-white/10 bg-white/[.035] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/40 focus:ring-2 focus:ring-sky-200/10" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select aria-label="Attach a title" value={titleId} onChange={(event) => setTitleId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#10151e] px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-200/40">
                <option value="">No Title Attached</option>
                {(titles ?? []).map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}
              </select>
              <span className="text-[10px] text-slate-500">{body.length}/2000</span>
              <button type="submit" disabled={!body.trim() || posting} className="inline-flex items-center gap-2 rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#168cff] disabled:opacity-50"><Send className="h-3.5 w-3.5" /> {posting ? 'Sharing…' : 'Post'}</button>
            </div>
          </div>
        </div>
      </form>}

      {loading && !data && <div className="p-6"><LoadingState label="Loading your Cinema Explore timeline" /></div>}
      {error && !data && <div className="p-5"><ErrorState onRetry={reload} description="Cinema Explore could not load the timeline. Your other Cinema areas remain available." /></div>}
      {data?.postsUnavailable && <p className="border-b border-white/10 px-5 py-3 text-xs text-slate-500">Community posts are temporarily unavailable. Videos remain available below.</p>}
      {data?.clipsUnavailable && <p className="border-b border-white/10 px-5 py-3 text-xs text-slate-500">Publisher videos are temporarily unavailable. Community posts remain available.</p>}
      {data && entries.length === 0 && <div className="p-6"><EmptyState icon={<MessageCircle className="h-7 w-7 text-sky-200" />} title={mode === 'following' ? 'Your Following Timeline Is Quiet' : 'The Conversation Starts Here'} description={mode === 'following' ? 'Posts from friends and videos from publishers you track will appear here.' : 'Posts, official videos and creator clips will appear together as they are published.'} /></div>}

      {data && entries.map((entry) => {
        if (entry.kind === 'post') return <LetterboxPostCard key={entry.id} post={entry.post} userId={user?.id} onChanged={() => void reload()} />;
        if (entry.kind === 'clip') return <PublisherVideoPost key={entry.id} clip={entry.clip} onOpenShort={setActiveShort} onOpenVideo={setActiveVideo} />;
        return <OfficialTrailerPost key={entry.id} trailer={entry.trailer} onOpen={setActiveTrailer} />;
      })}

      <footer className="border-t border-white/[.06] px-4 py-4 text-center sm:px-5">
        <p className="text-xs text-slate-500">Cinema Brings Stories, Videos And People Together.</p>
        <a href="/publishers" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-200 hover:text-white">Discover Studios & Publishers <ArrowRight className="h-3 w-3" /></a>
      </footer>

      {activeShort && <ShortViewer clip={activeShort} onClose={closeShort} />}
      {activeVideo && <VideoDialog url={activeVideo.video_url} label={activeVideo.headline} heading={activeVideo.publisher_name || 'Cinema Video'} onClose={closeVideo} />}
      {activeTrailer && <VideoDialog url={`https://www.youtube.com/watch?v=${activeTrailer.videoKey}`} label={activeTrailer.videoName} heading={activeTrailer.title} onClose={closeTrailer} />}
    </section>
  );
}
