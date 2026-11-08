import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, ArrowUpRight, BookmarkCheck, BookmarkPlus, Clapperboard, Download, Eye, Heart, MessageCircle, RefreshCw, Search, Share2, Volume2, VolumeX } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { navigateTo } from '@/lib/router';
import { fetchFollowedPublishers, followPublisher, unfollowPublisher } from '@/lib/publisherFollows';
import { downloadPermittedClip, fetchPublishedShorts, fetchPublishedShortsAwaitingNativeSource, fetchSavedDiscoverClipIds, setDiscoverClipSaved, isPlayableShort, rankPublishedShorts, type DiscoverClip } from '@/lib/clips';
import { getYouTubeVideoId, isDirectVideoUrl, isHlsUrl, toEmbedUrl } from '@/lib/media';
import { addDiscoverContentComment, fetchDiscoverContentEngagement, toggleDiscoverContentLike, type DiscoverContentComment } from '@/lib/discoverEngagement';
import { publisherHref } from '@/lib/publishers';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';
import { fetchDiscoverableProfileByDisplayName } from '@/lib/profiles';

type ViewerSignals = { completedIds: string[]; likedIds: string[]; publisherAffinity: Record<string, number>; titleAffinity: Record<string, number> };
const SIGNALS_KEY_PREFIX = 'cinema:shorts-viewer-signals:v2:';

function signalsStorageKey(userId?: string): string {
  return SIGNALS_KEY_PREFIX + (userId || 'guest');
}
const EMPTY_SIGNALS: ViewerSignals = { completedIds: [], likedIds: [], publisherAffinity: {}, titleAffinity: {} };

function readStringIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0))].slice(-300)
    : [];
}

function readAffinity(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, score]) => key.length > 0 && key.length <= 256 && typeof score === 'number' && Number.isFinite(score))
      .map(([key, score]) => [key, Math.max(-8, Math.min(8, score as number))]),
  );
}

function boundAffinity(score: number): number {
  return Math.max(-8, Math.min(8, Number.isFinite(score) ? score : 0));
}

function readSignals(userId?: string): ViewerSignals {
  try {
    const raw = window.localStorage.getItem(signalsStorageKey(userId));
    if (!raw) return EMPTY_SIGNALS;
    const parsed = JSON.parse(raw) as Partial<ViewerSignals>;
    return {
      completedIds: readStringIds(parsed.completedIds),
      likedIds: readStringIds(parsed.likedIds),
      publisherAffinity: readAffinity(parsed.publisherAffinity),
      titleAffinity: readAffinity(parsed.titleAffinity),
    };
  } catch { return EMPTY_SIGNALS; }
}
function saveSignals(signals: ViewerSignals, userId?: string) {
  try { window.localStorage.setItem(signalsStorageKey(userId), JSON.stringify(signals)); } catch { /* Local personalization is optional. */ }
}

