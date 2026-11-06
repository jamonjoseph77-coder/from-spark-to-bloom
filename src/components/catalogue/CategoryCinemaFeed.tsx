import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, MessageCircle, Play, Sparkles, Users } from 'lucide-react';
import { ShortCard } from '@/components/discover/ShortCard';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';
import { Artwork } from '@/components/ui/Artwork';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { VideoDialog } from '@/components/player/VideoDialog';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { fetchPublishedClips, isPlayableShort, type DiscoverClip } from '@/lib/clips';
import { fetchLetterboxFeed, type LetterboxPost } from '@/lib/letterbox';
import { fetchPublishedTitles } from '@/lib/library';
import { loadFriendsActivity, type FriendsActivity } from '@/lib/friendActivity';
import { isDirectVideoUrl, toEmbedUrl } from '@/lib/media';
import { navigateTo } from '@/lib/router';
import type { Title } from '@/lib/types';

export type CinemaFeedCategory = 'movie' | 'series' | 'sport' | 'news' | 'live' | 'documentaries' | 'animation' | 'family' | 'reality';

interface FeedData {
  titles: Title[];
  clips: DiscoverClip[];
  posts: LetterboxPost[];
  friends: FriendsActivity;
  partialErrors: string[];
}

function matchesCategory(title: Title, category: CinemaFeedCategory): boolean {
  const genre = title.genre.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ');
  if (category === 'movie' || category === 'series' || category === 'sport' || category === 'news' || category === 'live') {
    return title.type === category;
  }
  if (category === 'documentaries') return (title.type === 'movie' || title.type === 'series') && /documentar|non fiction|factual/.test(genre);
  if (category === 'animation') return (title.type === 'movie' || title.type === 'series') && /animation|anime/.test(genre);
  if (category === 'family') return (title.type === 'movie' || title.type === 'series') && /family|kids|children/.test(genre);
  return (title.type === 'movie' || title.type === 'series') && /reality|unscripted/.test(genre);
}

async function loadCategoryFeed(userId?: string): Promise<FeedData> {
  const [titlesResult, clipsResult, postsResult, friendsResult] = await Promise.allSettled([
    fetchPublishedTitles(),
    fetchPublishedClips(),
    fetchLetterboxFeed(80),
    userId ? loadFriendsActivity(userId) : Promise.resolve({ watching: [], publishers: [] }),
  ]);
  const partialErrors = [
    titlesResult.status === 'rejected' ? 'titles' : '',
    clipsResult.status === 'rejected' ? 'videos' : '',
    postsResult.status === 'rejected' ? 'conversations' : '',
    friendsResult.status === 'rejected' ? 'friends' : '',
  ].filter(Boolean);
  return {
    titles: titlesResult.status === 'fulfilled' ? titlesResult.value : [],
    clips: clipsResult.status === 'fulfilled' ? clipsResult.value : [],
    posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
    friends: friendsResult.status === 'fulfilled' ? friendsResult.value : { watching: [], publishers: [] },
    partialErrors,
  };
}

