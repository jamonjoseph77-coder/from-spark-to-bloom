import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookmarkCheck, BookmarkPlus, Clapperboard, Download, Eye, Heart, MessageCircle, RefreshCw, Search, Share2, Volume2, VolumeX } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { navigateTo } from '@/lib/router';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { downloadPermittedClip, fetchPublishedShorts, fetchSavedDiscoverClipIds, setDiscoverClipSaved, isPlayableShort, rankPublishedShorts, type DiscoverClip } from '@/lib/clips';
import { getYouTubeVideoId, isDirectVideoUrl, isHlsUrl, toEmbedUrl } from '@/lib/media';
import { fetchDiscoverContentEngagement } from '@/lib/discoverEngagement';
import { publisherHref } from '@/lib/publishers';

type ViewerSignals = { completedIds: string[]; likedIds: string[]; publisherAffinity: Record<string, number> };
const SIGNALS_KEY = 'cinema:shorts-viewer-signals:v1';
const EMPTY_SIGNALS: ViewerSignals = { completedIds: [], likedIds: [], publisherAffinity: {} };

function readSignals(): ViewerSignals {
  try {
    const raw = window.localStorage.getItem(SIGNALS_KEY);
    if (!raw) return EMPTY_SIGNALS;
    const parsed = JSON.parse(raw) as Partial<ViewerSignals>;
    return {
      completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
      likedIds: Array.isArray(parsed.likedIds) ? parsed.likedIds : [],
      publisherAffinity: parsed.publisherAffinity && typeof parsed.publisherAffinity === 'object' ? parsed.publisherAffinity : {},
    };
  } catch { return EMPTY_SIGNALS; }
}
function saveSignals(signals: ViewerSignals) {
  try { window.localStorage.setItem(SIGNALS_KEY, JSON.stringify(signals)); } catch { /* Local personalization is optional. */ }
}

