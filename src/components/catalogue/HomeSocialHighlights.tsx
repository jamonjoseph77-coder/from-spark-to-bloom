import { ArrowRight, MessageCircle, Users } from 'lucide-react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { loadFriendsSnapshot } from '@/lib/friends';
import { fetchLetterboxFeed } from '@/lib/letterbox';
import { publisherHref } from '@/lib/publishers';

async function loadHomeSocial(userId: string) {
  const [followed, friends, posts] = await Promise.all([
    fetchFollowedPublishers(userId).catch(() => []),
    loadFriendsSnapshot(userId).catch(() => null),
    fetchLetterboxFeed(30).catch(() => []),
  ]);
  const friendIds = new Set((friends?.friends ?? []).map((friend) => friend.otherUserId));
  return { followed, activity: posts.filter((post) => friendIds.has(post.author_id)).slice(0, 3), friendCount: friends?.friends.length ?? 0 };
}

export function HomeSocialHighlights({ userId }: { userId: string }) {
  const { data } = useAsyncData(() => loadHomeSocial(userId), [userId]);
  if (!data) return null;
  return <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
    <div className="min-w-0 rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-blue-200/80">Your world</p><h2 className="mt-1 text-xl font-extrabold text-white">Your follows</h2></div><a href="/publishers" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-200 transition hover:text-white">Find publishers <ArrowRight className="h-3.5 w-3.5" /></a></div>
      {data.followed.length ? <div className="mt-5 flex flex-wrap gap-2">{data.followed.map((name) => <a key={name} href={publisherHref(name)} className="rounded-full border border-blue-200/15 bg-blue-300/[.07] px-3.5 py-2 text-sm font-semibold text-slate-100 transition hover:border-blue-200/35 hover:bg-blue-300/[.13]">{name}</a>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 p-4"><p className="text-sm text-slate-300">Follow studios, broadcasters and official publishers to keep their stories close.</p><a href="/publishers" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white">Explore publishers <ArrowRight className="h-4 w-4" /></a></div>}
    </div>
    <div className="min-w-0 rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.015] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-blue-200/80">Around your circle</p><h2 className="mt-1 text-xl font-extrabold text-white">From your friends</h2></div><a href="/friends" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-200 transition hover:text-white">Open friends <ArrowRight className="h-3.5 w-3.5" /></a></div>
      {data.activity.length ? <div className="mt-4 space-y-3">{data.activity.map((post) => <article key={post.id} className="rounded-2xl border border-white/[.07] bg-black/15 p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Users className="h-3.5 w-3.5 text-blue-200/80" /><span className="font-bold text-slate-200">{post.author?.display_name || post.author?.username || 'A friend'}</span><span>shared a message</span></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{post.body}</p>{post.title && <a href={`/title/${post.title.id}`} className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-blue-200 hover:text-white">{post.title.title} <ArrowRight className="h-3 w-3" /></a>}</article>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 p-4"><p className="text-sm text-slate-300">{data.friendCount ? 'Your friends’ latest entertainment messages will appear here.' : 'Connect with friends to see what they are watching, sharing and talking about.'}</p><a href="/friends" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white"><MessageCircle className="h-4 w-4" /> Build your circle</a></div>}
    </div>
  </section>;
}
