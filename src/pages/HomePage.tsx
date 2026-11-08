import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clapperboard, Compass, MessageCircle, Play, Radio, Users } from 'lucide-react';
import { ContinueWatchingRow } from '@/components/catalogue/ContinueWatchingRow';
import { CinemaSeasonalSpotlight } from '@/components/catalogue/CinemaSeasonalSpotlight';
import { ShortCard } from '@/components/discover/ShortCard';
import { CinemaSpotlights } from '@/components/discover/CinemaSpotlights';
import { TitleRow } from '@/components/catalogue/TitleRow';
import { TmdbHero } from '@/components/tmdb/TmdbHero';
import { TmdbRow } from '@/components/tmdb/TmdbRow';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { PAGE_CONTAINER } from '@/components/ui/styles';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { progressRatioByTitle, resumeItems, titlesOfType } from '@/lib/catalogue';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchPublishedShorts, isPlayableShort, rankPublishedShorts, type DiscoverClip } from '@/lib/clips';
import { fetchLetterboxFeed, type LetterboxPost } from '@/lib/letterbox';
import { loadFriendsSnapshot, type FriendsSnapshot } from '@/lib/friends';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { loadFriendsActivity, type FriendsActivity } from '@/lib/friendActivity';
import { buildRecommendations } from '@/lib/recommendations';
import { groupByPublisher } from '@/lib/publishers';
import { navigateTo } from '@/lib/router';
import type { Title } from '@/lib/types';