function ShortFeedItem({ clip, active, saved, saving, audioEnabled, userId, onLike, onEngagementLoaded, onSave, onCompleted, onAudioChange, onDownload, downloadingClipId, onSignIn, onTrack, tracked, tracking }: {
  clip: DiscoverClip; active: boolean; saved: boolean; saving: boolean; audioEnabled: boolean; userId?: string;
  onLike: (clip: DiscoverClip, wasLiked: boolean) => Promise<void>; onEngagementLoaded: (clip: DiscoverClip, liked: boolean) => void; onSave: (clip: DiscoverClip) => void; onCompleted: (clip: DiscoverClip) => void; onAudioChange: (enabled: boolean) => void;
  onDownload: (clip: DiscoverClip) => void; downloadingClipId: string | null; onSignIn: () => void; onTrack: (clip: DiscoverClip) => void; tracked: boolean; tracking: boolean;
}) {
  const [publisherAvatarUrl, setPublisherAvatarUrl] = useState<string | null>(null);
  const [reactionCount, setReactionCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const [savingReaction, setSavingReaction] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [engagementLoading, setEngagementLoading] = useState(true);
  const [comments, setComments] = useState<DiscoverContentComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTouchTapRef = useRef<{ at: number; x: number; y: number } | null>(null);
  const lastTouchDoubleTapAtRef = useRef(0);
  const { notify } = useToast();

  useEffect(() => {
    if (!active) return;
    let current = true;
    setPublisherAvatarUrl(null);
    fetchDiscoverableProfileByDisplayName(clip.publisher_name || '').then((profile) => {
      if (current) setPublisherAvatarUrl(profile?.avatar_url ?? null);
    }).catch((error) => console.warn('Cinema Creator Avatar Could Not Load', error));
    return () => { current = false; };
  }, [active, clip.publisher_name]);

  useEffect(() => {
    if (!active) return;
    let current = true;
    setEngagementLoading(true);
    fetchDiscoverContentEngagement("clip:" + clip.id).then((value) => {
      if (current) { setReactionCount(value.reactionCount); setLikedByUser(value.likedByCurrentUser); setComments(value.comments); onEngagementLoaded(clip, value.likedByCurrentUser); }
    }).catch((error) => console.warn("Cinema Short Engagement Could Not Load", error)).finally(() => {
      if (current) setEngagementLoading(false);
    });
    return () => { current = false; };
  }, [active, clip, userId, onEngagementLoaded]);

  function toggleAudio() {
    onAudioChange(!audioEnabled);
  }

  async function handleLike() {
    if (!userId) { onSignIn(); return; }
    if (savingReaction || engagementLoading) return;
    const previous = likedByUser;
    setLikedByUser(!previous);
    setReactionCount((count) => Math.max(0, count + (previous ? -1 : 1)));
    setSavingReaction(true);
    try { await onLike(clip, previous); }
    catch {
      setLikedByUser(previous);
      setReactionCount((count) => Math.max(0, count + (previous ? 1 : -1)));
    } finally { setSavingReaction(false); }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) { onSignIn(); return; }
    const body = commentText.trim();
    if (!body || savingComment) return;
    setSavingComment(true);
    try {
      await addDiscoverContentComment(`clip:${clip.id}`, userId, body);
      setCommentText('');
      const refreshed = await fetchDiscoverContentEngagement(`clip:${clip.id}`);
      setComments(refreshed.comments);
      notify('Your Comment Has Been Added.');
    } catch (cause) {
      console.error('Cinema Short Comment Could Not Be Added', cause);
      notify('Your Comment Could Not Be Added. Please Try Again.', 'error');
    } finally { setSavingComment(false); }
  }

  async function shareShort() {
    const url = window.location.origin + "/shorts?clip=" + encodeURIComponent(clip.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: clip.headline, text: clip.description, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        notify('Cinema Short Link Copied.');
      } else {
        notify('Sharing Is Not Available On This Browser.', 'error');
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name !== 'AbortError') {
        console.warn('Cinema Short Could Not Be Shared', cause);
        notify('This Short Could Not Be Shared. Please Try Again.', 'error');
      }
    }
  }
  function triggerDoubleTapLike(target: HTMLElement) {
    if (target.closest('button, a, input, textarea, form, section')) return;
    setShowDoubleTapHeart(true);
    window.setTimeout(() => setShowDoubleTapHeart(false), 720);
    if (!likedByUser) void handleLike();
  }

  function handleVideoDoubleTap(event: MouseEvent<HTMLElement>) {
    if (Date.now() - lastTouchDoubleTapAtRef.current < 500) return;
    triggerDoubleTapLike(event.target as HTMLElement);
  }

  function handleVideoPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== 'touch') return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, form, section')) {
      lastTouchTapRef.current = null;
      return;
    }
    const now = Date.now();
    const previous = lastTouchTapRef.current;
    const closeEnough = previous && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 48;
    if (previous && now - previous.at < 340 && closeEnough) {
      lastTouchTapRef.current = null;
      lastTouchDoubleTapAtRef.current = now;
      triggerDoubleTapLike(target);
    } else {
      lastTouchTapRef.current = { at: now, x: event.clientX, y: event.clientY };
    }
  }

  const description = clip.description?.trim() || `${clip.publisher_name || 'This creator'} shares a short moment on Cinema.`;

  return (
    <article onDoubleClick={handleVideoDoubleTap} onPointerUp={handleVideoPointerUp} className="relative isolate h-full min-h-0 w-full snap-start overflow-hidden border-0 bg-[#030508] shadow-none" aria-label="Cinema Short Video. Double-click To Like.">
      <div className="absolute inset-0 bg-[#030508]">
        {active && isDirectVideoUrl(clip.video_url) ? (
          <VideoPlayer key={clip.id} src={clip.video_url} title={clip.headline} poster={clip.poster_url || undefined} layout="portrait" autoPlay muted={!audioEnabled} showControls={false} showMuteToggle={false} onMutedChange={(muted) => onAudioChange(!muted)} onProgress={(progress) => { if (progress.completed) onCompleted(clip); }} />
        ) : active && getYouTubeVideoId(clip.video_url) ? (
          <iframe key={clip.id + (audioEnabled ? '-sound' : '-muted')} src={toEmbedUrl(clip.video_url, { autoplay: true, muted: !audioEnabled }) ?? undefined} title={clip.headline} className="h-full w-full border-0 object-cover" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        ) : (
          <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover opacity-80" />
        )}
      </div>
      {showDoubleTapHeart && <div className="cinema-short-double-tap-heart pointer-events-none absolute left-1/2 top-[43%] z-40 -translate-x-1/2 -translate-y-1/2"><Heart className="h-24 w-24 fill-[#ff315d] text-white drop-shadow-[0_8px_28px_rgba(255,49,93,.65)]" /></div>}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />
      <div className="cinema-short-overlay pointer-events-none absolute inset-0 z-20">
        <div className="cinema-short-info pointer-events-auto min-w-0 flex-1 pr-2">
          <a href={publisherHref(clip.publisher_name || "Cinema")} className="inline-flex max-w-full items-center gap-2 text-xs font-bold text-white/90">
            <ProfileAvatar name={clip.publisher_name || "Cinema Creator"} imageUrl={publisherAvatarUrl} size="sm" previewable={false} />
            <span className="truncate">{clip.publisher_name || "Cinema Creator"}</span>
          </a>
          <h2 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-white drop-shadow-lg sm:text-xl">{clip.headline}</h2>
          <div className="mt-1 max-w-full">
            <p className={`text-xs leading-5 text-white/85 drop-shadow-md ${descriptionExpanded ? 'max-h-[22dvh] overflow-y-auto' : 'line-clamp-2'}`}>{description}</p>
            {description.length > 105 && <button type="button" onClick={() => setDescriptionExpanded((expanded) => !expanded)} className="mt-1 text-[11px] font-extrabold text-white underline decoration-white/50 underline-offset-2">{descriptionExpanded ? 'Show Less' : 'More'}</button>}
          </div>
          {clip.title && <a href={`/title/${clip.title.id}`} className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur-md"><Clapperboard className="h-3 w-3 shrink-0" /><span className="truncate">Related To {clip.title.title}</span></a>}
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/75"><Eye className="h-3.5 w-3.5" /> {(clip.views_count ?? 0).toLocaleString()} Views</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a href={clip.title ? "/title/" + clip.title.id : "/search?q=" + encodeURIComponent(clip.headline)} aria-label={clip.title ? "Watch " + clip.title.title + " Now" : "Watch Now — Explore Titles Related To " + clip.headline} className="cinema-short-watch-now inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-black text-white shadow-[0_8px_28px_rgba(0,0,0,.38)] backdrop-blur-2xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">Watch Now <ArrowUpRight className="h-4 w-4" /></a>
            <button type="button" onClick={() => onTrack(clip)} disabled={tracking} aria-pressed={tracked} className="cinema-short-track inline-flex min-h-11 items-center justify-center rounded-full border border-white/35 bg-black/40 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg backdrop-blur-xl transition hover:bg-white/10 disabled:opacity-50">{tracking ? '…' : tracked ? 'Tracking' : 'Track'}</button>
          </div>
        </div>
        <div className="cinema-short-action-rail cinema-short-actions pointer-events-auto absolute right-3 top-1/2 z-30 flex -translate-y-1/2 shrink-0 flex-col items-center gap-2 sm:right-5">
          <button type="button" onClick={toggleAudio} aria-label={audioEnabled ? "Mute This Short" : "Turn Sound On"} className="cinema-short-action flex flex-col items-center justify-center gap-0.5 text-white"><span>{audioEnabled ? <Volume2 className="h-7 w-7" /> : <VolumeX className="h-7 w-7" />}</span><span className="text-[9px] font-bold">Sound</span></button>
          <button type="button" onClick={() => void handleLike()} disabled={savingReaction || engagementLoading} aria-label={likedByUser ? "Unlike This Short" : "Like This Short"} aria-pressed={likedByUser} className="cinema-short-action flex flex-col items-center justify-center gap-0.5 text-white disabled:opacity-50"><Heart className={"h-8 w-8 drop-shadow-lg " + (likedByUser ? "fill-[#ff315d] text-[#ff315d]" : "text-white")} /><span className="text-[9px] font-bold tabular-nums">{reactionCount.toLocaleString()}</span></button>
          <button type="button" onClick={() => setCommentOpen((open) => !open)} aria-label="Open Comments" aria-expanded={commentOpen} className="cinema-short-action flex flex-col items-center justify-center gap-0.5 text-white"><MessageCircle className="h-8 w-8 drop-shadow-lg" /><span className="text-[9px] font-bold tabular-nums">{comments.length.toLocaleString()}</span></button>
          <button type="button" onClick={() => onSave(clip)} disabled={saving} aria-label={saved ? "Remove From Saved Shorts" : "Save This Short"} aria-pressed={saved} className="cinema-short-action flex flex-col items-center justify-center gap-0.5 text-white disabled:opacity-50">{saved ? <BookmarkCheck className="h-8 w-8 text-sky-200" /> : <BookmarkPlus className="h-8 w-8" />}<span className="text-[9px] font-bold">{saved ? "Saved" : "Save"}</span></button>
          <button type="button" onClick={shareShort} aria-label="Share This Short" className="cinema-short-action flex flex-col items-center justify-center gap-0.5 text-white"><Share2 className="h-8 w-8 drop-shadow-lg" /><span className="text-[9px] font-bold">Share</span></button>
          {clip.download_allowed && isDirectVideoUrl(clip.video_url) && !isHlsUrl(clip.video_url) && <button type="button" onClick={() => onDownload(clip)} disabled={downloadingClipId === clip.id} aria-label="Download Approved Video" className="cinema-short-action grid place-items-center text-white disabled:opacity-50"><Download className="h-7 w-7" /><span className="text-[9px] font-bold">Download</span></button>}
        </div>
      </div>
      {commentOpen && <section aria-label="Short Comments" className="absolute inset-x-3 bottom-3 z-50 max-h-[52dvh] overflow-hidden rounded-2xl border border-white/20 bg-black/75 p-4 shadow-2xl backdrop-blur-2xl sm:inset-x-6">
        <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="text-sm font-extrabold text-white">Comments</h3><p className="text-[11px] text-white/60">{comments.length} Comments</p></div><button type="button" onClick={() => setCommentOpen(false)} className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white">Close</button></div>
        <div className="max-h-[25dvh] space-y-3 overflow-y-auto pr-1">{comments.length ? comments.map((comment) => <article key={comment.id} className="border-b border-white/10 pb-2"><p className="text-xs font-bold text-sky-100">{comment.author_name}</p><p className="mt-1 break-words text-xs leading-5 text-white/85">{comment.body}</p></article>) : <p className="py-4 text-center text-xs text-white/60">No Comments Yet. Start The Conversation.</p>}</div>
        <form onSubmit={(event) => void submitComment(event)} className="mt-3 flex items-center gap-2"><input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} placeholder={userId ? 'Write A Comment…' : 'Sign In To Comment'} aria-label="Your Comment" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[.06] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/45 focus:border-white/35" /><button type="submit" disabled={!commentText.trim() || savingComment} className="rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-black disabled:opacity-50">{savingComment ? "Posting…" : "Post"}</button></form>
      </section>}
    </article>
  );
}

