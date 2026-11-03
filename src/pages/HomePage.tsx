import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clapperboard, Compass, MessageCircle, Play, Radio, Users } from 'lucide-react';
import { ContinueWatchingRow } from '@/components/catalogue/ContinueWatchingRow';
import { ShortCard } from '@/components/discover/ShortCard';
import { ShortViewer } from '@/components/discover/ShortViewer';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { TmdbHero } from '@/components/tmdb/TmdbHero';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { TmdbAttribution } from '@/components/tmdb/TmdbAttribution';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { PAGE_CONTAINER } from '@/components/ui/styles';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { progressRatioByTitle, resumeItems, titlesOfType } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchPublishedClips, isPlayableShort, type DiscoverClip } from '@/lib/clips';
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
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-cinema-300">Your Cinema, Together</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Your Circle</h2><p className="mt-1 text-sm text-slate-400">People You Connect With And The Stories They Are Sharing.</p></div><a href="/friends" className="inline-flex items-center gap-2 text-sm font-bold text-cinema-200 transition hover:text-white">Open Friends <ArrowRight className="h-4 w-4" /></a></div>
      <div className="grid gap-4 lg:grid-cols-[.85fr_1.4fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-400/[.10] via-ink-900/90 to-ink-950 p-5">
          <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">Your Friends</span><Users className="h-4 w-4 text-cinema-200" /></div>
          {social?.friends.length ? <div className="mt-5 flex flex-wrap gap-3">{social.friends.slice(0, 8).map((friend) => { const name = friend.profile?.display_name || friend.profile?.username || 'Cinema member'; return <a key={friend.otherUserId} href="/friends" title={name} className="group flex w-[4.5rem] flex-col items-center gap-2 text-center"><span className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-sky-300/25 to-slate-700/50 text-sm font-black text-white shadow-lg shadow-black/20 transition group-hover:border-sky-300/50">{name.slice(0,1).toUpperCase()}</span><span className="w-full truncate text-[11px] font-semibold text-slate-300 group-hover:text-white">{name}</span></a>; })}</div> : <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-4"><p className="text-sm text-slate-300">Your Circle starts here.</p><p className="mt-1 text-xs leading-5 text-slate-500">Find Friends And Build A Space Around The Entertainment You Enjoy.</p><a href="/friends" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cinema-200 hover:text-white">Find People <ArrowRight className="h-3.5 w-3.5" /></a></div>}
          <a href="/watch-parties" className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-semibold text-slate-200 transition hover:border-sky-300/30 hover:bg-black/30"><Play className="h-4 w-4 text-cinema-200" /> Plan A Watch Party <ArrowRight className="ml-auto h-4 w-4 text-slate-500" /></a>
        </div>
        <div className="space-y-3">
          {social?.posts.length ? social.posts.map((post) => <article key={post.id} className="rounded-2xl border border-white/10 bg-ink-900/75 p-4 transition hover:border-sky-300/20"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-sky-300/10 text-xs font-black text-cinema-200">{(post.author?.display_name || post.author?.username || 'C').slice(0,1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{post.author?.display_name || post.author?.username || 'Cinema member'}</p><p className="text-[10px] text-slate-500">Shared A Letterbox Message · {new Date(post.created_at).toLocaleDateString()}</p></div><MessageCircle className="h-4 w-4 text-cinema-300" /></div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.body}</p>{post.title && <a href={`/title/${post.title.id}`} className="mt-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] p-2.5 transition hover:border-sky-300/25"><span className="h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-ink-800">{post.title.poster_url && <img src={post.title.poster_url} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-cinema-300">Talking About</span><span className="block truncate text-xs font-bold text-white">{post.title.title}</span></span><ArrowRight className="ml-auto h-4 w-4 text-slate-500" /></a>}</article>) : <div className="flex h-full min-h-44 flex-col justify-center rounded-2xl border border-dashed border-white/10 bg-white/[.015] p-5"><p className="text-sm font-bold text-white">Friends’ Conversations Will Appear Here</p><p className="mt-1 max-w-md text-xs leading-5 text-slate-500">When Your Friends Share A Letterbox Message About A Title, You’ll See It In This Space.</p><a href="/friends" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cinema-200 hover:text-white">Visit Friends <ArrowRight className="h-3.5 w-3.5" /></a></div>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-ink-900/65 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold text-white">Your Follows</p><p className="mt-1 text-xs text-slate-500">Studios And Publishers You Choose To Keep Up With.</p></div><a href="/publishers" className="text-xs font-bold text-cinema-200 hover:text-white">Discover Publishers</a></div>
        {social?.follows.length ? <div className="mt-3 flex flex-wrap gap-2">{social.follows.map((name) => <a key={name} href={`/publishers/${encodeURIComponent(name)}`} className="rounded-full border border-sky-300/20 bg-sky-300/[.07] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-300/40 hover:bg-sky-300/[.12]">{name}</a>)}</div> : <p className="mt-3 text-xs text-slate-500">You Haven’t Followed A Publisher Yet. Explore Publisher Destinations To Find The Studios And Broadcasters You Want To Hear From.</p>}
      </div>
    </section>
  );
}

function PublisherDestinations({ titles }: { titles: Title[] }) {
  const publishers = useMemo(() => groupByPublisher(titles).slice(0, 5), [titles]);
  if (!publishers.length) return null;
  return <section className="space-y-4"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">The People Behind The Stories</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Publisher Destinations</h2><p className="mt-1 text-sm text-slate-400">Explore Studios, Broadcasters And Publishers Represented In Cinema’s Catalogue.</p></div><a href="/publishers" className="text-sm font-semibold text-cinema-200 hover:text-white">All Publishers</a></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{publishers.map((publisher) => <a key={publisher.name} href={`/publishers/${encodeURIComponent(publisher.name)}`} className="group rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-sky-300/[.045]"><span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/15 bg-sky-300/[.08] text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="mt-3 block truncate text-sm font-bold text-white">{publisher.name}</span><span className="mt-1 block text-xs text-slate-500">{publisher.titles.length} {publisher.titles.length === 1 ? 'title' : 'titles'} in Cinema</span></a>)}</div></section>;
}

export function HomePage() {
  const { user } = useAuth();
  const [activeShort, setActiveShort] = useState<DiscoverClip | null>(null);
  const { progress } = useLibrary();
  const { data: titles, error: titlesError, reload: reloadTitles } = useAsyncData(fetchPublishedTitles, []);
  const { data: publishedClips, error: clipsError, reload: reloadClips } = useAsyncData(fetchPublishedClips, []);
  useEffect(() => {
    const refreshShorts = () => { if (document.visibilityState === 'visible') reloadClips(); };
    window.addEventListener('focus', refreshShorts);
    document.addEventListener('visibilitychange', refreshShorts);
    return () => {
      window.removeEventListener('focus', refreshShorts);
      document.removeEventListener('visibilitychange', refreshShorts);
    };
  }, [reloadClips]);
  const shorts = useMemo(
    () => (publishedClips ?? []).filter((clip) => (clip.kind === 'short' || clip.kind === 'clip') && isPlayableShort(clip)),
    [publishedClips],
  );
  const { data: social, loading: socialLoading } = useAsyncData(() => user ? loadHomeSocial(user.id) : Promise.resolve(undefined), [user?.id]);
  const cinemaShelves = useMemo(() => {
    if (!titles) return null;
    const today = new Date().toISOString().slice(0, 10);
    const comingSoon = titles.filter((title) => title.release_date != null && title.release_date > today).sort((a, b) => (a.release_date ?? '').localeCompare(b.release_date ?? ''));
    return { movies: titlesOfType(titles, 'movie'), series: titlesOfType(titles, 'series'), comingSoon, resume: resumeItems(progress, titles), ratios: progressRatioByTitle(progress) };
  }, [titles, progress]);

  return (
    <div className={`${PAGE_CONTAINER} cinema-home space-y-12 pb-16 sm:space-y-16`}>
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(35,105,220,.13),transparent_62%)]" aria-hidden="true" />
      <TmdbHero />
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">Quick Stories</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Cinema Shorts</h2><p className="mt-1 text-sm text-slate-400">Short Videos And Moments From Official Cinema Publishers.</p></div>
          <a href="/discover" className="text-sm font-semibold text-cinema-200 transition hover:text-white">Explore All Shorts</a>
        </div>
        {!publishedClips && (clipsError ? <ErrorState onRetry={reloadClips} description="Cinema Could Not Load The Shorts Feed. Check Your Connection And Try Again." /> : <div role="status" aria-label="Loading Cinema Shorts" className="-mx-4 flex snap-x gap-4 overflow-hidden px-4 pb-3 sm:mx-0 sm:px-0">{Array.from({ length: 5 }, (_, index) => <div key={index} className="cinema-short-skeleton aspect-[9/16] w-[min(43vw,208px)] shrink-0 rounded-[1.35rem] sm:w-52" />)}</div>)}
        {publishedClips && shorts.length === 0 && <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sky-200/15 bg-sky-300/[.025] px-5 py-7 text-center"><EmptyState icon={<Play className="h-7 w-7 text-cinema-300" />} title="Cinema Shorts Are Getting Ready" description="Approved Short Videos Will Appear Here. Refresh To Check For Newly Published Videos." /><button type="button" onClick={reloadClips} className="rounded-full border border-sky-200/20 bg-sky-300/[.08] px-4 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-300/[.15]">Refresh Shorts</button></div>}
        {shorts.length > 0 && <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {shorts.slice(0, 12).map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={setActiveShort} />)}
        </div>}
      </section>
      {user && <HomeCommunity social={social} loading={socialLoading} />}
      {cinemaShelves?.resume.length ? <section className="cinema-shelf"><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-cinema-300">Pick Up Where You Left Off</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Back in Cinema</h2><p className="mt-1 text-sm text-slate-400">Your Stories Are Right Where You Left Them.</p></div><a href="/my-cinema" className="text-sm font-semibold text-cinema-200 hover:text-white">My Cinema <ArrowRight className="inline h-4 w-4" /></a></div><ContinueWatchingRow items={cinemaShelves.resume} /></section> : null}
      <PublisherDestinations titles={titles ?? []} />
      <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cinema-300">A World Of Stories</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Find Your Next Favourite.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Explore Real Movie And Series Information, Official Trailers And Stories From Across The World.</p></div><a href="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-cinema-200 transition hover:text-white">Go To Discover <ArrowRight className="h-4 w-4" /></a></div><div className="grid gap-3 sm:grid-cols-3">
        <a href="/movies" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-sky-300/25 hover:bg-sky-300/[.04]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-300/10 text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Movies</span><span className="mt-1 block text-xs text-slate-400">Films Worth Discovering</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
        <a href="/series" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-sky-300/25 hover:bg-sky-300/[.04]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-300/10 text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Series</span><span className="mt-1 block text-xs text-slate-400">Stories Told Episode By Episode</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
        <a href="/friends" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-sky-300/25 hover:bg-sky-300/[.04]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-300/10 text-cinema-200"><Users className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Friends</span><span className="mt-1 block text-xs text-slate-400">Share What You Love</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
      </div></section>
      <TmdbRow heading="Back in the spotlight" description="Stories People Are Discovering Right Now." mediaType="movie" list="trending" action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">Explore Movies</a>} />
      <TmdbRow heading="Trending movies" description="Films audiences are exploring this week." mediaType="movie" list="trending" action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">See All</a>} />
      <TmdbRow heading="Popular movies" mediaType="movie" list="popular" action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">See All</a>} />
      <TmdbRow heading="Series everyone is talking about" description="Find Your Next Episode-Worthy Story." mediaType="tv" list="trending" action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">Explore Series</a>} />
      <TmdbRow heading="Trending series" description="Series Creating Conversation Around The World." mediaType="tv" list="trending" action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">See All</a>} />
      <TmdbRow heading="Popular series" mediaType="tv" list="popular" action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">See All</a>} />
      {cinemaShelves && cinemaShelves.movies.length > 0 && <TitleRow heading="Available On Cinema" description="Content published in Cinema's own catalogue." titles={cinemaShelves.movies} progressById={cinemaShelves.ratios} />}
      {cinemaShelves && cinemaShelves.series.length > 0 && <TitleRow heading="Series Available On Cinema" titles={cinemaShelves.series} progressById={cinemaShelves.ratios} />}
      {cinemaShelves && cinemaShelves.comingSoon.length > 0 && <TitleRow heading="Coming Soon" description="Upcoming Titles Already Announced In Cinema." titles={cinemaShelves.comingSoon} />}
      {!titles && (titlesError ? <ErrorState onRetry={reloadTitles} /> : <LoadingState label="Loading Your Cinema Catalogue" />)}
      <section className="grid gap-4 md:grid-cols-2">
        <a href="/live-tv" className="group relative isolate min-h-48 overflow-hidden rounded-3xl border border-sky-300/20 bg-[radial-gradient(ellipse_at_82%_16%,rgba(55,135,255,.22),transparent_42%),linear-gradient(125deg,#05080e,#0b1422_58%,#05070c)] p-6 transition duration-300 hover:-translate-y-1 hover:border-sky-200/45 hover:shadow-[0_24px_65px_rgba(20,90,190,.16)]">
          <span className="pointer-events-none absolute -right-5 -top-9 h-48 w-48 rounded-full border border-sky-200/10 bg-sky-300/[.025] shadow-[0_0_70px_rgba(40,120,230,.13)] transition duration-500 group-hover:scale-110" /><span className="pointer-events-none absolute right-9 top-8 grid h-24 w-24 place-items-center rounded-[1.8rem] border border-sky-200/20 bg-black/35 text-sky-200 shadow-[0_0_55px_rgba(45,125,235,.2)] backdrop-blur-sm"><Radio className="h-11 w-11" /></span><span className="relative inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-sky-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> Always On</span><h2 className="relative mt-3 text-2xl font-black text-white">Live TV</h2><p className="relative mt-1 max-w-sm text-sm text-slate-300">Explore Television Channels And Live Programming In One Place.</p><span className="relative mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-200">Explore Live TV <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </a>
        <a href="/sports" className="group relative isolate min-h-40 overflow-hidden rounded-3xl border border-sky-300/15 bg-[radial-gradient(circle_at_85%_10%,rgba(39,100,210,.18),transparent_45%),linear-gradient(120deg,#101827,#080b12)] p-6 transition hover:-translate-y-1 hover:border-sky-200/40 p-6">
          <span className="text-[10px] font-bold uppercase tracking-[.22em] text-sky-200">Live. Next. Always.</span><h2 className="mt-3 text-2xl font-black text-white">Your Sports</h2><p className="mt-1 max-w-sm text-sm text-slate-300">Find sports coverage, competitions and highlights.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-200">Explore Sports <ArrowRight className="h-4 w-4" /></span>
        </a>
      </section>
      <section className="relative overflow-hidden rounded-[1.75rem] border border-sky-300/15 bg-[linear-gradient(115deg,rgba(96,165,250,.10),rgba(255,255,255,.025)_50%,rgba(255,255,255,.01))] p-6 sm:p-8"><div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cinema-300">The Cinema Experience</p><h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Discover A Story. Experience It. Share It.</h2><p className="mt-3 text-sm leading-7 text-slate-300">Cinema Brings Entertainment And The People Who Love It Into One Connected Destination. Move From A Trailer To A Title, From A Title To A Conversation, And From A Conversation To Watching Together.</p><a href="/discover" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cinema-200 hover:text-white">Explore Discover <Compass className="h-4 w-4" /></a></div></section>
      <TmdbAttribution />
      {activeShort && <ShortViewer clip={activeShort} onClose={() => setActiveShort(null)} />}
    </div>
  );
}
