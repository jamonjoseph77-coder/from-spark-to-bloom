import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowUpRight, BadgeCheck, BookmarkPlus, Check, Eye, EyeOff,
  Heart, MessageCircle, Send, Share2, X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { useToast } from '@/hooks/useToast';
import {
  addClipComment, fetchClipEngagement, toggleClipReaction,
  type ClipComment, type DiscoverClip,
} from '@/lib/clips';
import { getYouTubeVideoId, isDirectVideoUrl, toEmbedUrl } from '@/lib/media';
import { navigateTo } from '@/lib/router';

export function ShortViewer({ clip, onClose }: { clip: DiscoverClip; onClose: () => void }) {
  const direct = isDirectVideoUrl(clip.video_url);
  const youtubeId = getYouTubeVideoId(clip.video_url);
  const embed = direct ? null : youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0&controls=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
    : toEmbedUrl(clip.video_url, { autoplay: true, muted: true });
  const { user } = useAuth();
  const userId = user?.id;
  const { watchlistIds, toggleWatchlist, ready: libraryReady } = useLibrary();
  const { notify } = useToast();
  const [sharing, setSharing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<ClipComment[]>([]);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [clearScreen, setClearScreen] = useState(false);
  const [loadingEngagement, setLoadingEngagement] = useState(true);
  const [savingReaction, setSavingReaction] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const inLibrary = Boolean(clip.title && watchlistIds.has(clip.title.id));

  useEffect(() => {
    let active = true;
    setLoadingEngagement(true);
    fetchClipEngagement(clip.id).then((engagement) => {
      if (!active) return;
      setLikeCount(engagement.reactions.length);
      setLiked(Boolean(userId && engagement.reactions.some((reaction) => reaction.user_id === userId)));
      setComments(engagement.comments);
    }).catch((error) => {
      console.warn('Cinema Short Engagement Is Temporarily Unavailable', error);
      if (active) notify('Engagement Is Temporarily Unavailable. The Video Can Still Be Enjoyed.', 'error');
    }).finally(() => { if (active) setLoadingEngagement(false); });
    return () => { active = false; };
  }, [clip.id, userId, notify]);

  async function shareShort() {
    const url = `${window.location.origin}/discover#short-${clip.id}`;
    try {
      setSharing(true);
      if (navigator.share) await navigator.share({ title: clip.headline, text: `Discover ${clip.headline} On Cinema.`, url });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        notify('Cinema Short Link Copied.');
      } else notify('Sharing Is Not Available On This Browser.', 'error');
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') notify('Could Not Share This Cinema Short. Please Try Again.', 'error');
    } finally { setSharing(false); }
  }

  async function toggleLike() {
    if (!user) {
      notify('Create A Cinema Account To React To This Short.');
      navigateTo('/sign-up');
      return;
    }
    if (savingReaction) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((count) => Math.max(0, count + (wasLiked ? -1 : 1)));
    setSavingReaction(true);
    try {
      await toggleClipReaction(clip.id, user.id, wasLiked);
    } catch (error) {
      setLiked(wasLiked);
      setLikeCount((count) => Math.max(0, count + (wasLiked ? 1 : -1)));
      console.error('Cinema Short Reaction Could Not Be Saved', error);
      notify('Your Reaction Could Not Be Saved. Please Try Again.', 'error');
    } finally { setSavingReaction(false); }
  }

  async function saveToLibrary() {
    if (!clip.title) return;
    if (!user) {
      notify('Create A Cinema Account To Add Titles To My Cinema.');
      navigateTo('/sign-up');
      return;
    }
    if (!libraryReady || savingToLibrary) return;
    setSavingToLibrary(true);
    try {
      await toggleWatchlist(clip.title.id);
    } finally {
      setSavingToLibrary(false);
    }
  }

  function openTitle() {
    if (!clip.title) {
      notify('The Full Title Is Not Linked To This Short Yet.', 'error');
      return;
    }
    navigateTo(`/title/${clip.title.id}`);
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      notify('Create A Cinema Account To Join The Conversation.');
      navigateTo('/sign-up');
      return;
    }
    const body = commentText.trim();
    if (!body || savingComment) return;
    setSavingComment(true);
    try {
      await addClipComment(clip.id, user.id, body);
      setCommentText('');
      const refreshed = await fetchClipEngagement(clip.id);
      setComments(refreshed.comments);
      notify('Your Comment Has Been Added.');
    } catch (error) {
      console.error('Cinema Short Comment Could Not Be Added', error);
      notify('Your Comment Could Not Be Added. Please Try Again.', 'error');
    } finally { setSavingComment(false); }
  }

  return (
    <Modal label={clip.headline} onClose={onClose} immersive>
      <div className="cinema-short-viewer relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-[#030508] sm:min-h-[min(94dvh,920px)]">
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {direct && <VideoPlayer src={clip.video_url} title={clip.headline} poster={clip.poster_url || undefined} layout="portrait" autoPlay muted showControls={!clearScreen} />}
          {embed && <iframe src={embed} title={clip.headline} className="h-full w-full bg-black" loading="eager" allow="autoplay; accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
          {!direct && !embed && <div className="grid h-full place-items-center p-8 text-center text-sm text-slate-400">This Video Link Is Not Supported Yet. Please Use A Cinema-Compatible Video Link.</div>}
        </div>

        <div className="absolute inset-x-3 top-3 z-40 flex items-center justify-between gap-3 sm:inset-x-5 sm:top-5">
          <div className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#07101b]/75 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-100 shadow-lg backdrop-blur-xl transition-opacity ${clearScreen ? 'opacity-0' : 'opacity-100'}`}>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-200/10 text-sky-100"><BadgeCheck className="h-3.5 w-3.5" /></span>
            Cinema Shorts
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setClearScreen((value) => !value); setCommentOpen(false); }} aria-pressed={clearScreen} aria-label={clearScreen ? 'Show Cinema controls' : 'Clear video screen'} title={clearScreen ? 'Show Controls' : 'Clear View'} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/65 text-white shadow-lg backdrop-blur-xl transition hover:border-sky-200/50 hover:bg-sky-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
              {clearScreen ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button type="button" onClick={onClose} aria-label="Close Cinema Short" className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/65 text-white shadow-lg backdrop-blur-xl transition hover:border-white/50 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {!clearScreen && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/85 to-transparent px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-44">
              <div className="pointer-events-auto flex items-end gap-3 pr-16">
                <div className="min-w-0 flex-1">
                  <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sky-200/20 bg-[#0b1726]/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-100"><BadgeCheck className="h-3.5 w-3.5" /> {clip.publisher_name || 'Cinema Publisher'}</p>
                  <h2 className="line-clamp-3 text-lg font-extrabold leading-snug text-white drop-shadow-lg">{clip.headline}</h2>
                  <p className="mt-1 text-xs text-slate-300">{clip.duration_seconds ? `Cinema Short · ${clip.duration_seconds} Seconds` : 'A Story From Cinema'}</p>
                  {clip.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">{clip.description}</p>}
                  {clip.title ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={openTitle} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-100 to-slate-200 px-4 py-2.5 text-xs font-extrabold text-[#07101b] shadow-[0_8px_28px_rgba(140,180,220,.22)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Watch Now
                      </button>
                      <button type="button" onClick={() => void saveToLibrary()} disabled={!libraryReady || savingToLibrary} aria-pressed={inLibrary} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#0b1726]/80 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg backdrop-blur-xl transition hover:border-sky-200/50 hover:bg-sky-200/10 disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
                        {inLibrary ? <Check className="h-3.5 w-3.5 text-sky-200" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                        {inLibrary ? 'In My Cinema' : 'Add To My Cinema'}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] font-semibold text-slate-300">Full Title Details Are Not Available For This Short Yet.</p>
                  )}
                  {youtubeId && <a href={clip.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold text-slate-300 underline decoration-white/30 underline-offset-4 transition hover:text-white">View Original Publisher Video <ArrowUpRight className="h-3.5 w-3.5" /></a>}
                </div>
              </div>
            </div>

            <div className={`absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 transition-opacity sm:right-4 ${commentOpen ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
              <button type="button" onClick={() => void toggleLike()} disabled={savingReaction} aria-label={liked ? 'Remove Like' : 'Like This Cinema Short'} aria-pressed={liked} className="group flex min-h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl border border-sky-100/20 bg-[#07101b]/80 p-2 text-white shadow-[0_8px_28px_rgba(0,0,0,.55)] backdrop-blur-xl transition hover:border-sky-100/50 hover:bg-sky-200/10 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
                <Heart className={`h-5 w-5 transition ${liked ? 'fill-sky-200 text-sky-100' : 'text-white group-hover:text-sky-100'}`} />
                <span className="text-[10px] font-bold tabular-nums">{likeCount}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Appreciate</span>
              </button>
              <button type="button" onClick={() => setCommentOpen((open) => !open)} aria-label="Open Story Conversation" aria-expanded={commentOpen} className="flex min-h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-[#07101b]/80 p-2 text-white shadow-[0_8px_28px_rgba(0,0,0,.55)] backdrop-blur-xl transition hover:border-sky-100/50 hover:bg-sky-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
                <MessageCircle className="h-5 w-5" />
                <span className="text-[10px] font-bold tabular-nums">{loadingEngagement ? '…' : comments.length}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Talk</span>
              </button>
              <button type="button" disabled={sharing} onClick={() => void shareShort()} aria-label="Share This Cinema Short" className="flex min-h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-[#07101b]/80 p-2 text-white shadow-[0_8px_28px_rgba(0,0,0,.55)] backdrop-blur-xl transition hover:border-sky-100/50 hover:bg-sky-200/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
                <Share2 className="h-5 w-5" /><span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Share</span>
              </button>
            </div>
          </>
        )}

        {commentOpen && !clearScreen && (
          <section aria-label="Cinema Short Conversation" className="absolute inset-x-2 bottom-2 z-40 max-h-[54dvh] overflow-hidden rounded-[1.4rem] border border-sky-100/20 bg-[#080e18]/[.98] p-4 shadow-[0_24px_80px_rgba(0,0,0,.8)] backdrop-blur-2xl sm:inset-x-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><p className="text-sm font-extrabold text-white">The Conversation <span className="ml-1 text-xs font-semibold text-slate-400">({comments.length})</span></p><p className="text-[11px] text-slate-400">Thoughts About The Story, From The Cinema Community.</p></div>
              <button type="button" onClick={() => setCommentOpen(false)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">Close</button>
            </div>
            <div className="max-h-[25dvh] space-y-3 overflow-y-auto pr-1">
              {loadingEngagement ? <p className="py-4 text-center text-xs text-slate-400">Loading The Conversation…</p> : comments.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No Comments Yet. Start A Thoughtful Conversation.</p>}
              {comments.map((comment) => <article key={comment.id} className="border-b border-white/[.07] pb-2"><p className="text-xs font-bold text-sky-100">{comment.author_name}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{comment.body}</p></article>)}
            </div>
            <form onSubmit={(event) => void submitComment(event)} className="mt-3 flex items-center gap-2">
              <input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} placeholder={user ? 'Share A Thought About This Story…' : 'Create An Account To Join The Conversation'} aria-label="Your Comment" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50 focus:ring-2 focus:ring-sky-200/10" />
              <button type="submit" disabled={!commentText.trim() || savingComment} aria-label="Post Comment" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-100 to-slate-200 text-[#07101b] transition hover:brightness-110 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Send className="h-4 w-4" /></button>
            </form>
          </section>
        )}
      </div>
    </Modal>
  );
}
