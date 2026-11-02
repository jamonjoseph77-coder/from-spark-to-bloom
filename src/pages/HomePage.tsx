import { useMemo, useState } from 'react';
import { ArrowRight, Clapperboard, Compass, MessageCircle, Play, Users } from 'lucide-react';
import { ContinueWatchingRow } from '@/components/catalogue/ContinueWatchingRow';
import { ShortCard } from '@/components/discover/ShortCard';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { TmdbHero } from '@/components/tmdb/TmdbHero';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import { LoadingState } from '@/components/ui/StatusViews';
import { PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { progressRatioByTitle, resumeItems, titlesOfType } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchPublishedClips, type DiscoverClip } from '@/lib/clips';
import { fetchLetterboxFeed, type LetterboxPost } from '@/lib/letterbox';
import { loadFriendsSnapshot, type FriendsSnapshot } from '@/lib/friends';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { groupByPublisher } from '@/lib/publishers';
import type { Title } from '@/lib/types';

interface HomeSocial { friends: FriendsSnapshot['friends']; posts: LetterboxPost[]; follows: string[] }
async function loadHomeSocial(userId: string): Promise<HomeSocial> {
  const [friendsResult, postsResult, followsResult] = await Promise.allSettled([loadFriendsSnapshot(userId), fetchLetterboxFeed(24), fetchFollowedPublishers(userId)]);
  const friends = friendsResult.status === 'fulfilled' ? friendsResult.value.friends : [];
  const friendIds = new Set(friends.map((friend) => friend.otherUserId));
  const posts = postsResult.status === 'fulfilled' ? postsResult.value.filter((post) => friendIds.has(post.author_id)).slice(0, 4) : [];
  const follows = followsResult.status === 'fulfilled' ? followsResult.value : [];
  return { friends, posts, follows };
}