function ShortFeedItem({ clip, active, liked, saved, saving, audioEnabled, onLike, onSave, onCompleted, onAudioChange, onDownload, downloadingClipId, onOpenComments }: {
  clip: DiscoverClip; active: boolean; liked: boolean; saved: boolean; saving: boolean; audioEnabled: boolean;
  onLike: (clip: DiscoverClip) => void; onSave: (clip: DiscoverClip) => void; onCompleted: (clip: DiscoverClip) => void; onAudioChange: (enabled: boolean) => void;
  onDownload: (clip: DiscoverClip) => void; downloadingClipId: string | null; onOpenComments: (clip: DiscoverClip) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [reactionCount, setReactionCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const rawEmbed = !isDirectVideoUrl(clip.video_url) && active ? toEmbedUrl(clip.video_url, { autoplay: true, muted: !audioEnabled }) : null;
  const embed = rawEmbed ? (getYouTubeVideoId(clip.video_url) ? rawEmbed + "&enablejsapi=1&origin=" + encodeURIComponent(window.location.origin) : rawEmbed + "&api=1&player_id=cinema-short-" + clip.id) : null;

  useEffect(() => {
    if (!active) return;
    let current = true;
    fetchDiscoverContentEngagement("clip:" + clip.id).then((value) => {
      if (current) { setReactionCount(value.reactionCount); setCommentCount(value.comments.length); }
    }).catch((error) => console.warn("Cinema Short Engagement Could Not Load", error));
    return () => { current = false; };
  }, [active, clip.id]);

  function sendEmbeddedAudio(enabled: boolean) {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    if (getYouTubeVideoId(clip.video_url)) {
      frame.postMessage(JSON.stringify({ event: "command", func: enabled ? "unMute" : "mute", args: [] }), "https://www.youtube.com");
      if (enabled) frame.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "https://www.youtube.com");
    } else if (/vimeo\.com/i.test(clip.video_url)) {
      frame.postMessage(JSON.stringify({ method: "setVolume", value: enabled ? 1 : 0 }), "https://player.vimeo.com");
      if (enabled) frame.postMessage(JSON.stringify({ method: "play" }), "https://player.vimeo.com");
    }
  }
  function toggleAudio() {
    const next = !audioEnabled;
    onAudioChange(next);
    sendEmbeddedAudio(next);
    window.setTimeout(() => sendEmbeddedAudio(next), 120);
    window.setTimeout(() => sendEmbeddedAudio(next), 420);
  }
  function shareShort() {
    const url = window.location.origin + "/shorts?clip=" + encodeURIComponent(clip.id);
    if (navigator.share) void navigator.share({ title: clip.headline, text: clip.description, url }).catch(() => undefined);
    else if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(url);
  }
  return (
    <article className="relative isolate h-full min-h-0 w-full snap-start overflow-hidden border-0 bg-[#030508] shadow-none">
      <div className="absolute inset-0 bg-[#030508]">
        {active && isDirectVideoUrl(clip.video_url) ? (
          <VideoPlayer key={clip.id} src={clip.video_url} title={clip.headline} poster={clip.poster_url || undefined} layout="portrait" autoPlay muted={!audioEnabled} showControls showMuteToggle onMutedChange={(muted) => onAudioChange(!muted)} onProgress={(progress) => { if (progress.completed) onCompleted(clip); }} />
        ) : active && embed ? (
          <iframe ref={iframeRef} src={embed} title={clip.headline} onLoad={() => { sendEmbeddedAudio(audioEnabled); window.setTimeout(() => sendEmbeddedAudio(audioEnabled), 180); window.setTimeout(() => sendEmbeddedAudio(audioEnabled), 650); }} className="h-full w-full border-0 bg-black" loading="eager" allow="autoplay; accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover opacity-80" />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end gap-3 p-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1 pr-2">
          <a href={publisherHref(clip.publisher_name || "Cinema")} className="inline-flex max-w-full items-center gap-2 text-xs font-bold text-white/90">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/30 bg-black/55 text-xs font-black">{(clip.publisher_name || "C").slice(0, 1).toUpperCase()}</span>
            <span className="truncate">{clip.publisher_name || "Cinema Creator"}</span>
            <span className="rounded-full bg-[#ff315d] px-2 py-1 text-[9px] font-extrabold text-white">+</span>
          </a>
          <h2 className="mt-3 line-clamp-2 text-lg font-black leading-tight text-white drop-shadow-lg sm:text-xl">{clip.headline}</h2>
          {clip.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/75">{clip.description}</p>}
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/75"><Eye className="h-3.5 w-3.5" /> {(clip.views_count ?? 0).toLocaleString()} Views</p>
          {clip.title && <a href={"/title/" + clip.title.id} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg">Watch Now <ArrowUpRight className="h-3.5 w-3.5" /></a>}
        </div>
        <div className="mb-1 flex shrink-0 flex-col items-center gap-3">
          {!isDirectVideoUrl(clip.video_url) && <button type="button" onClick={toggleAudio} aria-label={audioEnabled ? "Mute This Short" : "Turn Sound On"} className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-xl">{audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>}
          <button type="button" onClick={() => onLike(clip)} aria-label={liked ? "Unlike This Short" : "Like This Short"} aria-pressed={liked} className="flex flex-col items-center gap-1 text-white"><Heart className={"h-8 w-8 drop-shadow-lg " + (liked ? "fill-[#ff315d] text-[#ff315d]" : "text-white")} /><span className="text-[11px] font-bold tabular-nums">{(reactionCount + (liked ? 1 : 0)).toLocaleString()}</span></button>
          <button type="button" onClick={() => onOpenComments(clip)} aria-label="Open Comments" className="flex flex-col items-center gap-1 text-white"><MessageCircle className="h-8 w-8 drop-shadow-lg" /><span className="text-[11px] font-bold tabular-nums">{commentCount.toLocaleString()}</span></button>
          <button type="button" onClick={() => onSave(clip)} disabled={saving} aria-label={saved ? "Remove From Saved Shorts" : "Save This Short"} aria-pressed={saved} className="flex flex-col items-center gap-1 text-white disabled:opacity-50">{saved ? <BookmarkCheck className="h-8 w-8 text-sky-200" /> : <BookmarkPlus className="h-8 w-8" />}<span className="text-[11px] font-bold">{saved ? "Saved" : "Save"}</span></button>
          <button type="button" onClick={shareShort} aria-label="Share This Short" className="flex flex-col items-center gap-1 text-white"><Share2 className="h-8 w-8 drop-shadow-lg" /><span className="text-[11px] font-bold">Share</span></button>
          {clip.download_allowed && isDirectVideoUrl(clip.video_url) && !isHlsUrl(clip.video_url) && <button type="button" onClick={() => onDownload(clip)} disabled={downloadingClipId === clip.id} aria-label="Download Approved Video" className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white disabled:opacity-50"><Download className="h-5 w-5" /></button>}
        </div>
      </div>
    </article>
  );
}

export function ShortsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const feedRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedMode, setFeedMode] = useState<'for-you' | 'following'>('for-you');
  const [signals, setSignals] = useState<ViewerSignals>(EMPTY_SIGNALS);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [savedClipIds, setSavedClipIds] = useState<string[]>([]);
  const [savingClipId, setSavingClipId] = useState<string | null>(null);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
  const requestedClipId = useMemo(() => new URLSearchParams(window.location.search).get('clip'), []);
  const { data: clips, error, loading, reload } = useAsyncData(fetchPublishedShorts, []);
  const { data: followedPublishers } = useAsyncData(() => user ? fetchFollowedPublishers(user.id) : Promise.resolve([]), [user?.id]);

  useEffect(() => { setSignals(readSignals()); }, []);
  useEffect(() => {
    let active = true;
    if (!user) { setSavedClipIds([]); return; }
    fetchSavedDiscoverClipIds(user.id).then((ids) => { if (active) setSavedClipIds(ids); })
      .catch((cause) => console.warn('Saved Cinema Shorts Could Not Be Loaded', cause));
    return () => { active = false; };
  }, [user?.id]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  const shorts = useMemo(() => {
    const ranked = rankPublishedShorts((clips ?? []).filter(isPlayableShort), followedPublishers ?? [], 200);
    const affinity = signals.publisherAffinity;
    const remaining = ranked.map((clip, index) => ({ clip, index }));
    const selected: DiscoverClip[] = [];
    const publisherCounts = new Map<string, number>();

    // Blend local likes and completion signals into the existing freshness,
    // follow, popularity and editorial ranking without sacrificing publisher variety.
    while (remaining.length) {
      let bestIndex = 0;
      let bestScore = Number.NEGATIVE_INFINITY;
      remaining.forEach((entry, index) => {
        const publisher = entry.clip.publisher_name.trim().toLocaleLowerCase();
        const count = publisherCounts.get(publisher) ?? 0;
        const diversity = count === 0 ? 0.42 : count === 1 ? 0 : -1.15 * count;
        const personal = (affinity[publisher] ?? 0) * 0.28
          + (signals.likedIds.includes(entry.clip.id) ? 0.5 : 0)
          - (signals.completedIds.includes(entry.clip.id) ? 0.85 : 0);
        const baseOrder = (ranked.length - entry.index) / Math.max(1, ranked.length) * 0.3;
        const score = diversity + personal + baseOrder;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      const [chosen] = remaining.splice(bestIndex, 1);
      selected.push(chosen.clip);
      const publisher = chosen.clip.publisher_name.trim().toLocaleLowerCase();
      publisherCounts.set(publisher, (publisherCounts.get(publisher) ?? 0) + 1);
    }
    return selected;
  }, [clips, followedPublishers, signals]);
  const visibleShorts = useMemo(() => feedMode === 'following'
    ? shorts.filter((clip) => (followedPublishers ?? []).some((name) => name.trim().toLowerCase() === clip.publisher_name.trim().toLowerCase()))
    : shorts, [shorts, feedMode, followedPublishers]);

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
        publisherAffinity: { ...current.publisherAffinity, [publisher]: (current.publisherAffinity[publisher] ?? 0) + 1 },
      };
      saveSignals(next);
      return next;
    });
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

  function toggleLike(clip: DiscoverClip) {
    setSignals((current) => {
      const liked = current.likedIds.includes(clip.id);
      const publisher = clip.publisher_name.trim().toLocaleLowerCase();
      const next: ViewerSignals = {
        ...current,
        likedIds: liked ? current.likedIds.filter((id) => id !== clip.id) : [...current.likedIds, clip.id].slice(-300),
        publisherAffinity: { ...current.publisherAffinity, [publisher]: (current.publisherAffinity[publisher] ?? 0) + (liked ? -0.8 : 1.2) },
      };
      saveSignals(next);
      return next;
    });
  }

  return (
    <main className="cinema-shorts-page fixed inset-0 z-[100] h-[100dvh] w-screen max-w-none overflow-hidden bg-[#030508]">
      <header className="absolute inset-x-0 top-0 z-40 flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),.8rem)] sm:px-6">
        <a href="/" aria-label="Back To Cinema Home" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md"><ArrowLeft className="h-4 w-4" /></a>
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-4 text-[13px] font-bold sm:gap-7 sm:text-base" aria-label="Shorts Feed">
          <button type="button" onClick={() => setFeedMode('following')} aria-pressed={feedMode === 'following'} className={feedMode === 'following' ? 'relative py-2 text-white after:absolute after:inset-x-0 after:-bottom-1 after:mx-auto after:h-[3px] after:w-8 after:rounded-full after:bg-white' : 'py-2 text-white/75'}>Following</button>
          <a href="/friends" className="whitespace-nowrap text-white/75">Friends</a>
          <button type="button" onClick={() => setFeedMode('for-you')} aria-pressed={feedMode === 'for-you'} className={feedMode === 'for-you' ? 'relative py-2 text-white after:absolute after:inset-x-0 after:-bottom-1 after:mx-auto after:h-[3px] after:w-8 after:rounded-full after:bg-white' : 'py-2 text-white/75'}>For You</button>
        </nav>
        <a href="/search" aria-label="Search Cinema" className="grid h-9 w-9 shrink-0 place-items-center text-white"><Search className="h-6 w-6" /></a>
      </header>
      {loading && !clips && <div className="absolute inset-0 grid place-items-center px-5 pt-16"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/65 p-6 backdrop-blur-xl"><LoadingState label="Loading Cinema Shorts" /></div></div>}
      {error && !clips && <div className="absolute inset-0 grid place-items-center px-5 pt-16"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/65 p-6 backdrop-blur-xl"><ErrorState onRetry={reload} description="Cinema Shorts Could Not Load. Try Again In A Moment." /></div></div>}
      {clips && visibleShorts.length === 0 && <section className="cinema-category-live-hero absolute inset-0 grid min-h-0 place-items-center overflow-hidden p-8 pt-20 text-center"><div className="relative z-10 max-w-md"><Clapperboard className="mx-auto h-10 w-10 text-sky-200" /><h2 className="mt-4 text-2xl font-black text-white">The Shorts Feed Is Getting Ready</h2><p className="mt-2 text-sm leading-6 text-slate-300">Approved, playable Shorts from Cinema creators and publishers will appear here. No broken placeholders or unrelated long-form videos.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-bold text-white"><RefreshCw className="h-3.5 w-3.5" /> Refresh Feed</button><a href="/creator/shorts" className="rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white">Submit A Short</a></div></div></section>}
      {visibleShorts.length > 0 && (
        <div ref={feedRef} className="cinema-shorts-feed h-full w-full overflow-y-auto snap-y snap-mandatory" aria-label="Scroll Cinema Shorts vertically">
          {visibleShorts.map((clip, index) => (
            <div key={clip.id} data-short-index={index} className="cinema-shorts-feed__slot h-[100dvh] min-h-[100dvh] w-full snap-start snap-always">
              <ShortFeedItem clip={clip} active={index === activeIndex} liked={signals.likedIds.includes(clip.id)} saved={savedClipIds.includes(clip.id)} saving={savingClipId === clip.id} audioEnabled={audioEnabled} onLike={toggleLike} onSave={toggleSave} onCompleted={completeClip} onAudioChange={setAudioEnabled} onDownload={downloadClip} downloadingClipId={downloadingClipId} onOpenComments={(item) => navigateTo('/discover#short-' + item.id)} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