function VideoShelf({ heading, clips, onOpen }: { heading: string; clips: DiscoverClip[]; onOpen: (clip: DiscoverClip) => void }) {
  if (!clips.length) return null;
  return (
    <section className="space-y-4">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-sky-200">Cinema Video</p><h3 className="mt-1 text-xl font-extrabold text-white">{heading}</h3></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {clips.slice(0, 9).map((clip) => (
          <button key={clip.id} type="button" onClick={() => onOpen(clip)} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] text-left transition hover:border-sky-200/35 hover:bg-white/[.045]">
            <div className="relative aspect-video overflow-hidden bg-black">
              <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-black"><Play className="h-4 w-4 fill-current" /></span>
            </div>
            <span className="block p-4"><span className="block truncate text-sm font-bold text-white">{clip.headline}</span><span className="mt-1 block truncate text-xs text-slate-400">{clip.publisher_name || 'Cinema Publisher'} · {clip.kind.replace(/_/g, ' ')}</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CategoryCinemaFeed({ category, label }: { category: CinemaFeedCategory; label: string }) {
  const { user } = useAuth();
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || shouldLoad) return;
    if (typeof IntersectionObserver === 'undefined') { setShouldLoad(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: '480px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);
  const feed = useAsyncData(() => shouldLoad ? loadCategoryFeed(user?.id) : Promise.resolve(null), [shouldLoad, user?.id]);
  const [activeVideo, setActiveVideo] = useState<DiscoverClip | null>(null);
  const data = feed.data;

  const scoped = useMemo(() => {
    if (!data) return { titles: [], clips: [], posts: [], watching: [] };
    const titles = data.titles.filter((title) => matchesCategory(title, category));
    const titleIds = new Set(titles.map((title) => title.id));
    const clips = data.clips.filter((clip) => clip.title_id && titleIds.has(clip.title_id)
      && (isDirectVideoUrl(clip.video_url) || Boolean(toEmbedUrl(clip.video_url))));
    const posts = data.posts.filter((post) => post.title_id && titleIds.has(post.title_id));
    const watching = data.friends.watching.filter((item) => titleIds.has(item.titleId));
    return { titles, clips, posts, watching };
  }, [data, category]);

  if (!shouldLoad) return <section ref={sectionRef} className="space-y-3 border-t border-white/10 pt-8"><h2 className="text-xl font-extrabold text-white">Inside {label}</h2><p className="text-sm text-slate-500">Your category conversations and videos load as you reach this section.</p></section>;
  if (feed.loading && !data) return <section ref={sectionRef} className="space-y-3"><h2 className="text-xl font-extrabold text-white">Inside {label}</h2><LoadingState label={`Connecting ${label.toLowerCase()} to Cinema`} /></section>;
  if (feed.error && !data) return <section ref={sectionRef} className="space-y-3"><h2 className="text-xl font-extrabold text-white">Inside {label}</h2><ErrorState onRetry={feed.reload} /></section>;

  const shorts = scoped.clips.filter(isPlayableShort);
  const trailers = scoped.clips.filter((clip) => clip.kind === 'trailer');
  const extras = scoped.clips.filter((clip) => clip.kind !== 'short' && clip.kind !== 'trailer');
  const openVideo = (clip: DiscoverClip) => setActiveVideo(clip);

  return (
    <section ref={sectionRef} className="space-y-10 border-t border-white/10 pt-8" aria-label={`${label} Cinema Feed`}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-sky-200"><Sparkles className="h-3.5 w-3.5" /> One Connected Cinema</p><h2 className="mt-1 text-2xl font-black text-white">Inside {label}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">Conversations, official videos, Shorts and what your circle is watching—connected to the same Cinema titles.</p></div>
        <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-xs text-slate-400">{scoped.titles.length} Linked Titles</span>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-sky-200" /><h3 className="text-xl font-extrabold text-white">Your Circle Is Watching</h3></div>
        {scoped.watching.length ? <div className="flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {scoped.watching.slice(0, 12).map((item) => <a key={item.friendId + item.titleId} href={`/title/${item.titleId}`} className="w-36 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] transition hover:border-sky-200/35 sm:w-44"><Artwork src={item.posterUrl} alt="" fallbackTitle={item.titleName} className="aspect-[3/4] w-full object-cover" /><span className="block p-3"><span className="block truncate text-xs font-bold text-white">{item.titleName}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{item.friendName} Is Watching</span></span></a>)}
        </div> : <p className="rounded-xl border border-white/8 bg-white/[.02] p-4 text-sm text-slate-500">When friends share their watching activity, titles from this category will appear here.</p>}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-sky-200" /><h3 className="text-xl font-extrabold text-white">Conversations Around {label}</h3></div>
        {scoped.posts.length ? <div className="grid gap-3 lg:grid-cols-2">
          {scoped.posts.slice(0, 12).map((post) => <article key={post.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><ProfileAvatar name={post.author?.display_name || post.author?.username || 'Cinema Member'} imageUrl={post.author?.avatar_url} size="sm" /><span className="truncate text-xs font-bold text-white">{post.author?.display_name || post.author?.username || 'Cinema Member'}</span></div><span className="text-[10px] text-slate-500">{new Date(post.created_at).toLocaleDateString()}</span></div>
            <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.body}</p>
            {post.title && <a href={`/title/${post.title.id}`} className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-sky-200/30"><Artwork src={post.title.poster_url} alt="" fallbackTitle={post.title.title} className="h-14 w-10 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase text-sky-200">Discussing</span><span className="block truncate text-xs font-bold text-white">{post.title.title}</span></span><ArrowUpRight className="h-4 w-4 text-slate-500" /></a>}
          </article>)}
        </div> : <p className="rounded-xl border border-white/8 bg-white/[.02] p-4 text-sm text-slate-500">No title-linked conversations in this category yet. Conversations will appear here as people discuss Cinema titles.</p>}
      </section>

      <VideoShelf heading={`Official Trailers & Previews`} clips={trailers} onOpen={openVideo} />
      <VideoShelf heading={`Behind The Scenes, Interviews & Clips`} clips={extras} onOpen={openVideo} />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-sky-200">Vertical Video</p><h3 className="mt-1 text-xl font-extrabold text-white">{label} Shorts</h3></div><a href="/shorts" className="text-xs font-bold text-sky-200 hover:text-white">Open All Shorts <ArrowUpRight className="inline h-3.5 w-3.5" /></a></div>
        {shorts.length ? <div className="flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{shorts.slice(0, 12).map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={() => navigateTo(`/shorts?clip=${encodeURIComponent(clip.id)}`)} />)}</div> : <p className="rounded-xl border border-white/8 bg-white/[.02] p-4 text-sm text-slate-500">No title-linked Shorts in this category yet. Approved Shorts will appear here automatically when connected to a Cinema title.</p>}
      </section>

      {data?.partialErrors.length ? <p className="text-[11px] text-slate-500">Some Cinema feed sections could not refresh. Other sections remain available.</p> : null}
      {activeVideo && <VideoDialog url={activeVideo.video_url} label={activeVideo.headline} heading={activeVideo.title?.title || activeVideo.publisher_name || label} onClose={() => setActiveVideo(null)} />}
    </section>
  );
}
