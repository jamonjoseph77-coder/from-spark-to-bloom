import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BadgeCheck, Clapperboard, MessageCircle, Play, Send } from 'lucide-react';
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
import { LetterboxPostCard } from '@/pages/LetterboxPage';
import { fetchVerifiedStudios } from '@/lib/studios';
import { publisherHref } from '@/lib/publishers';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { loadFriendsSnapshot } from '@/lib/friends';

type ExploreFilter = 'for-you' | 'following' | 'videos' | 'trailers' | 'community' | 'channels';

const EXPLORE_FILTERS: { id: ExploreFilter; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'following', label: 'Following' },
  { id: 'videos', label: 'Videos' },
  { id: 'trailers', label: 'Trailers' },
  { id: 'community', label: 'Community' },
  { id: 'channels', label: 'Channels' },
];

type ExploreEntry =
  | { id: string; kind: 'post'; createdAt: number; post: LetterboxPost }
  | { id: string; kind: 'clip'; createdAt: number; clip: DiscoverClip }
  | { id: string; kind: 'trailer'; createdAt: number; trailer: TmdbTrailer };

interface ExploreData {
  posts: LetterboxPost[];
  clips: DiscoverClip[];
  allClips: DiscoverClip[];
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
  const allClips = clipsResult.status === 'fulfilled' ? clipsResult.value : [];
  const clips = allClips.filter((clip) => {
      const playable = Boolean(clip.video_url && (isDirectVideoUrl(clip.video_url) || toEmbedUrl(clip.video_url)));
      // Keep approved Shorts in the dedicated Shorts shelf so the same video
      // is not repeated in both the vertical feed and the mixed Explore timeline.
      if (clip.kind === 'short') return false;
      if (clip.kind === 'clip') return isPlayableShort(clip);
      return playable;
    });
  const trailers = trailersResult.status === 'fulfilled' ? trailersResult.value : [];
  return {
    posts,
    clips,
    allClips,
    trailers,
    postsUnavailable: postsResult.status === 'rejected',
    clipsUnavailable: clipsResult.status === 'rejected',
  };
}

