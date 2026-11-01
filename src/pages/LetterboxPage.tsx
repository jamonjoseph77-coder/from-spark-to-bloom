import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Bookmark, Clapperboard, Film, Heart, MessageCircle, Send, Sparkles, Users } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY, INPUT, PAGE_CONTAINER } from '@/components/ui/styles';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { fetchPublishedTitles } from '@/lib/library';
import { addLetterboxComment, createLetterboxPost, fetchLetterboxFeed, toggleLetterboxReaction, type LetterboxPost, subscribeToLetterbox } from '@/lib/letterbox';

function PostCard({ post, userId, onChanged }: { post: LetterboxPost; userId?: string; onChanged: () => void }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const liked = Boolean(userId && post.reactions?.some((reaction) => reaction.user_id === userId));
  const author = post.author?.display_name || post.author?.username || 'Cinema member';
  const count = post.reactions?.length ?? 0;

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
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/85 shadow-xl shadow-black/10">
      <div className="flex items-center gap-3 p-5">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cinema-400 to-indigo-700 text-sm font-black text-white">{author.slice(0,1).toUpperCase()}</div>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-white">{author}</p><p className="text-xs text-slate-500">Cinema community · {new Date(post.created_at).toLocaleDateString()}</p></div>
        <span className="rounded-full border border-cinema-400/20 bg-cinema-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cinema-200">Letterbox</span>
      </div>
      <div className="space-y-4 px-5 pb-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{post.body}</p>
        {post.title && <a href={`/title/${post.title.id}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-cinema-400/30"><div className="grid h-14 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-800"><Film className="h-5 w-5 text-cinema-300" /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-cinema-300">About this title</p><p className="truncate font-bold text-white">{post.title.title}</p><p className="text-xs text-slate-500">{post.title.type}</p></div></a>}
      </div>
      <div className="flex items-center gap-2 border-t border-white/5 px-4 py-3">
        <button type="button" disabled={busy} onClick={() => void react()} aria-pressed={liked} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${liked ? 'bg-cinema-500/15 text-cinema-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {count} Likes</button>
        <span className="inline-flex items-center gap-2 px-3 py-2 text-xs text-slate-400"><MessageCircle className="h-4 w-4" /> {post.comments?.length ?? 0} Replies</span>
        <button type="button" onClick={() => { void navigator.clipboard?.writeText(window.location.origin + '/discover'); notify('Feed link copied.'); }} className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white"><Send className="h-4 w-4" /> Share</button>
      </div>
      {post.comments && post.comments.length > 0 && <div className="space-y-3 border-t border-white/5 px-5 py-4">{post.comments.slice(-3).map((item) => <p key={item.id} className="text-xs leading-5 text-slate-400"><span className="font-bold text-slate-200">Cinema member</span> {item.body}</p>)}</div>}
      <form onSubmit={reply} className="flex gap-2 border-t border-white/5 p-4"><input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder={userId ? 'Add an entertainment-related reply…' : 'Sign in to reply'} className={`${INPUT} min-w-0 flex-1 py-2.5`} /><button type="submit" disabled={busy || !comment.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cinema-600 text-white transition hover:bg-cinema-500 disabled:opacity-40" aria-label="Post reply"><Send className="h-4 w-4" /></button></form>
    </article>
  );
}

export function LetterboxPage() {
  const { user } = useAuth();
  const { data: titles } = useAsyncData(fetchPublishedTitles, []);
  const { data: feed, error, reload } = useAsyncData(fetchLetterboxFeed, []);\n  useEffect(() => subscribeToLetterbox(reload), [reload]);
  const [body, setBody] = useState('');
  const [titleId, setTitleId] = useState('');
  const [posting, setPosting] = useState(false);
  const { notify } = useToast();
  const linkedTitle = useMemo(() => (titles ?? []).find((title) => title.id === titleId), [titles, titleId]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return notify('Sign in to publish a post.', 'error');
    if (!body.trim()) return;
    setPosting(true);
    try { await createLetterboxPost(user.id, body, titleId || null); setBody(''); setTitleId(''); reload(); notify('Your post is now on Letterbox.'); }
    catch { notify('We could not publish your post. Please try again.', 'error'); }
    finally { setPosting(false); }
  }

  return (
    <div className={`${PAGE_CONTAINER} space-y-8 pb-12`}>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/20 bg-gradient-to-br from-cinema-700/35 via-ink-900 to-indigo-950 p-6 sm:p-9">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-cinema-400/15 blur-3xl" />
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cinema-200"><Sparkles className="h-4 w-4" /> Cinema social experience</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Letterbox</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">The conversation around the stories you love. Share recommendations, discuss releases and discover what friends and the Cinema community are enjoying.</p>
        <div className="mt-5 flex flex-wrap gap-3"><a href="/friends" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"><Users className="h-4 w-4" /> Your friends</a><a href="/watch-parties" className="inline-flex items-center gap-2 rounded-full bg-cinema-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-cinema-400"><Clapperboard className="h-4 w-4" /> Watch together</a></div>
      </header>
      {user && <form onSubmit={publish} className="space-y-3 rounded-3xl border border-white/10 bg-ink-900/80 p-5 shadow-xl"><label htmlFor="letterbox-post" className="block text-sm font-extrabold text-white">Share something worth talking about</label><textarea id="letterbox-post" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={4} placeholder="What are you watching, recommending or looking forward to?" className={`${INPUT} resize-y py-3`} /><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><select value={titleId} onChange={(event) => setTitleId(event.target.value)} className={`${INPUT} min-w-0 flex-1 py-2.5`}><option value="">No title attached</option>{(titles ?? []).map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}</select><span className="text-xs text-slate-500">{body.length}/2000</span><button type="submit" disabled={posting || !body.trim()} className={BUTTON_PRIMARY}>{posting ? 'Publishing…' : 'Publish to Letterbox'}</button></div>{linkedTitle && <p className="text-xs text-cinema-200">Linked to {linkedTitle.title}</p>}<p className="text-xs text-slate-500">Keep posts about entertainment. Only approved media can be published; video uploads are not enabled.</p></form>}
      {!user && <div className="rounded-2xl border border-white/10 bg-ink-900 p-5 text-sm text-slate-300"><a href="/sign-in" className="font-bold text-cinema-200">Sign in</a> to share recommendations and join the conversation.</div>}
      {!feed && (error ? <ErrorState onRetry={reload} /> : <LoadingState />)}
      {feed && feed.length === 0 && <EmptyState icon={<MessageCircle className="h-7 w-7 text-cinema-300" />} title="The conversation starts here" description="When the Cinema community shares entertainment recommendations and discussions, they will appear here." />}
      {feed && feed.length > 0 && <div className="mx-auto max-w-3xl space-y-5">{feed.map((post) => <PostCard key={post.id} post={post} userId={user?.id} onChanged={reload} />)}</div>}
    </div>
  );
}