export function ShortsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const feedRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackedPublishers, setTrackedPublishers] = useState<string[]>([]);
  const [trackingPublisher, setTrackingPublisher] = useState<string | null>(null);
  const [signals, setSignals] = useState<ViewerSignals>(EMPTY_SIGNALS);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [savedClipIds, setSavedClipIds] = useState<string[]>([]);
  const [savingClipId, setSavingClipId] = useState<string | null>(null);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
  const requestedClipId = useMemo(() => new URLSearchParams(window.location.search).get('clip'), []);
  const { data: clips, error, loading, reload } = useAsyncData(fetchPublishedShorts, []);
  const { data: sourcePendingShorts } = useAsyncData(fetchPublishedShortsAwaitingNativeSource, []);
  const pendingSourceShorts = sourcePendingShorts ?? [];
  const { data: followedPublishers, reload: reloadTrackedPublishers } = useAsyncData(() => user ? fetchFollowedPublishers(user.id) : Promise.resolve([]), [user?.id]);
  useEffect(() => { setTrackedPublishers(followedPublishers ?? []); }, [followedPublishers]);

  useEffect(() => { setSignals(readSignals(user?.id)); }, [user?.id]);
  useEffect(() => {
    let active = true;
    if (!user) { setSavedClipIds([]); return; }
    fetchSavedDiscoverClipIds(user.id).then((ids) => { if (active) setSavedClipIds(ids); })
      .catch((cause) => console.warn('Saved Cinema Shorts Could Not Be Loaded', cause));
    return () => { active = false; };
  }, [user?.id]);
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousRootOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    return () => { document.body.style.overflow = previousBodyOverflow; document.documentElement.style.overflow = previousRootOverflow; document.body.style.overscrollBehavior = previousBodyOverscroll; document.documentElement.style.overscrollBehavior = previousRootOverscroll; };
  }, []);
  const shorts = useMemo(() => {
    const ranked = rankPublishedShorts((clips ?? []).filter(isPlayableShort), followedPublishers ?? [], 200);
    const affinity = signals.publisherAffinity;
    const seen = new Set<string>();
    const remaining = ranked.filter((clip) => {
      if (seen.has(clip.id)) return false;
      seen.add(clip.id);
      return true;
    }).map((clip, index) => ({ clip, index }));
    const selected: DiscoverClip[] = [];
    const publisherCounts = new Map<string, number>();

    // Personal relevance is blended with freshness, followed publishers and
    // editorial ordering. A soft first-six creator cap prevents one publisher
    // from taking over the opening run, but relaxes automatically for small feeds.
    while (remaining.length) {
      let bestIndex = -1;
      let bestScore = Number.NEGATIVE_INFINITY;
      remaining.forEach((entry, index) => {
        const publisher = entry.clip.publisher_name.trim().toLocaleLowerCase();
        const count = publisherCounts.get(publisher) ?? 0;
        const openingDiversityCap = selected.length < 6 && count >= 2;
        const alternatives = remaining.some((candidate) => candidate.clip.publisher_name.trim().toLocaleLowerCase() !== publisher);
        if (openingDiversityCap && alternatives) return;
        const diversity = count === 0 ? 0.55 : count === 1 ? 0.08 : -1.4 * count;
        const personal = (affinity[publisher] ?? 0) * 0.28
          + (signals.likedIds.includes(entry.clip.id) ? 0.5 : 0)
          + (entry.clip.title_id ? (signals.titleAffinity[entry.clip.title_id] ?? 0) * 0.32 : 0)
          - (signals.completedIds.includes(entry.clip.id) ? 1.1 : 0);
        const baseOrder = (ranked.length - entry.index) / Math.max(1, ranked.length) * 0.3;
        const score = diversity + personal + baseOrder;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      // If the feed only has one publisher, relax diversity instead of hiding
      // the remaining approved Shorts.
      if (bestIndex < 0) bestIndex = 0;
      const [chosen] = remaining.splice(bestIndex, 1);
      selected.push(chosen.clip);
      const publisher = chosen.clip.publisher_name.trim().toLocaleLowerCase();
      publisherCounts.set(publisher, (publisherCounts.get(publisher) ?? 0) + 1);
    }
    return selected;
  }, [clips, followedPublishers, signals]);
  const visibleShorts = shorts;

  useEffect(() => {
    if (!requestedClipId || !visibleShorts.length) return;
    const index = visibleShorts.findIndex((clip) => clip.id === requestedClipId);
    if (index < 0) return;
    setActiveIndex(index);
    window.requestAnimationFrame(() => feedRef.current?.querySelector<HTMLElement>('[data-short-index="' + index + '"]')?.scrollIntoView({ block: 'start' }));
  }, [visibleShorts, requestedClipId]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root || !visibleShorts.length) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.62) {
          const index = Number((entry.target as HTMLElement).dataset.shortIndex);
          if (Number.isInteger(index)) setActiveIndex(index);
        }
      }
    }, { root, threshold: [0.35, 0.62, 0.82], rootMargin: '-3% 0px -3% 0px' });
    root.querySelectorAll<HTMLElement>('[data-short-index]').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [visibleShorts]);

  function completeClip(clip: DiscoverClip) {
    setSignals((current) => {
      if (current.completedIds.includes(clip.id)) return current;
      const publisher = clip.publisher_name.trim().toLocaleLowerCase();
      const next: ViewerSignals = {
        ...current,
        completedIds: [...current.completedIds, clip.id].slice(-300),
        publisherAffinity: { ...current.publisherAffinity, [publisher]: boundAffinity((current.publisherAffinity[publisher] ?? 0) + 1) },
        titleAffinity: clip.title_id ? { ...current.titleAffinity, [clip.title_id]: boundAffinity((current.titleAffinity[clip.title_id] ?? 0) + 0.75) } : current.titleAffinity,
      };
      saveSignals(next, user?.id);
      return next;
    });
  }

  const syncServerLikeSignal = useCallback((clip: DiscoverClip, liked: boolean) => {
    setSignals((current) => {
      const alreadyLiked = current.likedIds.includes(clip.id);
      if (alreadyLiked === liked) return current;
      const publisher = clip.publisher_name.trim().toLocaleLowerCase();
      const next: ViewerSignals = {
        ...current,
        likedIds: liked ? [...current.likedIds, clip.id].slice(-300) : current.likedIds.filter((id) => id !== clip.id),
        publisherAffinity: { ...current.publisherAffinity, [publisher]: boundAffinity((current.publisherAffinity[publisher] ?? 0) + (liked ? 1.2 : -0.8)) },
        titleAffinity: clip.title_id ? { ...current.titleAffinity, [clip.title_id]: boundAffinity((current.titleAffinity[clip.title_id] ?? 0) + (liked ? 1 : -0.6)) } : current.titleAffinity,
      };
      saveSignals(next, user?.id);
      return next;
    });
  }, [user?.id]);

  async function toggleTrack(clip: DiscoverClip) {
    if (!user) { notify('Sign In To Track Creators And Publishers.'); navigateTo('/sign-in'); return; }
    if (trackingPublisher) return;
    const name = clip.publisher_name.trim();
    if (!name) return;
    const wasTracked = trackedPublishers.some((item) => item.toLowerCase() === name.toLowerCase());
    setTrackingPublisher(name);
    setTrackedPublishers((current) => wasTracked ? current.filter((item) => item.toLowerCase() !== name.toLowerCase()) : [...current, name]);
    try {
      if (wasTracked) await unfollowPublisher(user.id, name); else await followPublisher(user.id, name);
      await reloadTrackedPublishers();
      notify(wasTracked ? `No Longer Tracking ${name}.` : `Now Tracking ${name}.`);
    } catch (cause) {
      setTrackedPublishers((current) => wasTracked ? [...current, name] : current.filter((item) => item.toLowerCase() !== name.toLowerCase()));
      console.error('Cinema Track Setting Could Not Be Updated', cause);
      notify('Your Track Setting Could Not Be Updated. Please Try Again.', 'error');
    } finally { setTrackingPublisher(null); }
  }

  async function toggleSave(clip: DiscoverClip) {
    if (!user) { notify('Sign In To Save Shorts To My Cinema.'); navigateTo('/sign-in'); return; }
    if (savingClipId) return;
    const wasSaved = savedClipIds.includes(clip.id);
    setSavingClipId(clip.id);
    setSavedClipIds((current) => wasSaved ? current.filter((id) => id !== clip.id) : [...current, clip.id]);
    try { await setDiscoverClipSaved(clip.id, user.id, !wasSaved); }
    catch (cause) {
      setSavedClipIds((current) => wasSaved ? [...current, clip.id] : current.filter((id) => id !== clip.id));
      console.error('Cinema Short Could Not Be Saved', cause);
      notify('This Short Could Not Be Saved. Please Try Again.', 'error');
    } finally { setSavingClipId(null); }
  }

  async function downloadClip(clip: DiscoverClip) {
    if (!clip.download_allowed || !isDirectVideoUrl(clip.video_url) || isHlsUrl(clip.video_url) || downloadingClipId) return;
    setDownloadingClipId(clip.id);
    try {
      await downloadPermittedClip(clip);
      notify('Your approved download has started.');
    } catch (cause) {
      console.error('Cinema Short Download Could Not Start', cause);
      notify('This approved video could not be downloaded from its host. Please try again later.', 'error');
    } finally {
      setDownloadingClipId(null);
    }
  }

  async function toggleLike(clip: DiscoverClip, wasLiked: boolean): Promise<void> {
    if (!user) throw new Error('Sign in required to react.');
    try {
      await toggleDiscoverContentLike(`clip:${clip.id}`, user.id, wasLiked);
    } catch (cause) {
      console.error('Cinema Short Reaction Could Not Be Saved', cause);
      notify('Your Reaction Could Not Be Saved. Please Try Again.', 'error');
      throw cause;
    }
    setSignals((current) => {
      const publisher = clip.publisher_name.trim().toLocaleLowerCase();
      const next: ViewerSignals = {
        ...current,
        likedIds: wasLiked ? current.likedIds.filter((id) => id !== clip.id) : [...current.likedIds, clip.id].slice(-300),
        publisherAffinity: { ...current.publisherAffinity, [publisher]: boundAffinity((current.publisherAffinity[publisher] ?? 0) + (wasLiked ? -0.8 : 1.2)) },
        titleAffinity: clip.title_id ? { ...current.titleAffinity, [clip.title_id]: boundAffinity((current.titleAffinity[clip.title_id] ?? 0) + (wasLiked ? -0.6 : 1.0)) } : current.titleAffinity,
      };
      saveSignals(next, user?.id);
      return next;
    });
  }

  return (
    <main className="cinema-shorts-page fixed inset-0 z-[100] h-[100dvh] w-screen max-w-none overflow-hidden bg-[#030508]">
      <header className="absolute inset-x-0 top-0 z-40 flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),.8rem)] sm:px-6">
        <a href="/" aria-label="Back To Cinema Home" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md"><ArrowLeft className="h-4 w-4" /></a>
        <div className="min-w-0 flex-1" aria-hidden="true" />
        <a href="/search" aria-label="Search Cinema" className="grid h-9 w-9 shrink-0 place-items-center text-white"><Search className="h-6 w-6" /></a>
      </header>
      {loading && !clips && <div className="absolute inset-0 grid place-items-center px-5 pt-16"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/65 p-6 backdrop-blur-xl"><LoadingState label="Loading Cinema Shorts" /></div></div>}
      {error && !clips && <div className="absolute inset-0 grid place-items-center px-5 pt-16"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/65 p-6 backdrop-blur-xl"><ErrorState onRetry={reload} description="Cinema Shorts Could Not Load. Try Again In A Moment." /></div></div>}
      {clips && followedPublishers !== undefined && visibleShorts.length === 0 && <section className="cinema-category-live-hero absolute inset-0 grid min-h-0 place-items-center overflow-hidden p-6 pt-20 text-center"><div className="relative z-10 max-w-md"><Clapperboard className="mx-auto h-10 w-10 text-sky-200" /><h2 className="mt-4 text-2xl font-black text-white">{pendingSourceShorts.length ? 'Your Short Is Still Here' : 'Cinema Shorts Are Getting Ready'}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{pendingSourceShorts.length ? 'This published Short needs its original video file before it can join the native Cinema feed.' : 'Approved, playable Shorts from Cinema creators and publishers will appear here. No broken placeholders or unrelated long-form videos.'}</p>{pendingSourceShorts.length > 0 && <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4 text-left"><p className="text-sm font-bold text-white">{pendingSourceShorts[0].headline}</p><p className="text-xs text-slate-400">{pendingSourceShorts[0].publisher_name} · Published Short</p><p className="text-xs leading-5 text-slate-400">{pendingSourceShorts[0].description}</p><a href={pendingSourceShorts[0].video_url} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-white/20 px-3 py-2 text-xs font-bold text-white">Watch Original Source</a></div>}<div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-bold text-white"><RefreshCw className="h-3.5 w-3.5" /> Refresh Feed</button><a href="/creator/shorts" className="rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white">Upload Original Video</a></div></div></section>}
      {visibleShorts.length > 0 && (
        <div ref={feedRef} className="cinema-shorts-feed h-full w-full overflow-y-auto snap-y snap-mandatory" aria-label="Scroll Cinema Shorts vertically">
          {visibleShorts.map((clip, index) => (
            <div key={clip.id} data-short-index={index} className="cinema-shorts-feed__slot h-[100dvh] min-h-[100dvh] w-full snap-start snap-always">
              <ShortFeedItem clip={clip} active={index === activeIndex} saved={savedClipIds.includes(clip.id)} saving={savingClipId === clip.id} audioEnabled={audioEnabled} onLike={toggleLike} onEngagementLoaded={syncServerLikeSignal} onSave={toggleSave} onCompleted={completeClip} onAudioChange={setAudioEnabled} onDownload={downloadClip} downloadingClipId={downloadingClipId} userId={user?.id} onSignIn={() => { notify('Sign In To React Or Comment On Shorts.'); navigateTo('/sign-in'); }} onTrack={toggleTrack} tracked={trackedPublishers.some((name) => name.toLowerCase() === clip.publisher_name.trim().toLowerCase())} tracking={trackingPublisher?.toLowerCase() === clip.publisher_name.trim().toLowerCase()} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