interface HomeSocial { friends: FriendsSnapshot['friends']; posts: LetterboxPost[]; follows: string[]; activity: FriendsActivity }
async function loadHomeSocial(userId: string): Promise<HomeSocial> {
  const [friendsResult, postsResult, followsResult, activityResult] = await Promise.allSettled([loadFriendsSnapshot(userId), fetchLetterboxFeed(24), fetchFollowedPublishers(userId), loadFriendsActivity(userId)]);
  const friends = friendsResult.status === 'fulfilled' ? friendsResult.value.friends : [];
  const friendIds = new Set(friends.map((friend) => friend.otherUserId));
  const posts = postsResult.status === 'fulfilled' ? postsResult.value.filter((post) => friendIds.has(post.author_id)).slice(0, 4) : [];
  const follows = followsResult.status === 'fulfilled' ? followsResult.value : [];
  const activity = activityResult.status === 'fulfilled' ? activityResult.value : { watching: [], publishers: [] };
  return { friends, posts, follows, activity };
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
          {social?.posts.length ? social.posts.map((post) => <article key={post.id} className="rounded-2xl border border-white/10 bg-ink-900/75 p-4 transition hover:border-sky-300/20"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-sky-300/10 text-xs font-black text-cinema-200">{(post.author?.display_name || post.author?.username || 'C').slice(0,1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{post.author?.display_name || post.author?.username || 'Cinema member'}</p><p className="text-[10px] text-slate-500">Shared A Cinema Post · {new Date(post.created_at).toLocaleDateString()}</p></div><MessageCircle className="h-4 w-4 text-cinema-300" /></div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.body}</p>{post.title && <a href={`/title/${post.title.id}`} className="mt-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] p-2.5 transition hover:border-sky-300/25"><span className="h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-ink-800">{post.title.poster_url && <img src={post.title.poster_url} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-cinema-300">Talking About</span><span className="block truncate text-xs font-bold text-white">{post.title.title}</span></span><ArrowRight className="ml-auto h-4 w-4 text-slate-500" /></a>}</article>) : <div className="flex h-full min-h-44 flex-col justify-center rounded-2xl border border-dashed border-white/10 bg-white/[.015] p-5"><p className="text-sm font-bold text-white">Friends’ Conversations Will Appear Here</p><p className="mt-1 max-w-md text-xs leading-5 text-slate-500">When Your Friends Share A Cinema Post About A Title, You’ll See It In This Space.</p><a href="/friends" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cinema-200 hover:text-white">Visit Friends <ArrowRight className="h-3.5 w-3.5" /></a></div>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(120deg,#151b18,#0d1110_55%,#080b0a)] p-4 shadow-[0_16px_48px_rgba(20,90,200,.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold text-white">Your Tracked Publishers</p><p className="mt-1 text-xs text-slate-500">Studios, Publishers And Broadcasters You Choose To Track.</p></div><a href="/publishers" className="text-xs font-bold text-cinema-200 hover:text-white">Discover Publishers</a></div>
        {social?.follows.length ? <div className="mt-3 flex flex-wrap gap-2">{social.follows.map((name) => <a key={name} href={`/publishers/${encodeURIComponent(name)}`} className="rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-xs font-semibold text-slate-200 shadow-[0_4px_18px_rgba(0,0,0,.12)] transition hover:border-white/25 hover:bg-white/[.10]">{name}</a>)}</div> : <p className="mt-3 text-xs text-slate-500">You Are Not Tracking Any Publishers Yet. Explore Publisher Destinations To Choose The Studios And Broadcasters You Want To Hear From.</p>}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-ink-900/65 p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-white">Your Friends Are Watching</p><p className="mt-1 text-xs text-slate-500">Only friends who have enabled watch activity sharing appear here.</p></div><Users className="h-4 w-4 text-cinema-200" /></div>
          {social?.activity.watching.length ? <div className="mt-4 space-y-3">{social.activity.watching.slice(0, 5).map((item) => <a key={item.friendId + item.titleId} href={`/title/${item.titleId}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] p-2.5 transition hover:border-cinema-300/25"><span className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-800">{item.posterUrl && <img src={item.posterUrl} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-white">{item.titleName}</span><span className="mt-1 block truncate text-[11px] text-slate-400">{item.friendName} Is Watching</span></span><ProfileAvatar name={item.friendName} imageUrl={item.friendAvatarUrl} size="sm" previewable={false} /><Play className="h-4 w-4 shrink-0 text-cinema-200" /></a>)}</div> : <p className="mt-4 text-xs leading-5 text-slate-500">When friends choose to share what they are currently watching, their recent activity will appear here for up to 20 minutes.</p>}
        </section>
        <section className="rounded-2xl border border-white/10 bg-ink-900/65 p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-white">Publishers In Your Circle</p><p className="mt-1 text-xs text-slate-500">Studios And Broadcasters Your Friends Track.</p></div><Clapperboard className="h-4 w-4 text-cinema-200" /></div>
          {social?.activity.publishers.length ? <div className="mt-4 flex flex-wrap gap-2">{social.activity.publishers.slice(0, 14).map((item) => <a key={item.friendId + item.publisherName} href={`/publishers/${encodeURIComponent(item.publisherName)}`} title={`${item.friendName} tracks ${item.publisherName}`} className="rounded-full border border-white/15 bg-white/[.05] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[.09]">{item.publisherName}<span className="ml-1.5 text-[10px] text-slate-500">· {item.friendName}</span></a>)}</div> : <p className="mt-4 text-xs leading-5 text-slate-500">When your friends track studios, publishers or broadcasters, those connections will appear here.</p>}
        </section>
      </div>
    </section>
  );
}

function PublisherDestinations({ titles }: { titles: Title[] }) {
  const publishers = useMemo(() => groupByPublisher(titles).slice(0, 5), [titles]);
  if (!publishers.length) return null;
  return <section className="space-y-4"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cinema-300">The People Behind The Stories</p><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Publisher Destinations</h2><p className="mt-1 text-sm text-slate-400">Explore Studios, Broadcasters And Publishers Represented In Cinema’s Catalogue.</p></div><a href="/publishers" className="text-sm font-semibold text-cinema-200 hover:text-white">All Publishers</a></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{publishers.map((publisher) => <a key={publisher.name} href={`/publishers/${encodeURIComponent(publisher.name)}`} className="group rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-sky-300/[.045]"><span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/15 bg-sky-300/[.08] text-cinema-200"><Clapperboard className="h-6 w-6" /></span><span className="mt-3 block truncate text-sm font-bold text-white">{publisher.name}</span><span className="mt-1 block text-xs text-slate-500">{publisher.titles.length} {publisher.titles.length === 1 ? 'title' : 'titles'} in Cinema</span></a>)}</div></section>;
}

function HomeEngagement() {
  const moments = [
    { title: 'Settle Into A Movie', detail: 'Find a film for the moment.', href: '/movies', icon: Clapperboard, tone: 'from-sky-400/20 to-blue-500/5', accent: 'text-sky-200', image: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
    { title: 'Watch Something Quick', detail: 'Short stories and fresh moments.', href: '/shorts', icon: Play, tone: 'from-fuchsia-400/15 to-violet-500/5', accent: 'text-fuchsia-200', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&q=80' },
    { title: 'Tune Into Live TV', detail: 'Explore channels in Cinema.', href: '/live-tv', icon: Radio, tone: 'from-emerald-400/15 to-teal-500/5', accent: 'text-emerald-200', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=80' },
    { title: 'Catch The Sports', detail: 'Follow competitions and highlights.', href: '/sports', icon: Users, tone: 'from-amber-400/15 to-orange-500/5', accent: 'text-amber-200', image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900&q=85' },
    { title: 'Discover A New Story', detail: 'Explore creators and features.', href: '/discover', icon: Compass, tone: 'from-indigo-400/15 to-blue-500/5', accent: 'text-indigo-200', image: 'https://image.tmdb.org/t/p/w500/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg' },
    { title: 'Watch Together', detail: 'Bring friends into movie night.', href: '/watch-parties', icon: MessageCircle, tone: 'from-rose-400/15 to-pink-500/5', accent: 'text-rose-200', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80' },
  ];
  return (
    <section className="space-y-4" aria-labelledby="home-moments-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-cinema-300">Make It A Cinema Moment</p>
          <h2 id="home-moments-heading" className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">What Are You In The Mood For?</h2>
          <p className="mt-1 text-sm text-slate-400">Choose where you want to go. Your Home stays open to every part of Cinema.</p>
        </div>
        <a href="/discover" className="inline-flex items-center gap-2 text-sm font-bold text-cinema-200 transition hover:text-white">Explore Everything <ArrowRight className="h-4 w-4" /></a>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {moments.map(({ title, detail, href, icon: Icon, tone, accent, image }) => (
          <a key={title} href={href} className={`group relative isolate flex min-h-40 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${tone} p-4 shadow-[0_10px_28px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_18px_42px_rgba(0,0,0,.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cinema-300`}>
            <img src={image} alt="" loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover opacity-43 transition duration-700 group-hover:scale-105 group-hover:opacity-58" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#050811]/92 via-[#050811]/62 to-[#050811]/30" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/35 via-transparent to-transparent" />
            <span className={`grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-black/35 shadow-lg shadow-black/20 backdrop-blur-sm ${accent}`}><Icon className="h-5 w-5" /></span>
            <span className="mt-4 text-sm font-extrabold leading-snug text-white">{title}</span>
            <span className="mt-1 text-[11px] leading-4 text-slate-200/90">{detail}</span>
            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-white/35 transition group-hover:translate-x-1 group-hover:text-white" />
          </a>
        ))}
      </div>
    </section>
  );
}

type HomeMood = { id: string; label: string; description: string; terms?: string[]; kind?: 'sport' | 'live'; href: string; };
const HOME_MOODS: HomeMood[] = [
  { id: 'laugh', label: 'Make Me Laugh', description: 'Light-hearted stories and comedies.', terms: ['comedy', 'comedies'], href: '/movies' },
  { id: 'adventure', label: 'Take Me Somewhere', description: 'Adventure, action and big-screen worlds.', terms: ['action', 'adventure', 'fantasy'], href: '/movies' },
  { id: 'drama', label: 'A Powerful Story', description: 'Character-led stories and emotional journeys.', terms: ['drama', 'romance'], href: '/series' },
  { id: 'real', label: 'Real Life', description: 'Documentaries and reality entertainment.', terms: ['documentary', 'documentaries', 'reality'], href: '/discover' },
  { id: 'sports', label: 'Feel The Competition', description: 'Sports coverage and highlights.', kind: 'sport', href: '/sports' },
  { id: 'live', label: 'Turn On Live TV', description: 'Explore broadcaster channels.', kind: 'live', href: '/live-tv' },
];

function HomeMoodPicker({ titles }: { titles: Title[] }) {
  const [selectedMood, setSelectedMood] = useState(HOME_MOODS[0].id);
  const selected = HOME_MOODS.find((mood) => mood.id === selectedMood) ?? HOME_MOODS[0];
  const matches = useMemo(() => {
    if (selected.kind) return titlesOfType(titles, selected.kind);
    const terms = selected.terms ?? [];
    return titles.filter((title) => terms.some((term) => title.genre.toLocaleLowerCase().includes(term)));
  }, [selected, titles]);
  return (
    <section className="space-y-4" aria-labelledby="home-mood-heading">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-cinema-300">A Little Inspiration</p>
        <h2 id="home-mood-heading" className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">What Are You In The Mood For?</h2>
        <p className="mt-1 text-sm text-slate-400">Choose a feeling and explore the stories and channels already available in Cinema.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Choose an entertainment mood">
        {HOME_MOODS.map((mood) => (
          <button key={mood.id} type="button" aria-pressed={selectedMood === mood.id} onClick={() => setSelectedMood(mood.id)} className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cinema-300 ${selectedMood === mood.id ? 'border-cinema-300/60 bg-cinema-300/15 text-white shadow-[0_6px_24px_rgba(8,124,255,.12)]' : 'border-white/10 bg-white/[.035] text-slate-300 hover:border-white/25 hover:bg-white/[.07]'}`}>
            {mood.label}
          </button>
        ))}
      </div>
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.055] via-white/[.025] to-transparent p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-base font-extrabold text-white">{selected.label}</h3><p className="mt-1 text-xs text-slate-400">{selected.description}</p></div>
          <a href={selected.href} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-cinema-200 transition hover:border-cinema-300/40 hover:bg-cinema-300/10">Explore <ArrowRight className="h-3.5 w-3.5" /></a>
        </div>
        {matches.length > 0 ? <div className="mt-4"><TitleRow heading={`Available In Cinema · ${matches.length}`} titles={matches.slice(0, 8)} landscape /></div> : <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 p-4"><p className="text-sm font-semibold text-white">More Choices Are On The Way</p><p className="mt-1 text-xs leading-5 text-slate-400">There are no published picks for this mood in the current Cinema catalogue yet. You can still explore the full section.</p></div>}
      </div>
    </section>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const openShort = useCallback((clip: DiscoverClip) => navigateTo(`/shorts?clip=${encodeURIComponent(clip.id)}`), []);
  const { progress, watchlistIds, favouriteIds } = useLibrary();
  const { data: titles, error: titlesError, reload: reloadTitles } = useAsyncData(fetchPublishedTitles, []);
  const { data: publishedClips, error: clipsError, reload: reloadClips } = useAsyncData(fetchPublishedShorts, []);
  useEffect(() => {
    const refreshShorts = () => { if (document.visibilityState === 'visible') reloadClips(); };
    window.addEventListener('focus', refreshShorts);
    document.addEventListener('visibilitychange', refreshShorts);
    return () => {
      window.removeEventListener('focus', refreshShorts);
      document.removeEventListener('visibilitychange', refreshShorts);
    };
  }, [reloadClips]);
  const { data: social, loading: socialLoading } = useAsyncData(() => user ? loadHomeSocial(user.id) : Promise.resolve(undefined), [user?.id]);
  const titleAffinityIds = useMemo(
    () => new Set([...watchlistIds, ...favouriteIds, ...progress.map((entry) => entry.title_id)]),
    [watchlistIds, favouriteIds, progress],
  );
  const shorts = useMemo(
    () => rankPublishedShorts(
      (publishedClips ?? []).filter((clip) => (clip.kind === 'short' || clip.kind === 'clip') && isPlayableShort(clip)),
      social?.follows ?? [],
      12,
      undefined,
      titleAffinityIds,
    ),
    [publishedClips, social?.follows, titleAffinityIds],
  );
  const recommendations = useMemo(() => titles ? buildRecommendations(titles, progress, watchlistIds, favouriteIds, social?.follows ?? []) : { titles: [], reason: 'Discover stories from across Cinema.' }, [titles, progress, watchlistIds, favouriteIds, social?.follows]);
  const recommendedMovies = useMemo(() => titlesOfType(recommendations.titles, 'movie'), [recommendations.titles]);
  const recommendedSeries = useMemo(() => titlesOfType(recommendations.titles, 'series'), [recommendations.titles]);
  const recommendedNews = useMemo(() => titlesOfType(recommendations.titles, 'news'), [recommendations.titles]);
  const recommendedLiveChannels = useMemo(() => titlesOfType(recommendations.titles, 'live'), [recommendations.titles]);
  const cinemaShelves = useMemo(() => {
    if (!titles) return null;
    const today = new Date().toISOString().slice(0, 10);
    const comingSoon = titles.filter((title) => title.release_date != null && title.release_date > today).sort((a, b) => (a.release_date ?? '').localeCompare(b.release_date ?? ''));
    const news = titlesOfType(titles, 'news');
    const live = titlesOfType(titles, 'live');
    const genreMatches = (terms: string[]) => titles.filter((title) => terms.some((term) => title.genre.toLocaleLowerCase().includes(term)));
    return { movies: titlesOfType(titles, 'movie'), series: titlesOfType(titles, 'series'), sports: titlesOfType(titles, 'sport'), news, live, reality: genreMatches(['reality']), documentaries: genreMatches(['documentary', 'documentaries']), comingSoon, resume: resumeItems(progress, titles), ratios: progressRatioByTitle(progress) };
  }, [titles, progress]);

  return (
    <div className={`${PAGE_CONTAINER} cinema-home space-y-12 pb-16 sm:space-y-16`}>
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(190,205,196,.07),transparent_62%)]" aria-hidden="true" />
      <nav className="cinema-home-categories -mx-4 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden" aria-label="Explore Home Categories">
        {[
          ['Movies', '/movies'],
          ['Series', '/series'],
          ['Shorts', '/shorts'],
          ['News', '/news'],
          ['Documentaries', '/category/documentaries'],
          ['Animation', '/category/animation'],
          ['Family', '/category/family'],
        ].map(([label, href]) => (
          <a key={label} href={href} className="cinema-home-category shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-offset-4">{label}</a>
        ))}
      </nav>
      <TmdbHero />
      <HomeEngagement />
      <HomeMoodPicker titles={titles ?? []} />
      <CinemaSeasonalSpotlight categoryLabel="Cinema Home" mediaType="movie" />
      <section id="home-recommendations" className="cinema-recommendations-sector scroll-mt-28 space-y-8">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-cinema-300">Picked Around Your Taste</p><h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Your Next Watch</h2><p className="mt-1 text-sm text-slate-400">A personal mix shaped by what you watch, save and follow — with room for new discoveries.</p></div>
        {titles && recommendedMovies.length > 0 && <TitleRow heading="Recommended Movies" description="Films Picked From Your Cinema Activity And The Stories You Enjoy." titles={recommendedMovies} landscape action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">Explore Movies</a>} />}
        {titles && recommendedSeries.length > 0 && <TitleRow heading="Recommended Series" description="Series That May Be Worth Settling Into Next." titles={recommendedSeries} landscape action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">Explore Series</a>} />}
        {titles && recommendedNews.length > 0 && <TitleRow heading="News In Your Focus" description="News and current-affairs picks shaped by the publishers and topics available in Cinema." titles={recommendedNews} landscape action={<a href="/news" className="text-sm font-semibold text-cinema-200 hover:text-white">Explore News</a>} />}
        {titles && recommendedLiveChannels.length > 0 && <TitleRow heading="Channels Picked For You" description="Live television channels from publishers represented in Cinema, ranked around your viewing interests." titles={recommendedLiveChannels} landscape action={<a href="/live-tv" className="text-sm font-semibold text-cinema-200 hover:text-white">Explore Live TV</a>} />}
        {titles && recommendedMovies.length === 0 && recommendedSeries.length === 0 && recommendedNews.length === 0 && recommendedLiveChannels.length === 0 && <div className="cinema-home-empty rounded-2xl border border-white/10 p-5"><h2 className="text-xl font-extrabold text-white">Recommended For You</h2><p className="mt-1 text-sm text-slate-400">As you explore Cinema, recommendations will become more relevant to the movies, series, news and channels you enjoy.</p></div>}
      </section>
      <section className="cinema-home-shorts space-y-5" aria-label="Cinema Shorts">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.24em] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-[#087cff] shadow-[0_0_12px_rgba(8,124,255,.8)]" /> Quick Stories</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Cinema Shorts</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-400">Swipe through quick stories, creator moments and highlights from across Cinema.</p>
          </div>
          <a href="/shorts" className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.035] px-4 py-2.5 text-xs font-bold text-white transition hover:border-[#087cff]/60 hover:bg-[#087cff]/10">
            See All Shorts <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </a>
        </div>
        {!publishedClips && (clipsError
          ? <ErrorState onRetry={reloadClips} description="Cinema Shorts could not load just now. Your other Cinema features are still available; try the feed again." />
          : <div role="status" aria-label="Loading Cinema Shorts" className="-mx-4 flex snap-x gap-3 overflow-hidden px-4 pb-3 sm:mx-0 sm:gap-4 sm:px-0">{Array.from({ length: 4 }, (_, index) => <div key={index} className="cinema-short-skeleton aspect-[9/16] w-[min(34vw,124px)] shrink-0 rounded-[1.2rem] sm:w-[132px]" />)}</div>
        )}
        {publishedClips && shorts.length === 0 && (
          <div className="cinema-home-empty relative overflow-hidden rounded-[1.6rem] border border-white/10 p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/[.06] bg-white/[.015]" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">The Shorts Shelf</p>
                <h3 className="mt-2 text-lg font-extrabold text-white">Fresh Stories Are On Their Way</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-400">Approved creator and publisher videos will appear here as they are added. We only show playable videos, never empty or broken cards.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={reloadClips} className="rounded-full border border-white/15 bg-white/[.04] px-4 py-2.5 text-xs font-bold text-white transition hover:border-[#087cff]/50 hover:bg-[#087cff]/10">Refresh Feed</button>
                <a href="/creator/shorts" className="rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_24px_rgba(8,124,255,.24)] transition hover:bg-[#168cff]">Submit A Short</a>
              </div>
            </div>
          </div>
        )}
        {shorts.length > 0 && <div className="cinema-shorts-rail -mx-4 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:gap-5 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {shorts.slice(0, 12).map((clip) => <ShortCard key={clip.id} clip={clip} onOpen={openShort} />)}
        </div>}
      </section>
      <HomeCommunity social={social} loading={Boolean(user) && socialLoading} />

      <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-cinema-300">Beyond The Screen</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Inside The Story</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">Go closer with cast conversations, behind-the-scenes moments and the craft behind the stories.</p></div><a href="/discover" className="text-sm font-semibold text-cinema-200 hover:text-white">Explore Features <ArrowRight className="inline h-4 w-4" /></a></div><CinemaSpotlights /></section>
      <>{cinemaShelves?.live.length ? <TitleRow heading="Live TV On Cinema" description="Live channels and programmes published by Cinema broadcasters." titles={cinemaShelves.live} /> : <section className="cinema-home-empty rounded-2xl border border-white/10 p-5"><h2 className="text-xl font-extrabold text-white">Live TV On Cinema</h2><p className="mt-1 text-sm text-slate-400">Broadcaster channels and live programmes will appear in this Home shelf when they are published.</p></section>}{cinemaShelves?.news.length ? <section id="home-news" className="scroll-mt-28"><TitleRow heading="News & Current Affairs" description="News programmes and current-affairs content available in Cinema." titles={cinemaShelves.news} /></section> : <section id="home-news" className="scroll-mt-28"><div className="cinema-home-empty rounded-2xl border border-white/10 p-5"><h2 className="text-xl font-extrabold text-white">News & Current Affairs</h2><p className="mt-1 text-sm text-slate-400">Verified news channels and programmes will appear here when they are published in Cinema.</p></div></section>}{cinemaShelves?.sports.length ? <TitleRow heading="Sports On Cinema" description="Live coverage, sports programmes and highlights from Cinema publishers." titles={cinemaShelves.sports} /> : <section className="cinema-home-empty rounded-2xl border border-white/10 p-5"><h2 className="text-xl font-extrabold text-white">Sports On Cinema</h2><p className="mt-1 text-sm text-slate-400">Sports coverage, programmes and highlights will appear here as publishers add them.</p></section>}{cinemaShelves?.reality.length ? <section id="home-reality" className="scroll-mt-28"><TitleRow heading="Reality & Entertainment" description="Reality programmes and unscripted entertainment across Cinema." titles={cinemaShelves.reality} /></section> : <section id="home-reality" className="scroll-mt-28"><div className="cinema-home-empty rounded-2xl border border-white/10 p-5"><h2 className="text-xl font-extrabold text-white">Reality & Entertainment</h2><p className="mt-1 text-sm text-slate-400">Reality programmes will appear here as publishers add them to Cinema.</p></div></section>}{cinemaShelves?.documentaries.length ? <section id="home-documentaries" className="scroll-mt-28"><TitleRow heading="Documentaries" description="Factual stories, real people and worlds worth exploring." titles={cinemaShelves.documentaries} /></section> : <section id="home-documentaries" className="scroll-mt-28"><div className="cinema-home-empty rounded-2xl border border-white/10 p-5"><h2 className="text-xl font-extrabold text-white">Documentaries</h2><p className="mt-1 text-sm text-slate-400">Documentary titles will appear here when they are available in Cinema.</p></div></section>}</>
      {cinemaShelves?.resume.length ? <section className="cinema-shelf"><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-cinema-300">Pick Up Where You Left Off</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Back in Cinema</h2><p className="mt-1 text-sm text-slate-400">Your Stories Are Right Where You Left Them.</p></div><a href="/my-cinema" className="text-sm font-semibold text-cinema-200 hover:text-white">My Cinema <ArrowRight className="inline h-4 w-4" /></a></div><ContinueWatchingRow items={cinemaShelves.resume} /></section> : null}
      <PublisherDestinations titles={titles ?? []} />
      <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cinema-300">A World Of Stories</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Find Your Next Favourite.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Explore Real Movie And Series Information, Studio Features And Stories From Across The World.</p></div><a href="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-cinema-200 transition hover:text-white">Go To Discover <ArrowRight className="h-4 w-4" /></a></div><div className="grid gap-3 sm:grid-cols-3">
        <a href="/movies" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-sky-300/25 hover:bg-sky-300/[.04]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-300/10 text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Movies</span><span className="mt-1 block text-xs text-slate-400">Films Worth Discovering</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
        <a href="/series" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-sky-300/25 hover:bg-sky-300/[.04]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-300/10 text-cinema-200"><Clapperboard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Series</span><span className="mt-1 block text-xs text-slate-400">Stories Told Episode By Episode</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
        <a href="/friends" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-sky-300/25 hover:bg-sky-300/[.04]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-300/10 text-cinema-200"><Users className="h-6 w-6" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">Friends</span><span className="mt-1 block text-xs text-slate-400">Share What You Love</span></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cinema-200" /></a>
      </div></section>
      <section id="home-movies" className="scroll-mt-28 space-y-10">
        <TmdbRow heading="Spotlight Picks" description="A Fresh Selection Of Films Worth Your Time." mediaType="movie" list="popular" action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">Explore Movies</a>} />
        <TmdbRow heading="Movies In Motion" description="Stories Finding New Audiences This Week." mediaType="movie" list="trending" action={<a href="/movies" className="text-sm font-semibold text-cinema-200 hover:text-white">See All</a>} />
        <TmdbRow heading="Action Movies" description="Fast-moving stories and big-screen excitement." mediaType="movie" list="trending" genreId={28} />
        <TmdbRow heading="A Little More Laughter" description="A lighter collection for your next movie night." mediaType="movie" list="popular" genreId={35} />
        <TmdbRow heading="Animated Movies" description="Animation across styles, studios and generations." mediaType="movie" list="popular" genreId={16} />
        {cinemaShelves && cinemaShelves.movies.length > 0 && <TitleRow heading="Available On Cinema" description="Movies published in Cinema catalogue." titles={cinemaShelves.movies} progressById={cinemaShelves.ratios} />}
      </section>
      <section id="home-series" className="scroll-mt-28 space-y-10">
        <TmdbRow heading="Series Everyone Is Exploring" description="Find Your Next Episode-Worthy Story." mediaType="tv" list="trending" action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">Explore Series</a>} />
        <TmdbRow heading="Series Worth Settling Into" mediaType="tv" list="popular" action={<a href="/series" className="text-sm font-semibold text-cinema-200 hover:text-white">See All</a>} />
        <TmdbRow heading="Character-Led Stories" description="Series led by memorable characters and stories." mediaType="tv" list="popular" genreId={18} />
        {cinemaShelves && cinemaShelves.series.length > 0 && <TitleRow heading="Series Available On Cinema" titles={cinemaShelves.series} progressById={cinemaShelves.ratios} />}
      </section>
      {cinemaShelves && <section id="home-coming-soon" className="scroll-mt-28"><TitleRow heading="Coming Soon" description="Upcoming titles already announced in Cinema." titles={cinemaShelves.comingSoon} />{cinemaShelves.comingSoon.length === 0 && <p className="cinema-home-empty rounded-2xl border border-white/10 p-5 text-sm text-slate-300">New announcements will appear here as upcoming titles are added to Cinema.</p>}</section>}
      {!titles && (titlesError ? <ErrorState onRetry={reloadTitles} /> : <LoadingState label="Loading Your Cinema Catalogue" />)}
      <section className="grid gap-4 md:grid-cols-2">
        <a href="/live-tv" className="group relative isolate min-h-48 overflow-hidden rounded-3xl border border-sky-300/20 bg-[radial-gradient(ellipse_at_82%_16%,rgba(55,135,255,.22),transparent_42%),linear-gradient(125deg,#05080e,#0b1422_58%,#05070c)] p-6 transition duration-300 hover:-translate-y-1 hover:border-sky-200/45 hover:shadow-[0_24px_65px_rgba(20,90,190,.16)]">
          <span className="pointer-events-none absolute -right-5 -top-9 h-48 w-48 rounded-full border border-sky-200/10 bg-sky-300/[.025] shadow-[0_0_70px_rgba(40,120,230,.13)] transition duration-500 group-hover:scale-110" /><span className="pointer-events-none absolute right-9 top-8 grid h-24 w-24 place-items-center rounded-[1.8rem] border border-sky-200/20 bg-black/35 text-sky-200 shadow-[0_0_55px_rgba(45,125,235,.2)] backdrop-blur-sm"><Radio className="h-12 w-12" strokeWidth={1.7} /></span><span className="relative inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-sky-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> Always On</span><h2 className="relative mt-3 text-2xl font-black text-white">Live TV</h2><p className="relative mt-1 max-w-sm text-sm text-slate-300">Explore Television Channels And Live Programming In One Place.</p><span className="relative mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-200">Explore Live TV <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </a>
        <a href="/sports" className="group relative isolate min-h-40 overflow-hidden rounded-3xl border border-sky-300/15 bg-[#080c13] p-6 transition hover:-translate-y-1 hover:border-sky-200/40"><img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=85" alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25 transition duration-500 group-hover:scale-105 group-hover:opacity-35" /><span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#030407]/95 via-[#030407]/80 to-[#030407]/45" />
          <span className="text-[10px] font-bold uppercase tracking-[.22em] text-sky-200">Live. Next. Always.</span><h2 className="mt-3 text-2xl font-black text-white">Your Sports</h2><p className="mt-1 max-w-sm text-sm text-slate-300">Find sports coverage, competitions and highlights.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-200">Explore Sports <ArrowRight className="h-4 w-4" /></span>
        </a>
      </section>
      <section className="relative overflow-hidden rounded-[1.75rem] border border-sky-300/15 bg-[linear-gradient(115deg,rgba(96,165,250,.10),rgba(255,255,255,.025)_50%,rgba(255,255,255,.01))] p-6 sm:p-8"><div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cinema-300">The Cinema Experience</p><h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Discover A Story. Experience It. Share It.</h2><p className="mt-3 text-sm leading-7 text-slate-300">Cinema Brings Entertainment And The People Who Love It Into One Connected Destination. Move From A Story Feature To A Title, From A Title To A Conversation, And From A Conversation To Watching Together.</p><a href="/discover" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cinema-200 hover:text-white">Explore Discover <Compass className="h-4 w-4" /></a></div></section>
    </div>
  );
}
