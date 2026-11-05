import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Clapperboard, Film, Heart, MessageCircle, Send, Share2, Users } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { ContentEngagement } from '@/components/discover/ContentEngagement';
import { BUTTON_PRIMARY, INPUT, PAGE_CONTAINER } from '@/components/ui/styles';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { fetchPublishedTitles } from '@/lib/library';
import { addLetterboxComment, createLetterboxPost, fetchLetterboxFeed, toggleLetterboxReaction, type LetterboxPost, subscribeToLetterbox } from '@/lib/letterbox';

export function LetterboxPostCard({ post, userId, onChanged }: { post: LetterboxPost; userId?: string; onChanged: () => void }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const liked = Boolean(userId && post.likedByCurrentUser);
  const author = post.author?.display_name || post.author?.username || 'Cinema member';
  const count = post.reactionCount;

  async function sharePost() {
    const url = `${window.location.origin}/discover#post-${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `Cinema conversation by ${author}`, text: post.body.slice(0, 140), url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); notify('Post link copied.'); }
      else notify('Sharing is not available on this browser.', 'error');
    } catch (error) { if (error instanceof Error && error.name !== 'AbortError') notify('Could not share this post. Try again.', 'error'); }
  }

  async function react() {
    if (!userId) return notify('Sign in to react to posts.', 'error');
    setBusy(true);
    try { await toggleLetterboxReaction(post.id, userId, liked); onChanged(); }
    catch { notify('Your reaction could not be saved.', 'error'); }
    finally { setBusy(false); }
  }

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return notify('Sign in to join the conversation.', 'error');
    if (!comment.trim()) return;
    setBusy(true);
    try { await addLetterboxComment(post.id, userId, comment); setComment(''); onChanged(); }
    catch { notify('Your comment could not be posted.', 'error'); }
    finally { setBusy(false); }
  }

  return (
    <article id={`post-${post.id}`} className="scroll-mt-24 overflow-hidden border-b border-white/10 bg-[#07090d] transition-colors hover:bg-white/[.018]">
      <div className="flex items-center gap-3 px-4 pb-2 pt-5 sm:px-5">
        <a href={post.author?.username ? `/profile?username=${encodeURIComponent(post.author.username)}` : '/friends'} aria-label={`View ${author}'s profile`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cinema-400 to-indigo-700 text-sm font-black text-white transition hover:ring-2 hover:ring-cinema-300/60">{author.slice(0,1).toUpperCase()}</a>
        <div className="min-w-0 flex-1"><a href={post.author?.username ? `/profile?username=${encodeURIComponent(post.author.username)}` : '/friends'} className="truncate text-sm font-extrabold text-white hover:text-cinema-200">{author}</a><p className="text-xs text-slate-500">Cinema community · {new Date(post.created_at).toLocaleDateString()}</p></div>
        <span className="rounded-full border border-cinema-400/20 bg-cinema-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cinema-200">Message</span>
      </div>
      <div className="space-y-3 px-4 pb-3 sm:px-5">
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{post.body}</p>
        {post.image_url && <a href={post.image_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-white/10 bg-black"><img src={post.image_url} alt="Media shared with this Cinema post" loading="lazy" className="max-h-[600px] w-full object-contain" /></a>}
        {post.title && <a href={`/title/${post.title.id}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-cinema-400/30"><div className="grid h-14 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-800">{post.title.poster_url ? <img src={post.title.poster_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Film className="h-5 w-5 text-cinema-300" />}</div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-cinema-300">About this title</p><p className="truncate font-bold text-white">{post.title.title}</p><p className="text-xs text-slate-500">{post.title.type}</p></div></a>}
      </div>
      <div className="flex items-center justify-between gap-1 border-t border-white/5 px-3 py-2 sm:px-4">
        <button type="button" disabled={busy} onClick={() => void react()} aria-pressed={liked} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${liked ? 'bg-cinema-500/15 text-cinema-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {count} Likes</button>
        <span className="inline-flex items-center gap-2 px-3 py-2 text-xs text-slate-400"><MessageCircle className="h-4 w-4" /> {post.comments?.length ?? 0} Replies</span>
        <button type="button" onClick={() => void sharePost()} className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:border-cinema-300/30 hover:bg-cinema-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-300"><Share2 className="h-4 w-4" /> Share</button>
      </div>
      <div className="px-3 pb-2 sm:px-4">
        <ContentEngagement
          contentKey={`letterbox:${post.id}`}
          title={`Cinema Post: ${post.body.slice(0, 100)}`}
          href={`/discover#post-${post.id}`}
          imageUrl={post.title?.poster_url || ''}
          compact
          reviewOnly
        />
      </div>
      {post.comments && post.comments.length > 0 && <div className="space-y-3 border-t border-white/5 px-5 py-4">{post.comments.slice(-3).map((item) => <p key={item.id} className="text-xs leading-5 text-slate-400"><span className="font-bold text-slate-200">Cinema member</span> {item.body}</p>)}</div>}
      <form onSubmit={reply} className="flex gap-2 border-t border-white/5 px-4 py-3"><input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder={userId ? 'Add an entertainment-related reply…' : 'Sign in to reply'} className={`${INPUT} min-w-0 flex-1 py-2.5`} /><button type="submit" disabled={busy || !comment.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cinema-600 text-white transition hover:bg-cinema-500 disabled:opacity-40" aria-label="Post reply"><Send className="h-4 w-4" /></button></form>
    </article>
  );
}

export function LetterboxPage({ embedded = false, titleId: scopedTitleId }: { embedded?: boolean; titleId?: string }) {
  const { user } = useAuth();
  const { data: titles } = useAsyncData(fetchPublishedTitles, []);
  const { data: feed, error, reload } = useAsyncData(fetchLetterboxFeed, []);
  useEffect(() => subscribeToLetterbox(reload), [reload]);
  const [body, setBody] = useState('');
  const [selectedTitleId, setSelectedTitleId] = useState('');
  const [posting, setPosting] = useState(false);
  const { notify } = useToast();
  const activeTitleId = scopedTitleId || selectedTitleId;
  const linkedTitle = useMemo(() => (titles ?? []).find((title) => title.id === activeTitleId), [titles, activeTitleId]);
  const visibleFeed = useMemo(() => (feed ?? [])
    .filter((post) => !scopedTitleId || post.title_id === scopedTitleId)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)), [feed, scopedTitleId]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return notify('Sign in to publish a post.', 'error');
    if (!body.trim()) return;
    setPosting(true);
    try { await createLetterboxPost(user.id, body, activeTitleId || null); setBody(''); setSelectedTitleId(''); reload(); notify('Your message has been shared.'); }
    catch { notify('We could not publish your post. Please try again.', 'error'); }
    finally { setPosting(false); }
  }

  return (
    <div className={embedded ? "mx-auto w-full max-w-3xl space-y-5" : `${PAGE_CONTAINER} space-y-8 pb-12`}>
      {embedded && <header className="border-b border-white/10 pb-4"><p className="text-[10px] font-black uppercase tracking-[.22em] text-cinema-300">The Cinema Conversation</p><div className="mt-2 flex items-end justify-between gap-3"><div><h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Cinema Explore</h2><p className="mt-1 text-sm text-slate-400">What people across Cinema are sharing about stories, sport and television.</p></div><a href="/discover" className="shrink-0 text-xs font-bold text-cinema-200 hover:text-white">Open Explore →</a></div></header>}
      {!embedded && <header className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cinema-700/20 via-ink-900 to-ink-950 p-6 sm:p-9">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cinema-200">Friends & conversations</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">The conversation around entertainment.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Share recommendations, discuss releases and exchange thoughts with people who enjoy the same stories.</p>
        <div className="mt-5 flex flex-wrap gap-3"><a href="/friends" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"><Users className="h-4 w-4" /> Your friends</a><a href="/watch-parties" className="inline-flex items-center gap-2 rounded-full bg-cinema-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-cinema-400"><Clapperboard className="h-4 w-4" /> Watch together</a></div>
      </header>}
      {user && <form onSubmit={publish} className="space-y-3 rounded-3xl border border-white/10 bg-ink-900/80 p-5 shadow-xl"><label htmlFor="letterbox-post" className="block text-sm font-extrabold text-white">Write A Cinema Post</label><textarea id="letterbox-post" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={4} placeholder="Share a thought, review, recommendation or something you are looking forward to…" className={`${INPUT} resize-y py-3`} /><div className="flex flex-col gap-3 sm:flex-row sm:items-center">{!scopedTitleId && <select value={selectedTitleId} onChange={(event) => setSelectedTitleId(event.target.value)} className={`${INPUT} min-w-0 flex-1 py-2.5`}><option value="">No title attached</option>{(titles ?? []).map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}</select>}<span className="text-xs text-slate-500">{body.length}/2000</span><button type="submit" disabled={posting || !body.trim()} className={BUTTON_PRIMARY}>{posting ? 'Publishing…' : 'Post'}</button></div>{linkedTitle && <p className="text-xs text-sky-200">{scopedTitleId ? 'Message about' : 'Linked to'} {linkedTitle.title}</p>}<p className="text-xs text-slate-500">Keep posts about entertainment. Only approved media can be published; video uploads are not enabled.</p></form>}
      {!user && <div className="rounded-2xl border border-white/10 bg-ink-900 p-5 text-sm text-slate-300"><a href="/sign-in" className="font-bold text-cinema-200">Sign in</a> to share recommendations and join the conversation.</div>}
      {feed && <div className={`rounded-2xl border border-white/10 bg-ink-900/65 p-4`}><p className="text-sm font-bold text-white">Community Conversations</p><p className="mt-1 text-xs text-slate-500">Posts and opinions from across Cinema.</p></div>}
      {!feed && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}
      {feed && visibleFeed && visibleFeed.length === 0 && <EmptyState icon={<MessageCircle className="h-7 w-7 text-cinema-300" />} title="The Conversation Starts Here" description="When the Cinema community shares entertainment recommendations and discussions, they will appear here." />}
      {feed && visibleFeed && visibleFeed.length > 0 && <div className="mx-auto max-w-3xl space-y-0">{visibleFeed.map((post) => <LetterboxPostCard key={post.id} post={post} userId={user?.id} onChanged={reload} />)}</div>}
    </div>
  );
}
