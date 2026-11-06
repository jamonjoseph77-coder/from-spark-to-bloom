import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookmarkCheck, BookmarkPlus, ChevronDown, Clapperboard, Heart, RefreshCw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Artwork } from '@/components/ui/Artwork';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { navigateTo } from '@/lib/router';
import { fetchFollowedPublishers } from '@/lib/publisherFollows';
import { fetchPublishedShorts, fetchSavedDiscoverClipIds, setDiscoverClipSaved, isPlayableShort, rankPublishedShorts, type DiscoverClip } from '@/lib/clips';
import { getYouTubeVideoId, isDirectVideoUrl, toEmbedUrl } from '@/lib/media';

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

function ShortFeedItem({ clip, active, liked, saved, saving, audioEnabled, onLike, onSave, onCompleted, onAudioChange }: {
  clip: DiscoverClip; active: boolean; liked: boolean; saved: boolean; saving: boolean; audioEnabled: boolean;
  onLike: (clip: DiscoverClip) => void; onSave: (clip: DiscoverClip) => void; onCompleted: (clip: DiscoverClip) => void; onAudioChange: (enabled: boolean) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rawEmbed = !isDirectVideoUrl(clip.video_url) && active ? toEmbedUrl(clip.video_url, { autoplay: true, muted: !audioEnabled }) : null;
  const embed = rawEmbed ? (getYouTubeVideoId(clip.video_url) ? rawEmbed + '&enablejsapi=1&origin=' + encodeURIComponent(window.location.origin) : rawEmbed + '&api=1&player_id=cinema-short-' + clip.id) : null;
  function sendEmbeddedAudio(enabled: boolean) {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    if (getYouTubeVideoId(clip.video_url)) {
      frame.postMessage(JSON.stringify({ event: 'command', func: enabled ? 'unMute' : 'mute', args: [] }), 'https://www.youtube.com');
      if (enabled) frame.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), 'https://www.youtube.com');
    } else if (/vimeo\.com/i.test(clip.video_url)) {
      frame.postMessage(JSON.stringify({ method: 'setVolume', value: enabled ? 1 : 0 }), 'https://player.vimeo.com');
      if (enabled) frame.postMessage(JSON.stringify({ method: 'play' }), 'https://player.vimeo.com');
    }
  }

  function toggleAudio() {
    const next = !audioEnabled;
    onAudioChange(next);
    // Some embeds finish initialising just after the iframe load event.
    // Retry briefly so the user's sound tap is not lost during player startup.
    sendEmbeddedAudio(next);
    window.setTimeout(() => sendEmbeddedAudio(next), 120);
    window.setTimeout(() => sendEmbeddedAudio(next), 420);
  }
  return (
    <article className="relative isolate h-full min-h-0 w-full snap-start overflow-hidden border-0 bg-[#030508] shadow-none">
      <div className="absolute inset-0 bg-[#030508]">
        {active && isDirectVideoUrl(clip.video_url) ? (
          <VideoPlayer key={clip.id} src={clip.video_url} title={clip.headline} poster={clip.poster_url || undefined} layout="portrait" autoPlay muted={!audioEnabled} showControls showMuteToggle onMutedChange={(muted) => onAudioChange(!muted)} onProgress={(progress) => { if (progress.completed) onCompleted(clip); }} />
        ) : active && embed ? (
          <iframe ref={iframeRef} src={embed} title={clip.headline} onLoad={() => { sendEmbeddedAudio(audioEnabled); window.setTimeout(() => sendEmbeddedAudio(audioEnabled), 180); window.setTimeout(() => sendEmbeddedAudio(audioEnabled), 650); }} className="h-full w-full bg-black" loading="eager" allow="autoplay; accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <Artwork src={clip.poster_url} alt="" fallbackTitle={clip.headline} className="h-full w-full object-cover opacity-80" />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end gap-3 p-5 pb-7">
        <div className="min-w-0 flex-1">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sky-200/20 bg-[#06152a]/70 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-sky-100 backdrop-blur"><Sparkles className="h-3 w-3" /> Cinema Shorts</p>
          <h2 className="line-clamp-3 text-xl font-black leading-tight text-white drop-shadow-lg">{clip.headline}</h2>
          <p className="mt-2 text-xs font-bold text-sky-100">{clip.publisher_name || 'Cinema Creator'}</p>
          {clip.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-200/85">{clip.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {clip.title && <a href={`/title/${clip.title.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_28px_rgba(8,124,255,.3)] transition hover:bg-[#168cff]">Watch Now <ArrowUpRight className="h-3.5 w-3.5" /></a>}
          </div>
        </div>
        <div className="mb-1 flex shrink-0 flex-col items-center gap-2">
          {!isDirectVideoUrl(clip.video_url) && <button type="button" onClick={toggleAudio} aria-label={audioEnabled ? "Mute This Short" : "Turn Sound On"} className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-xl transition hover:border-sky-200/60 hover:bg-sky-300/15">{audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>}
          <button type="button" onClick={() => onSave(clip)} disabled={saving} aria-label={saved ? 'Remove this Short from Saved Shorts' : 'Save this Short'} aria-pressed={saved} className={`grid h-12 w-12 place-items-center rounded-full border backdrop-blur-xl transition disabled:opacity-50 ${saved ? 'border-sky-200/60 bg-sky-400/25 text-sky-100' : 'border-white/20 bg-black/45 text-white hover:border-sky-200/60 hover:bg-sky-300/15'}`}><span className="sr-only">{saved ? 'Saved' : 'Save'}</span>{saved ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}</button>
          <button type="button" onClick={() => onSave(clip)} disabled={saving} aria-label={saved ? 'Remove this Short from Saved Shorts' : 'Save this Short'} aria-pressed={saved} className={`grid h-12 w-12 place-items-center rounded-full border backdrop-blur-xl transition disabled:opacity-50 ${saved ? 'border-sky-200/60 bg-sky-400/25 text-sky-100' : 'border-white/20 bg-black/45 text-white hover:border-sky-200/60 hover:bg-sky-300/15'}`}>
            {saved ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
            <span className="sr-only">{saved ? 'Saved' : 'Save Short'}</span>
          </button>
          <button type="button" onClick={() => onLike(clip)} aria-label={liked ? 'Unlike this Short' : 'Like this Short'} aria-pressed={liked} className={`grid h-12 w-12 place-items-center rounded-full border backdrop-blur-xl transition ${liked ? 'border-sky-200/60 bg-sky-400/25 text-sky-100' : 'border-white/20 bg-black/45 text-white hover:border-sky-200/60 hover:bg-sky-300/15'}`}><Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} /></button>
          <span className="text-[10px] font-bold tabular-nums text-white/80">{(clip.views_count ?? 0).toLocaleString()}</span>
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
  const [signals, setSignals] = useState<ViewerSignals>(EMPTY_SIGNALS);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [savedClipIds, setSavedClipIds] = useState<string[]>([]);
  const [savingClipId, setSavingClipId] = useState<string | null>(null);
  const [savedClipIds, setSavedClipIds] = useState<string[]>([]);
  const [savingClipId, setSavingClipId] = useState<string | null>(null);
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
    return ranked.sort((a, b) => {
      const score = (clip: DiscoverClip) => {
        const publisher = clip.publisher_name.trim().toLocaleLowerCase();
        return (affinity[publisher] ?? 0) * 0.35
          + (signals.likedIds.includes(clip.id) ? 0.45 : 0)
          - (signals.completedIds.includes(clip.id) ? 0.8 : 0);
      };
      return score(b) - score(a);
    });
  }, [clips, followedPublishers, signals]);

  useEffect(() => {
    if (!requestedClipId || !shorts.length) return;
    const index = shorts.findIndex((clip) => clip.id === requestedClipId);
    if (index < 0) return;
    setActiveIndex(index);
    window.requestAnimationFrame(() => feedRef.current?.querySelector<HTMLElement>('[data-short-index="' + index + '"]')?.scrollIntoView({ block: 'start' }));
  }, [shorts, requestedClipId]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root || !shorts.length) return;
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
  }, [shorts]);

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
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top),1rem)] sm:px-6">
        <div className="flex items-center gap-3">
          <a href="/" aria-label="Back To Cinema Home" className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-xl transition hover:border-sky-200/50 hover:bg-sky-300/15"><ArrowLeft className="h-4 w-4" /></a>
          <div className="rounded-full border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-xl"><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-sky-100">Cinema Shorts</p></div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-[10px] font-bold text-white/85 backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5" /> Fresh · Followed · Diverse</div>
      </header>
      {loading && !clips && <div className="absolute inset-0 grid place-items-center px-5 pt-16"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/65 p-6 backdrop-blur-xl"><LoadingState label="Loading Cinema Shorts" /></div></div>}
      {error && !clips && <div className="absolute inset-0 grid place-items-center px-5 pt-16"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/65 p-6 backdrop-blur-xl"><ErrorState onRetry={reload} description="Cinema Shorts Could Not Load. Try Again In A Moment." /></div></div>}
      {clips && shorts.length === 0 && <section className="cinema-category-live-hero absolute inset-0 grid min-h-0 place-items-center overflow-hidden p-8 pt-20 text-center"><div className="relative z-10 max-w-md"><Clapperboard className="mx-auto h-10 w-10 text-sky-200" /><h2 className="mt-4 text-2xl font-black text-white">The Shorts Feed Is Getting Ready</h2><p className="mt-2 text-sm leading-6 text-slate-300">Approved, playable Shorts from Cinema creators and publishers will appear here. No broken placeholders or unrelated long-form videos.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-bold text-white"><RefreshCw className="h-3.5 w-3.5" /> Refresh Feed</button><a href="/creator/shorts" className="rounded-full bg-[#087cff] px-4 py-2.5 text-xs font-extrabold text-white">Submit A Short</a></div></div></section>}
      {shorts.length > 0 && (
        <div ref={feedRef} className="cinema-shorts-feed h-full w-full overflow-y-auto snap-y snap-mandatory" aria-label="Scroll Cinema Shorts vertically">
          {shorts.map((clip, index) => (
            <div key={clip.id} data-short-index={index} className="cinema-shorts-feed__slot h-[100dvh] min-h-[100dvh] w-full snap-start snap-always">
              <ShortFeedItem clip={clip} active={index === activeIndex} liked={signals.likedIds.includes(clip.id)} saved={savedClipIds.includes(clip.id)} saving={savingClipId === clip.id} audioEnabled={audioEnabled} onLike={toggleLike} onSave={toggleSave} onCompleted={completeClip} onAudioChange={setAudioEnabled} />
            </div>
          ))}
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/55 backdrop-blur"><ChevronDown className="h-3.5 w-3.5" /> Keep Scrolling For More</div>
        </div>
      )}
    </main>
  );
}
