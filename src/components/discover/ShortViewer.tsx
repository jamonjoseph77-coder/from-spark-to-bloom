import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowUpRight, BookmarkPlus, Check, Download, Eye, EyeOff, Play,
  Heart, MessageCircle, Send, Volume2, VolumeX, X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ContentEngagement } from '@/components/discover/ContentEngagement';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { useToast } from '@/hooks/useToast';
import {
  type DiscoverClip,
  recordDiscoverClipView,
  fetchSavedDiscoverClipIds,
  setDiscoverClipSaved,
  downloadPermittedClip,
} from '@/lib/clips';
import { addDiscoverContentComment, fetchDiscoverContentEngagement, toggleDiscoverContentLike, type DiscoverContentComment } from '@/lib/discoverEngagement';
import { getYouTubeVideoId, isDirectVideoUrl, isHlsUrl, toEmbedUrl } from '@/lib/media';
import { navigateTo } from '@/lib/router';

export function ShortViewer({ clip, onClose }: { clip: DiscoverClip; onClose: () => void }) {
  const engagementKey = `clip:${clip.id}`;
  const direct = isDirectVideoUrl(clip.video_url);
  const youtubeId = getYouTubeVideoId(clip.video_url);
  const isVimeo = /vimeo\.com/i.test(clip.video_url);
  const fallbackEmbed = toEmbedUrl(clip.video_url, { autoplay: true, muted: true });
  const embed = direct ? null : youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0&controls=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
    : fallbackEmbed && isVimeo ? `${fallbackEmbed}&playsinline=1&api=1&player_id=cinema-short-player` : fallbackEmbed;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const viewedClipIdRef = useRef<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const { user } = useAuth();
  const userId = user?.id;
  const { watchlistIds, toggleWatchlist, ready: libraryReady } = useLibrary();
  const { notify } = useToast();
  const [liked, setLiked] = useState(false);
  const [viewsCount, setViewsCount] = useState(clip.views_count ?? 0);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<DiscoverContentComment[]>([]);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [clearScreen, setClearScreen] = useState(false);
  const [loadingEngagement, setLoadingEngagement] = useState(true);
  const [savingReaction, setSavingReaction] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [savedShort, setSavedShort] = useState(false);
  const [savingShort, setSavingShort] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const inLibrary = Boolean(clip.title && watchlistIds.has(clip.title.id));

  useEffect(() => {
    let active = true;
    if (!user) { setSavedShort(false); return; }
    fetchSavedDiscoverClipIds(user.id).then((ids) => { if (active) setSavedShort(ids.includes(clip.id)); })
      .catch((cause) => console.warn('Saved Short Status Could Not Be Loaded', cause));
    return () => { active = false; };
  }, [clip.id, user?.id]);

  useEffect(() => {
    setViewsCount(clip.views_count ?? 0);
    if (viewedClipIdRef.current === clip.id) return;
    viewedClipIdRef.current = clip.id;
    recordDiscoverClipView(clip.id).then((count) => {
      if (typeof count === 'number' && count > 0) setViewsCount(count);
    }).catch((error) => {
      console.warn('Cinema Short View Could Not Be Recorded', error);
    });
  }, [clip.id, clip.views_count, userId]);

  useEffect(() => {
    let active = true;
    setLoadingEngagement(true);
    fetchDiscoverContentEngagement(engagementKey).then((engagement) => {
      if (!active) return;
      setLikeCount(engagement.reactionCount);
      setLiked(engagement.likedByCurrentUser);
      setComments(engagement.comments);
    }).catch((error) => {
      console.warn('Cinema Short Engagement Is Temporarily Unavailable', error);
      if (active) notify('Engagement Is Temporarily Unavailable. The Video Can Still Be Enjoyed.', 'error');
    }).finally(() => { if (active) setLoadingEngagement(false); });
    return () => { active = false; };
  }, [clip.id, engagementKey, userId, notify]);

  function toggleEmbeddedSound() {
    const nextMuted = !isMuted;
    if (youtubeId) {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
        event: 'command', func: nextMuted ? 'mute' : 'unMute', args: [],
      }), 'https://www.youtube.com');
    } else if (isVimeo) {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
        method: 'setVolume', value: nextMuted ? 0 : 1,
      }), 'https://player.vimeo.com');
    }
    setIsMuted(nextMuted);
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
      await toggleDiscoverContentLike(engagementKey, user.id, wasLiked);
    } catch (error) {
      setLiked(wasLiked);
      setLikeCount((count) => Math.max(0, count + (wasLiked ? 1 : -1)));
      console.error('Cinema Short Reaction Could Not Be Saved', error);
      notify('Your Reaction Could Not Be Saved. Please Try Again.', 'error');
    } finally { setSavingReaction(false); }
  }

  async function toggleSaveShort() {
    if (!user) { notify('Sign In To Save Shorts To My Cinema.'); navigateTo('/sign-in'); return; }
    if (savingShort) return;
    const next = !savedShort;
    setSavedShort(next);
    setSavingShort(true);
    try { await setDiscoverClipSaved(clip.id, user.id, next); }
    catch (cause) {
      setSavedShort(!next);
      console.error('Cinema Short Could Not Be Saved', cause);
      notify('This Short Could Not Be Saved. Please Try Again.', 'error');
    } finally { setSavingShort(false); }
  }

  async function downloadShortVideo() {
    if (!clip.download_allowed || !direct || isHlsUrl(clip.video_url) || downloading) return;
    setDownloading(true);
    try {
      await downloadPermittedClip(clip);
      notify('Your approved download has started.');
    } catch (cause) {
      console.error('Cinema Short Download Could Not Start', cause);
      notify('This approved video could not be downloaded from its host. Please try again later.', 'error');
    } finally {
      setDownloading(false);
    }
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
      notify('Create A Cinema Account To Join The Discussion.');
      navigateTo('/sign-up');
      return;
    }
    const body = commentText.trim();
    if (!body || savingComment) return;
    setSavingComment(true);
    try {
      await addDiscoverContentComment(engagementKey, user.id, body);
      setCommentText('');
      const refreshed = await fetchDiscoverContentEngagement(engagementKey);
      setComments(refreshed.comments);
      notify('Your Comment Has Been Added.');
    } catch (error) {
      console.error('Cinema Short Review Could Not Be Added', error);
      notify('Your Comment Could Not Be Added. Please Try Again.', 'error');
    } finally { setSavingComment(false); }
  }

  return (
    <Modal label={clip.headline} onClose={onClose} immersive contained showCloseButton={false}>
      <div className="cinema-short-viewer relative mx-auto flex min-h-0 flex-col justify-center overflow-hidden bg-[#030508]">
        <div className="cinema-short-video-stage absolute inset-0 flex items-center justify-center bg-black">
          {direct && <VideoPlayer src={clip.video_url} title={clip.headline} poster={clip.poster_url || undefined} layout="portrait" autoPlay muted={isMuted} onMutedChange={setIsMuted} showMuteToggle showControls={!clearScreen} />}
          {embed && <iframe ref={iframeRef} src={embed} title={clip.headline} className="cinema-short-embed h-full w-full bg-black" loading="eager" allow="autoplay; accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
          {!direct && !embed && <div className="grid h-full place-items-center p-8 text-center text-sm text-slate-400">This Video Link Is Not Supported Yet. Please Use A Cinema-Compatible Video Link.</div>}
        </div>

        {(youtubeId || isVimeo) && !direct && !clearScreen && (
          <button
            type="button"
            onClick={toggleEmbeddedSound}
            aria-label={isMuted ? 'Turn Sound On' : 'Mute Video'}
            aria-pressed={!isMuted}
            className="absolute left-3 top-16 z-40 grid h-12 w-12 touch-manipulation place-items-center rounded-full border border-white/25 bg-black/80 text-white shadow-[0_8px_28px_rgba(0,0,0,.65)] backdrop-blur-xl transition hover:border-sky-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 active:scale-95"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 text-sky-100" />}
            <span className="sr-only">{isMuted ? 'Sound Off' : 'Sound On'}</span>
          </button>
        )}
        <div className="absolute inset-x-3 top-3 z-40 flex items-center justify-between gap-3 sm:inset-x-5 sm:top-5">
          <div className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#07101b]/75 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-100 shadow-lg backdrop-blur-xl transition-opacity ${clearScreen ? 'opacity-0' : 'opacity-100'}`}>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#087cff]/20 text-[#8dc4ff]"><Play className="h-3.5 w-3.5 fill-current" /></span>
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
                  <h2 className="line-clamp-3 text-lg font-extrabold leading-snug text-white drop-shadow-lg">{clip.headline}</h2>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#8dbfff]">{clip.duration_seconds ? `Short Video · ${clip.duration_seconds} Seconds` : 'A Story From Cinema'}</p>
                  {clip.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">{clip.description}</p>}
                  {clip.title ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={openTitle} className="cinema-short-viewer__watch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
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
                  {clip.download_allowed && direct && !isHlsUrl(clip.video_url) && <button type="button" onClick={() => void downloadShortVideo()} disabled={downloading} className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3.5 py-2 text-xs font-bold text-white transition hover:border-cinema-200/50 hover:bg-white/10 disabled:opacity-50"><Download className="h-3.5 w-3.5" /> {downloading ? 'Preparing Download…' : 'Download Approved Video'}</button>}
                  {youtubeId && <a href={clip.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold text-slate-300 underline decoration-white/30 underline-offset-4 transition hover:text-white">View Original Publisher Video <ArrowUpRight className="h-3.5 w-3.5" /></a>}
                </div>
              </div>
            </div>

            <div className={`cinema-short-action-rail absolute right-2 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 transition-opacity sm:right-4 ${commentOpen ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
              <button type="button" onClick={() => void toggleLike()} disabled={savingReaction} aria-label={liked ? 'Remove Like' : 'Like This Cinema Short'} aria-pressed={liked} className="cinema-social-action cinema-short-action group flex flex-col items-center justify-center gap-1 p-2 text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
                <Heart className={`h-6 w-6 transition ${liked ? 'fill-[#58a9ff] text-[#8bc5ff]' : 'text-white group-hover:text-[#8bc5ff]'}`} />
                <span className="text-[10px] font-bold tabular-nums">{likeCount}</span>
              </button>
              <button type="button" onClick={() => void toggleSaveShort()} disabled={savingShort} aria-label={savedShort ? 'Remove Short From Saved Shorts' : 'Save This Short'} aria-pressed={savedShort} className="cinema-social-action cinema-short-action flex flex-col items-center justify-center gap-1 p-2 text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
                {savedShort ? <Check className="h-6 w-6 text-sky-200" /> : <BookmarkPlus className="h-6 w-6" />}
                <span className="text-[10px] font-bold">{savedShort ? 'Saved' : 'Save'}</span>
              </button>
              <button type="button" onClick={() => setCommentOpen((open) => !open)} aria-label="Open Comments" aria-expanded={commentOpen} className="cinema-social-action cinema-short-action flex flex-col items-center justify-center gap-1 p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
                <MessageCircle className="h-6 w-6" />
                <span className="text-[10px] font-bold tabular-nums">{loadingEngagement ? '…' : comments.length}</span>
              </button>
              <div className="cinema-short-share-actions"><ContentEngagement contentKey={engagementKey} title={clip.headline} href={`/discover#short-${clip.id}`} imageUrl={clip.poster_url} shareOnly clipId={clip.id} viewsCount={viewsCount} /></div>
            </div>
          </>
        )}

        {commentOpen && !clearScreen && (
          <section aria-label="Cinema Short Comments" className="cinema-social-panel absolute inset-x-2 bottom-2 z-40 max-h-[54dvh] overflow-hidden rounded-[1.4rem] p-4 backdrop-blur-2xl sm:inset-x-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><p className="text-sm font-extrabold text-white">Comments <span className="ml-1 text-xs font-semibold text-slate-400">({comments.length})</span></p><p className="text-[11px] text-slate-400">Join The Conversation Around This Short.</p></div>
              <button type="button" onClick={() => setCommentOpen(false)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">Close</button>
            </div>
            <div className="max-h-[25dvh] space-y-3 overflow-y-auto pr-1">
              {loadingEngagement ? <p className="py-4 text-center text-xs text-slate-400">Loading Comments…</p> : comments.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No Comments Yet. Start The Conversation.</p>}
              {comments.map((comment) => <article key={comment.id} className="border-b border-white/[.07] pb-2"><p className="text-xs font-bold text-sky-100">{comment.author_name}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{comment.body}</p></article>)}
            </div>
            <form onSubmit={(event) => void submitComment(event)} className="mt-3 flex items-center gap-2">
              <input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} placeholder={user ? 'Write A Comment…' : 'Sign In To Comment'} aria-label="Your Comment" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50 focus:ring-2 focus:ring-sky-200/10" />
              <button type="submit" disabled={!commentText.trim() || savingComment} aria-label="Post Comment" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-100 to-slate-200 text-[#07101b] transition hover:brightness-110 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Send className="h-4 w-4" /></button>
            </form>
          </section>
        )}
      </div>
    </Modal>
  );
}
