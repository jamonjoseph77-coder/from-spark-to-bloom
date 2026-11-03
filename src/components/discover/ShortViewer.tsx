import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, BadgeCheck, ExternalLink, Heart, MessageCircle, Send, Share2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { addClipComment, fetchClipEngagement, isDirectVideoUrl, toggleClipReaction, type ClipComment, type DiscoverClip } from '@/lib/clips';
import { getYouTubeVideoId, toEmbedUrl } from '@/lib/media';
import { navigateTo } from '@/lib/router';

export function ShortViewer({ clip, onClose }: { clip: DiscoverClip; onClose: () => void }) {
  const direct = isDirectVideoUrl(clip.video_url);
  const youtubeId = getYouTubeVideoId(clip.video_url);
  const embed = direct ? null : youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0&controls=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
    : toEmbedUrl(clip.video_url, { autoplay: true, muted: true });
  const canWatchTitle = Boolean(clip.title?.playback_url?.trim()) && clip.title?.type !== 'series';
  const { user } = useAuth();
  const { notify } = useToast();
  const [sharing, setSharing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<ClipComment[]>([]);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loadingEngagement, setLoadingEngagement] = useState(true);
  const [savingReaction, setSavingReaction] = useState(false);
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingEngagement(true);
    fetchClipEngagement(clip.id).then((engagement) => {
      if (!active) return;
      setLikeCount(engagement.reactions.length);
      setLiked(Boolean(user && engagement.reactions.some((reaction) => reaction.user_id === user.id)));
      setComments(engagement.comments);
    }).catch((error) => {
      console.warn('Short engagement is temporarily unavailable', error);
    }).finally(() => { if (active) setLoadingEngagement(false); });
    return () => { active = false; };
  }, [clip.id, user?.id]);

  async function shareShort() {
    const url = `${window.location.origin}/discover#short-${clip.id}`;
    try {
      setSharing(true);
      if (navigator.share) await navigator.share({ title: clip.headline, text: `Watch ${clip.headline} on Cinema.`, url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); notify('Short link copied.'); }
      else notify("Sharing isn't available on this browser.", 'error');
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') notify("Couldn't share this short. Try again.", 'error');
    } finally { setSharing(false); }
  }

  async function toggleLike() {
    if (!user) { notify('Sign in to react to Cinema Shorts.'); navigateTo('/sign-in'); return; }
    if (savingReaction) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((count) => Math.max(0, count + (wasLiked ? -1 : 1)));
    setSavingReaction(true);
    try { await toggleClipReaction(clip.id, user.id, wasLiked); }
    catch (error) {
      setLiked(wasLiked);
      setLikeCount((count) => Math.max(0, count + (wasLiked ? 1 : -1)));
      console.error('Could not save short reaction', error);
      notify('Your reaction could not be saved. Please try again.', 'error');
    } finally { setSavingReaction(false); }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { notify('Sign in to comment on Cinema Shorts.'); navigateTo('/sign-in'); return; }
    const body = commentText.trim();
    if (!body || savingComment) return;
    setSavingComment(true);
    try {
      await addClipComment(clip.id, user.id, body);
      setCommentText('');
      const refreshed = await fetchClipEngagement(clip.id);
      setComments(refreshed.comments);
      notify('Comment added.');
    } catch (error) {
      console.error('Could not add short comment', error);
      notify('Your comment could not be added. Please try again.', 'error');
    } finally { setSavingComment(false); }
  }

  return (
    <Modal label={clip.headline} onClose={onClose} immersive>
      <div className="cinema-short-viewer relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-[#030508] sm:min-h-[min(94dvh,920px)]">
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {direct && <VideoPlayer src={clip.video_url} title={clip.headline} poster={clip.poster_url || undefined} layout="portrait" autoPlay muted />}
          {embed && <iframe src={embed} title={clip.headline} className="h-full w-full bg-black" loading="eager" allow="autoplay; accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
          {!direct && !embed && <div className="grid h-full place-items-center p-8 text-center text-sm text-slate-400">This Video Link Is Not Supported Yet. Please Use A Cinema-Compatible Video Link.</div>}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/85 to-transparent px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-44">
          <div className="pointer-events-auto flex items-end gap-3 pr-14">
            <div className="min-w-0 flex-1">
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-200"><BadgeCheck className="h-3.5 w-3.5" /> Cinema Publisher</p>
              <h2 className="line-clamp-3 text-lg font-extrabold leading-snug text-white drop-shadow-lg">{clip.headline}</h2>
              <p className="mt-1 text-xs text-slate-300">{clip.publisher_name || 'Cinema'}{clip.duration_seconds ? ` · ${clip.duration_seconds}s` : ''}</p>
              {clip.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">{clip.description}</p>}
              {youtubeId && <a href={clip.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/20">Open Original Video <ExternalLink className="h-3.5 w-3.5" /></a>}
              {canWatchTitle && clip.title && <a href={`/watch/${clip.title.id}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-ink-950 shadow-lg transition hover:bg-sky-100">Watch Full Title <ArrowUpRight className="h-3.5 w-3.5" /></a>}
              {clip.title && !canWatchTitle && <a href={`/title/${clip.title.id}`} className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20">Explore Title <ArrowUpRight className="h-3.5 w-3.5" /></a>}
            </div>
          </div>
        </div>

        <div className={`absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 transition-opacity sm:right-4 ${commentOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <button type="button" onClick={() => void toggleLike()} disabled={savingReaction} aria-label={liked ? 'Unlike this short' : 'Like this short'} className="group flex min-h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-black/75 p-2 text-white shadow-[0_8px_28px_rgba(0,0,0,.55)] backdrop-blur-xl transition hover:border-rose-200/50 hover:bg-rose-500/20 disabled:opacity-60">
            <Heart className={`h-5 w-5 transition ${liked ? 'fill-rose-400 text-rose-400' : 'text-white group-hover:text-rose-200'}`} />
            <span className="text-[10px] font-bold tabular-nums">{likeCount}</span>
          </button>
          <button type="button" onClick={() => setCommentOpen((open) => !open)} aria-label="Open comments" className="flex min-h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-black/75 p-2 text-white shadow-[0_8px_28px_rgba(0,0,0,.55)] backdrop-blur-xl transition hover:border-sky-200/50 hover:bg-sky-500/20">
            <MessageCircle className="h-5 w-5" />
            <span className="text-[10px] font-bold tabular-nums">{loadingEngagement ? '…' : comments.length}</span>
          </button>
          <button type="button" disabled={sharing} onClick={() => void shareShort()} aria-label="Share this short" className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-black/75 text-white shadow-[0_8px_28px_rgba(0,0,0,.55)] backdrop-blur-xl transition hover:border-sky-200/50 hover:bg-sky-500/20 disabled:opacity-50"><Share2 className="h-5 w-5" /></button>
        </div>

        {commentOpen && (
          <section aria-label="Short comments" className="absolute inset-x-2 bottom-2 z-40 max-h-[54dvh] overflow-hidden rounded-2xl border border-white/20 bg-[#090d0c]/[.98] p-4 shadow-[0_24px_80px_rgba(0,0,0,.8)] backdrop-blur-2xl sm:inset-x-4">
            <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold text-white">Comments <span className="ml-1 text-xs font-semibold text-slate-400">({comments.length})</span></p><p className="text-[11px] text-slate-400">Keep it about the story.</p></div><button type="button" onClick={() => setCommentOpen(false)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10">Close</button></div>
            <div className="max-h-[25dvh] space-y-3 overflow-y-auto pr-1">
              {loadingEngagement ? <p className="py-4 text-center text-xs text-slate-400">Loading comments…</p> : comments.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No comments yet. Start a thoughtful conversation.</p>}
              {comments.map((comment) => <article key={comment.id} className="border-b border-white/[.07] pb-2"><p className="text-xs font-bold text-sky-100">{comment.author_name}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{comment.body}</p></article>)}
            </div>
            <form onSubmit={(event) => void submitComment(event)} className="mt-3 flex items-center gap-2">
              <input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} placeholder={user ? 'Add a comment about this video…' : 'Sign in to join the conversation'} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-sky-200/40" />
              <button type="submit" disabled={!commentText.trim() || savingComment} aria-label="Post comment" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-300 text-[#07101b] transition hover:bg-sky-200 disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </form>
          </section>
        )}
      </div>
    </Modal>
  );
}