function HomeCommunity({ social, loading }: { social?: HomeSocial | null; loading: boolean }) {
  if (loading && !social) return <section className="rounded-3xl border border-white/8 bg-white/[.025] p-6"><LoadingState label="Loading your Cinema circle" /></section>;
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-cinema-300">Your Cinema, together</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Your circle</h2><p className="mt-1 text-sm text-slate-400">People you connect with and the stories they are sharing.</p></div><a href="/friends" className="inline-flex items-center gap-2 text-sm font-bold text-cinema-200 transition hover:text-white">Open Friends <ArrowRight className="h-4 w-4" /></a></div>
      <div className="grid gap-4 lg:grid-cols-[.85fr_1.4fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-400/[.10] via-ink-900/90 to-ink-950 p-5">
          <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">Your friends</span><Users className="h-4 w-4 text-cinema-200" /></div>
          {social?.friends.length ? <div className="mt-5 flex flex-wrap gap-3">{social.friends.slice(0, 8).map((friend) => { const name = friend.profile?.display_name || friend.profile?.username || 'Cinema member'; return <a key={friend.otherUserId} href="/friends" title={name} className="group flex w-[4.5rem] flex-col items-center gap-2 text-center"><span className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-sky-300/25 to-slate-700/50 text-sm font-black text-white shadow-lg shadow-black/20 transition group-hover:border-sky-300/50">{name.slice(0,1).toUpperCase()}</span><span className="w-full truncate text-[11px] font-semibold text-slate-300 group-hover:text-white">{name}</span></a>; })}</div> : <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-4"><p className="text-sm text-slate-300">Your circle starts here.</p><p className="mt-1 text-xs leading-5 text-slate-500">Find friends and build a space around the entertainment you enjoy.</p><a href="/friends" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cinema-200 hover:text-white">Find people <ArrowRight className="h-3.5 w-3.5" /></a></div>}
          <a href="/watch-parties" className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-semibold text-slate-200 transition hover:border-sky-300/30 hover:bg-black/30"><Play className="h-4 w-4 text-cinema-200" /> Plan a watch party <ArrowRight className="ml-auto h-4 w-4 text-slate-500" /></a>
        </div>
        <div className="space-y-3">
          {social?.posts.length ? social.posts.map((post) => <article key={post.id} className="rounded-2xl border border-white/10 bg-ink-900/75 p-4 transition hover:border-sky-300/20"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-sky-300/10 text-xs font-black text-cinema-200">{(post.author?.display_name || post.author?.username || 'C').slice(0,1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{post.author?.display_name || post.author?.username || 'Cinema member'}</p><p className="text-[10px] text-slate-500">Shared a Letterbox message · {new Date(post.created_at).toLocaleDateString()}</p></div><MessageCircle className="h-4 w-4 text-cinema-300" /></div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.body}</p>{post.title && <a href={`/title/${post.title.id}`} className="mt-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] p-2.5 transition hover:border-sky-300/25"><span className="h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-ink-800">{post.title.poster_url && <img src={post.title.poster_url} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-cinema-300">Talking about</span><span className="block truncate text-xs font-bold text-white">{post.title.title}</span></span><ArrowRight className="ml-auto h-4 w-4 text-slate-500" /></a>}</article>) : <div className="flex h-full min-h-44 flex-col justify-center rounded-2xl border border-dashed border-white/10 bg-white/[.015] p-5"><p className="text-sm font-bold text-white">Friends’ conversations will appear here</p><p className="mt-1 max-w-md text-xs leading-5 text-slate-500">When your friends share a Letterbox message about a title, you’ll see it in this space.</p><a href="/friends" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cinema-200 hover:text-white">Visit Friends <ArrowRight className="h-3.5 w-3.5" /></a></div>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-ink-900/65 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold text-white">Your follows</p><p className="mt-1 text-xs text-slate-500">Studios and publishers you choose to keep up with.</p></div><a href="/publishers" className="text-xs font-bold text-cinema-200 hover:text-white">Discover publishers</a></div>
        {social?.follows.length ? <div className="mt-3 flex flex-wrap gap-2">{social.follows.map((name) => <a key={name} href={`/publishers/${encodeURIComponent(name)}`} className="rounded-full border border-sky-300/20 bg-sky-300/[.07] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-300/40 hover:bg-sky-300/[.12]">{name}</a>)}</div> : <p className="mt-3 text-xs text-slate-500">You haven’t followed a publisher yet. Explore publisher destinations to find the studios and broadcasters you want to hear from.</p>}
      </div>
    </section>
  );
}

function PublisherDestinations({ titles }: { titles: Title[] }) {
  const publishers = useMemo(() => groupByPublisher(titles).slice(0, 5), [titles]);
  if (!publishers.length) return null;
  return <section className="space-y-4"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">The people behind the stories</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Publisher destinations</h2><p className="mt-1 text-sm text-slate-400">Explore studios, broadcasters and publishers represented in Cinema’s catalogue.</p></div><a href="/publishers" className="text-sm font-semibold text-cinema-200 hover:text-white">All publishers</a></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{publishers.map((publisher) => <a key={publisher.name} href={`/publishers/${encodeURIComponent(publisher.name)}`} className="group rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-sky-300/[.045]"><span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/15 bg-sky-300/[.08] text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="mt-3 block truncate text-sm font-bold text-white">{publisher.name}</span><span className="mt-1 block text-xs text-slate-500">{publisher.titles.length} {publisher.titles.length === 1 ? 'title' : 'titles'} in Cinema</span></a>)}</div></section>;
}

export function HomePage() {
  const { user } = useAuth();
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);
  const { progress } = useLibrary();
  const { data: titles } = useAsyncData(() => fetchPublishedTitles().catch((error) => { console.warn('Cinema licensed catalogue is temporarily unavailable', error); return []; }), []);
  const { data: publishedClips = [] } = useAsyncData(() => fetchPublishedClips().catch((error) => { console.warn('Cinema Shorts are temporarily unavailable', error); return []; }), []);
  const shorts = useMemo(() => publishedClips.filter((clip) => clip.kind === 'short'), [publishedClips]);
  const { data: social, loading: socialLoading } = useAsyncData(() => user ? loadHomeSocial(user.id) : Promise.resolve(undefined), [user?.id]);
  const cinemaShelves = useMemo(() => {
    if (!titles) return null;
    return { movies: titlesOfType(titles, 'movie'), series: titlesOfType(titles, 'series'), resume: resumeItems(progress, titles), ratios: progressRatioByTitle(progress) };
  }, [titles, progress]);

  return (
    <div className={`${PAGE_CONTAINER} space-y-10 pb-14 sm:space-y-14`}>
      <TmdbHero />
      {shorts.length > 0 && <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">Quick stories</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Cinema Shorts</h2><p className="mt-1 text-sm text-slate-400">Short videos and moments from official Cinema publishers.</p></div>
          <a href="/discover?tab=shorts" className="text-sm font-semibold text-cinema-200 transition hover:text-white">Explore all Shorts</a>
        </div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {shorts.slice(0, 12).map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActiveShort} />)}
        </div>
      </section>}
      {user && <HomeCommunity social={social} loading={socialLoading} />}
      {cinemaShelves?.resume.length ? <ContinueWatchingRow items={cinemaShelves.resume} /> : null}
      <PublisherDestinations titles={titles ?? []} />
      <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cinema-300">A world of stories</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Find your next favourite.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Explore real movie and series information, official trailers and stories from across the world.</p></div><a href="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-cinema-200 transition hover:text-white">Go to Discover <ArrowRight className="h-4 w-4" /></a></div><div className="grid gap-3 sm:grid-cols-3">
        <a href="/movies" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-sky-300/25 hover:bg-sky-300/[.04]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-300/10 text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Movies</span><span className="mt-1 block text-xs text-slate-400">Films worth discovering</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
        <a href="/series" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-sky-300/25 hover:bg-sky-300/[.04]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-300/10 text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Series</span><span className="mt-1 block text-xs text-slate-400">Stories told episode by episode</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
        <a href="/friends" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-sky-300/25 hover:bg-sky-300/[.04]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-300/10 text-cinema-200"><Users className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Friends</span><span className="mt-1 block text-xs text-slate-400">Share what you love</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
      </div></section>
      <TmdbRow heading="Trending movies" description="Films audiences are exploring this week." mediaType="movie" list="trending" action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">See all</a>} />
      <TmdbRow heading="Popular movies" mediaType="movie" list="popular" action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">See all</a>} />
      <TmdbRow heading="Trending series" description="Series creating conversation around the world." mediaType="tv" list="trending" action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">See all</a>} />
      <TmdbRow heading="Popular series" mediaType="tv" list="popular" action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">See all</a>} />
      {cinemaShelves && cinemaShelves.movies.length > 0 && <TitleRow heading="Available on Cinema" description="Content published in Cinema's own catalogue." titles={cinemaShelves.movies} progressById={cinemaShelves.ratios} />}
      {cinemaShelves && cinemaShelves.series.length > 0 && <TitleRow heading="Series available on Cinema" titles={cinemaShelves.series} progressById={cinemaShelves.ratios} />}
      {!titles && <LoadingState label="Loading your Cinema catalogue" />}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-sky-300/15 bg-[linear-gradient(115deg,rgba(96,165,250,.10),rgba(255,255,255,.025)_50%,rgba(255,255,255,.01))] p-6 sm:p-8"><div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cinema-300">The Cinema experience</p><h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Discover a story. Experience it. Share it.</h2><p className="mt-3 text-sm leading-7 text-slate-300">Cinema brings entertainment and the people who love it into one connected destination. Move from a trailer to a title, from a title to a conversation, and from a conversation to watching together.</p><a href="/discover" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cinema-200 hover:text-white">Explore Discover <Compass className="h-4 w-4" /></a></div></section>
      <TmdbAttribution />
      {activeShort && <ShortViewer clip={activeShort} onClose={() => setActiveShort(null)} />}
    </div>
  );
}