function PublisherVideoPost({ clip, verified, onOpenShort, onOpenVideo }: {
  clip: DiscoverClip;
  verified: boolean;
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
          <p className="flex items-center gap-1.5 truncate text-sm font-extrabold text-white">{publisher}{verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#b9d2c2]" aria-label="Verified by Cinema" />}</p>
          <p className="text-[11px] capitalize text-slate-500">{verified ? 'Verified Studio' : 'Publisher Video'} · {clip.kind.replace(/_/g, ' ')} · {clip.created_at ? new Date(clip.created_at).toLocaleDateString() : 'Cinema Video'}</p>
        </div>
        {verified ? <a href={publisherHref(publisher)} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#a8cbb6]/25 bg-[#a8cbb6]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#d2e4d8] transition hover:bg-[#a8cbb6]/20">Official Profile <BadgeCheck className="h-3 w-3" /></a> : <span className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Video</span>}
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

interface ExploreChannel {
  name: string;
  logoUrl: string | null;
  verified: boolean;
  titleCount: number;
  videoCount: number;
}

function ExploreChannelCard({ channel }: { channel: ExploreChannel }) {
  return (
    <a href={publisherHref(channel.name)} className="group flex min-w-[220px] max-w-[260px] items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e10] p-3 transition hover:border-cinema-300/35 hover:bg-[#101516] sm:min-w-[245px]" aria-label={`Open ${channel.name} channel`}>
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#18201f] text-base font-black text-white">
        {channel.logoUrl ? <img src={channel.logoUrl} alt="" loading="lazy" className="h-full w-full object-cover" /> : channel.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5"><span className="truncate text-sm font-extrabold text-white group-hover:text-cinema-100">{channel.name}</span>{channel.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-cinema-200" aria-label="Verified by Cinema" />}</span>
        <span className="mt-1 block truncate text-[11px] text-slate-400">{channel.titleCount} {channel.titleCount === 1 ? 'title' : 'titles'} · {channel.videoCount} {channel.videoCount === 1 ? 'video' : 'videos'}</span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-cinema-200">{channel.verified ? 'Verified Channel' : 'Publisher Channel'}</span>
      </span>
    </a>
  );
}
export function ExploreTimeline() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data, error, reload, loading } = useAsyncData(loadExploreData, []);
  const { data: titles } = useAsyncData(fetchPublishedTitles, []);
  const { data: verifiedStudios } = useAsyncData(() => fetchVerifiedStudios().catch(() => []), []);
  const { data: followedPublishers } = useAsyncData(() => user ? fetchFollowedPublishers(user.id) : Promise.resolve([] as string[]), [user?.id]);
  const { data: friends } = useAsyncData(() => user ? loadFriendsSnapshot(user.id).catch(() => ({ friends: [], incoming: [], outgoing: [], relations: new Map() })) : Promise.resolve(undefined), [user?.id]);
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>('for-you');
  const verifiedPublisherNames = useMemo(
    () => new Set((verifiedStudios ?? []).map((studio) => studio.studio_name.trim().toLocaleLowerCase())),
    [verifiedStudios],
  );
  const channels = useMemo<ExploreChannel[]>(() => {
    const byName = new Map<string, ExploreChannel>();
    const ensure = (rawName: string) => {
      const name = rawName.trim();
      if (!name) return null;
      const key = name.toLocaleLowerCase();
      const existing = byName.get(key);
      if (existing) return existing;
      const created: ExploreChannel = { name, logoUrl: null, verified: false, titleCount: 0, videoCount: 0 };
      byName.set(key, created);
      return created;
    };
    (titles ?? []).forEach((title) => { const channel = ensure(title.publisher ?? ''); if (channel) channel.titleCount += 1; });
    (data?.allClips ?? []).forEach((clip) => { const channel = ensure(clip.publisher_name ?? ''); if (channel) channel.videoCount += 1; });
    (verifiedStudios ?? []).forEach((studio) => {
      const channel = ensure(studio.studio_name);
      if (channel) { channel.verified = true; channel.logoUrl = studio.logo_url; }
    });
    return [...byName.values()].sort((a,b) => Number(b.verified)-Number(a.verified) || (b.titleCount+b.videoCount)-(a.titleCount+a.videoCount) || a.name.localeCompare(b.name));
  }, [titles, data?.allClips, verifiedStudios]);
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

  const visibleEntries = useMemo(() => {
    if (activeFilter === 'channels') return [];
    if (activeFilter === 'videos') return entries.filter((entry) => entry.kind === 'clip');
    if (activeFilter === 'trailers') return entries.filter((entry) => entry.kind === 'trailer');
    if (activeFilter === 'community') return entries.filter((entry) => entry.kind === 'post');
    if (activeFilter === 'for-you') return entries.filter((entry) => entry.kind !== 'post');
    if (activeFilter === 'following') {
      const publisherSet = new Set((followedPublishers ?? []).map((name) => name.trim().toLocaleLowerCase()));
      const friendSet = new Set((friends?.friends ?? []).map((friend) => friend.otherUserId));
      return entries.filter((entry) =>
        (entry.kind === 'clip' && publisherSet.has(entry.clip.publisher_name.trim().toLocaleLowerCase())) ||
        (entry.kind === 'post' && friendSet.has(entry.post.author_id)),
      );
    }
    return entries;
  }, [activeFilter, entries, followedPublishers, friends]);

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
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Your Cinema Video Feed</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">Discover videos from studios and creators, official trailers and stories worth watching. Switch to Following to catch new uploads from your circle.</p>
        </div>
        <a href="/publishers" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[.07] hover:text-white">Studios & Publishers <Clapperboard className="h-3.5 w-3.5" /></a>
      </header>

      <section className="mb-5 space-y-3" aria-labelledby="explore-channels-heading">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cinema-300">Creators · Studios · Broadcasters</p><h3 id="explore-channels-heading" className="mt-1 text-lg font-extrabold text-white">Channels On Cinema</h3><p className="mt-1 text-xs text-slate-400">Discover publishers, open their channel pages and explore their available stories.</p></div><a href="/publishers" className="text-xs font-bold text-cinema-200 transition hover:text-white">All Channels <Clapperboard className="ml-1 inline h-3.5 w-3.5" /></a></div>
        {channels.length > 0 ? <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{channels.slice(0,12).map((channel) => <ExploreChannelCard key={channel.name.toLocaleLowerCase()} channel={channel} />)}</div> : <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-xs text-slate-500">Publisher channels will appear here as verified profiles and published content become available.</p>}
      </section>

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

      <nav aria-label="Explore video feed filters" className="mb-5 flex gap-2 overflow-x-auto border-b border-white/[.08] pb-3 [scrollbar-width:none]">
        {EXPLORE_FILTERS.map((filter) => <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} aria-pressed={activeFilter === filter.id} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-200 ${activeFilter === filter.id ? 'border-cinema-200/35 bg-cinema-200/15 text-white shadow-[0_5px_20px_rgba(132,174,146,.1)]' : 'border-white/10 bg-white/[.025] text-slate-400 hover:border-white/20 hover:text-white'}`}>{filter.label}</button>)}
      </nav>
      {activeFilter === 'following' && !user && <p className="mb-4 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs text-slate-400">Sign in to see videos from the studios you follow and posts from your friends. <a href="/sign-in" className="font-bold text-cinema-200 hover:text-white">Sign In</a></p>}
      {activeFilter === 'following' && user && followedPublishers?.length === 0 && (friends?.friends.length ?? 0) === 0 && <p className="mb-4 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs text-slate-400">Follow a studio or connect with friends to build your Following feed. <a href="/publishers" className="font-bold text-cinema-200 hover:text-white">Find Studios</a> · <a href="/friends" className="font-bold text-cinema-200 hover:text-white">Find Friends</a></p>}

      {loading && !data && <div className="rounded-2xl border border-white/10 bg-[#0b0e10] p-6"><LoadingState label="Loading Cinema Explore" /></div>}
      {error && !data && <div className="rounded-2xl border border-white/10 bg-[#0b0e10] p-5"><ErrorState onRetry={reload} description="Cinema Explore could not load right now. Your other Cinema destinations remain available." /></div>}
      {data?.postsUnavailable && <p className="mb-4 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs text-slate-400">Community posts are temporarily unavailable. Publisher videos remain available.</p>}
      {data?.clipsUnavailable && <p className="mb-4 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs text-slate-400">Publisher videos are temporarily unavailable. Community posts remain available.</p>}
      {activeFilter === 'channels' && <section className="mb-5 space-y-4" aria-label="All Cinema channels"><div><h3 className="text-lg font-extrabold text-white">Explore Channels</h3><p className="mt-1 text-xs text-slate-400">Official profiles are marked as verified. Other publisher channels are identified from their published Cinema content.</p></div>{channels.length > 0 ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{channels.map((channel) => <ExploreChannelCard key={channel.name.toLocaleLowerCase()} channel={channel} />)}</div> : <EmptyState icon={<Clapperboard className="h-7 w-7 text-slate-300" />} title="Channels Are On Their Way" description="Channels will appear when verified organisations or publishers have content available on Cinema." />}</section>}
      {activeFilter !== 'channels' && data && visibleEntries.length === 0 && <div className="rounded-2xl border border-white/10 bg-[#0b0e10] p-7"><EmptyState icon={<MessageCircle className="h-7 w-7 text-slate-300" />} title={activeFilter === 'following' ? 'Your Following Feed Is Ready' : 'Your Video Home Is Getting Started'} description={activeFilter === 'following' ? 'New videos and conversations from the studios and friends you follow will appear here.' : 'Videos and official trailers from across Cinema will appear here as publishers and creators release them.'} /></div>}

      {data && visibleEntries.length > 0 && <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:gap-5">
        {visibleEntries.map((entry) => {
          if (entry.kind === 'post') return <div key={entry.id} className="cinema-explore-post col-span-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e10] shadow-[0_12px_36px_rgba(0,0,0,.16)]"><LetterboxPostCard post={entry.post} userId={user?.id} onChanged={() => void reload()} /></div>;
          if (entry.kind === 'clip') return <PublisherVideoPost key={entry.id} clip={entry.clip} verified={verifiedPublisherNames.has(entry.clip.publisher_name.trim().toLocaleLowerCase())} onOpenShort={openShort} onOpenVideo={setActiveVideo} />;
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
